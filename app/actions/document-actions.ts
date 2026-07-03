"use server";

import { createServerSupabase, createServiceSupabase, getCachedUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  Document,
  DocumentInsert,
  ClientDocument,
  Signature,
  SignatureInsert,
  SignatureArea,
} from "@/lib/supabase/database.types";
import bcrypt from "bcryptjs";

import { randomUUID } from "crypto";
import { canCreateDocument, incrementDocumentCreated, decrementDocumentCreated } from "./subscription-actions";
import { sendDocumentCompletionEmail } from "./notification-actions";
import { deductCredit, wasDocumentCreatedWithCredit, refundCredit } from "./credit-actions";
import { getStorage } from "@/lib/storage";
import {
  getDocumentDownloadBaseName,
  getDocumentDownloadName,
} from "@/lib/documents/download-name";

/**
 * Upload a file to Supabase Storage and create a document record
 */
export async function uploadDocument(formData: FormData) {
  try {
    const supabase = await createServerSupabase();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;
    const alias = formData.get("alias") as string | null;

    if (!file || !filename) {
      return { error: "File and filename are required" };
    }

    // Detect file type
    const isPdf = file.type === 'application/pdf';
    const fileType = isPdf ? 'pdf' : 'image';
    let pageCount = 1;

    // For PDF files, check plan permission and count pages
    if (isPdf) {
      const { canUploadPdf } = await import('@/app/actions/subscription-actions');
      const pdfPermission = await canUploadPdf();
      if (!pdfPermission.canUpload) {
        return { error: pdfPermission.error || 'PDF upload not allowed for your plan' };
      }

      try {
        const { PDFDocument } = await import('pdf-lib');
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        pageCount = pdfDoc.getPageCount();
      } catch (err) {
        console.error('Failed to read PDF page count:', err);
        return { error: 'Failed to process PDF file' };
      }
    }

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Check if user can create a new document
    const { canCreate, usingCredit, reason, error: limitError } = await canCreateDocument();
    if (limitError) {
      return { error: limitError };
    }
    if (!canCreate) {
      return { error: reason || "Document creation limit reached" };
    }

    // Generate unique filename using UUID
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const filePath = `${user.id}/${uniqueFilename}`;

    // Upload file to storage with user_id folder structure
    const { error: uploadError } = await getStorage().upload(
      "documents",
      filePath,
      file,
      { contentType: file.type }
    );

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload file" };
    }

    // Store the file path (not public URL since bucket is now private)
    const fileUrl = filePath;

    // Create document record with user_id
    const documentData: DocumentInsert = {
      filename,
      alias: alias && alias.trim() ? alias.trim() : null,
      file_url: fileUrl,
      status: "draft",
      user_id: user.id,
      file_type: fileType,
      page_count: pageCount,
      created_month: new Date().toISOString().slice(0, 7),
    };

    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert(documentData)
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return { error: "Failed to create document record" };
    }

    // Increment monthly usage count (regardless of credit usage)
    // This tracks total documents created this month for analytics
    const { success: usageUpdated, error: usageError } = await incrementDocumentCreated();
    if (!usageUpdated || usageError) {
      console.error("Failed to update usage:", usageError);
      // Don't fail the entire operation, just log the error
    }

    // Handle credit deduction if using credit
    if (usingCredit) {
      const { success, error: creditError } = await deductCredit("create", document.id);
      if (!success || creditError) {
        console.error("Failed to deduct credit:", creditError);

        // Rollback monthly count increment
        await decrementDocumentCreated();

        // Rollback: delete document and storage file
        await supabase.from("documents").delete().eq("id", document.id);
        await getStorage().remove("documents", [filePath]);

        return { error: "크레딧 차감 실패" };
      }
    }

    return { success: true, document };
  } catch (error) {
    console.error("Upload document error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get document by short URL
 */
export async function getDocumentByShortUrl(shortUrl: string): Promise<{
  document: ClientDocument | null;
  signatures: Signature[];
  error?: string;
  isExpired?: boolean;
  isCompleted?: boolean;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("short_url", shortUrl)
      .single();

    if (docError || !document) {
      return { document: null, signatures: [], error: "Document not found" };
    }

    // Transform to ClientDocument (remove password, add requiresPassword)
    const { password, ...documentWithoutPassword } = document;
    const clientDocument: ClientDocument = {
      ...documentWithoutPassword,
      requiresPassword: !!password,
    };

    // Check if document is completed
    const isCompleted = document.status === "completed";

    if (isCompleted) {
      return {
        document: clientDocument,
        signatures: [],
        error: "이미 제출된 문서입니다.",
        isCompleted: true,
      };
    }

    // Check if document is expired
    const isExpired =
      document.expires_at && new Date(document.expires_at) < new Date();

    if (isExpired) {
      return {
        document: clientDocument,
        signatures: [],
        error: "서명 기간이 만료되었습니다.",
        isExpired: true,
      };
    }

    // Get existing signatures
    const { data: signatures, error: sigError } = await supabase
      .from("signatures")
      .select("*")
      .eq("document_id", document.id)
      .order("area_index");

    if (sigError) {
      console.error("Signatures error:", sigError);
      return {
        document: clientDocument,
        signatures: [],
        error: "Failed to load signatures",
      };
    }

    return { document: clientDocument, signatures: signatures || [] };
  } catch (error) {
    console.error("Get document error:", error);
    return {
      document: null,
      signatures: [],
      error: "An unexpected error occurred",
    };
  }
}

type ServiceClient = ReturnType<typeof createServiceSupabase>;

type SignableDocumentRow = {
  id: string;
  status: string;
  publication_id: string | null;
  user_id: string | null;
  filename: string;
  file_url: string;
  file_type: string | null;
  page_count: number | null;
};

type SignablePublicationRow = {
  id: string;
  short_url: string;
  status: string;
  expires_at: string | null;
};

/**
 * Authorization gate for anonymous signer actions.
 *
 * Loads a document (and its publication) with the service-role client and
 * validates that the document is currently signable: it must belong to a
 * publication whose status is `active` and whose `expires_at` is null or in the
 * future. The public RLS policies that used to let the anon key read/write
 * `documents` and `signatures` are being removed (see
 * db/rls-anon-lockdown-migration.sql), so every signer action must funnel its
 * documents/signatures access through the returned service client after passing
 * this gate — the client-provided `documentId` is otherwise unauthenticated.
 *
 * On a validation failure `error` is set. `document`/`service` are still
 * returned whenever the document row exists so idempotent callers (e.g.
 * markDocumentCompleted) can inspect the document status before treating the
 * error as fatal.
 */
async function getSignableDocument(documentId: string): Promise<{
  document?: SignableDocumentRow;
  publication?: SignablePublicationRow;
  service?: ServiceClient;
  error?: string;
}> {
  const service = createServiceSupabase();

  const { data: document, error: docError } = await service
    .from("documents")
    .select(
      "id, status, publication_id, user_id, filename, file_url, file_type, page_count"
    )
    .eq("id", documentId)
    .single();

  if (docError || !document) {
    return { error: "Document not found" };
  }

  if (!document.publication_id) {
    return { error: "Document not found" };
  }

  const { data: publication, error: pubError } = await service
    .from("publications")
    .select("id, short_url, status, expires_at")
    .eq("id", document.publication_id)
    .single();

  if (pubError || !publication) {
    return { document, service, error: "Document not found" };
  }

  if (publication.status !== "active") {
    return { document, service, error: "서명 기간이 만료되었습니다." };
  }

  if (
    publication.expires_at &&
    new Date(publication.expires_at) < new Date()
  ) {
    return { document, service, error: "서명 기간이 만료되었습니다." };
  }

  return { document, publication, service };
}

/**
 * Save a signature for a specific signature area
 */
export async function saveSignature(
  documentId: string,
  areaIndex: number,
  signatureData: string
) {
  try {
    // Validate signer access and switch to the service client (anon RLS removed)
    const gate = await getSignableDocument(documentId);
    if (gate.error || !gate.document || !gate.service) {
      return { error: gate.error ?? "Document not found" };
    }
    const { document, publication, service } = gate;

    // Cannot sign a document that is already completed
    if (document.status === "completed") {
      return { error: "이미 제출된 문서입니다." };
    }

    // Update signature with data, status, and signed_at
    const { error: updateError } = await service
      .from("signatures")
      .update({
        signature_data: signatureData,
        status: "signed",
        signed_at: new Date().toISOString(),
      })
      .eq("document_id", documentId)
      .eq("area_index", areaIndex);

    if (updateError) {
      console.error("Update signature error:", updateError);
      return { error: "Failed to update signature" };
    }

    // Revalidate relevant pages to show updated signature count
    revalidatePath(`/document/${documentId}`);
    if (publication?.short_url) {
      revalidatePath(`/publication/${publication.short_url}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Save signature error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Mark document as completed
 */
export async function markDocumentCompleted(documentId: string) {
  try {
    const gate = await getSignableDocument(documentId);

    // Idempotent: an already-completed document is a success regardless of the
    // publication's current (possibly already-completed) state.
    if (gate.document?.status === "completed") {
      return { success: true };
    }

    if (gate.error || !gate.document || !gate.service) {
      console.error("❌ Document not found:", gate.error);
      return { error: gate.error ?? "Document not found" };
    }

    const { document, publication, service } = gate;

    // Update document status to completed
    const { error } = await service
      .from("documents")
      .update({ status: "completed" })
      .eq("id", documentId);

    if (error) {
      console.error("❌ Mark completed error:", error);
      return { error: "Failed to mark document as completed: " + error.message };
    }

    // 🆕 Send email notification asynchronously (fire-and-forget)
    // Email failures won't block document completion
    sendDocumentCompletionEmail(documentId, document.filename)
      .catch((err) => {
        console.error("❌ Email notification failed (non-blocking):", err);
      });

    // Revalidate relevant pages
    revalidatePath(`/document/${documentId}`);
    revalidatePath('/dashboard');

    // Check if document is part of a publication and auto-complete publication if all documents are done
    if (document.publication_id) {
      if (publication?.short_url) {
        revalidatePath(`/publication/${publication.short_url}`);
      }

      const { checkAndCompletePublication } = await import("./publication-actions");
      checkAndCompletePublication(document.publication_id)
        .catch((err) => {
          console.error("❌ Publication auto-complete check failed (non-blocking):", err);
        });
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Mark completed error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Create signature areas for a document
 */
export async function createSignatureAreas(
  documentId: string,
  signatureAreas: SignatureArea[]
) {
  try {
    const supabase = await createServerSupabase();

    const signatureInserts: SignatureInsert[] = signatureAreas.map(
      (area, index) => ({
        document_id: documentId,
        area_index: index,
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        area_type: area.type || 'signature',
        page_number: (area as any).pageNumber ?? 0,
        status: "pending",
        signature_data: null,
      })
    );

    const { error } = await supabase
      .from("signatures")
      .insert(signatureInserts);

    if (error) {
      console.error("Create signature areas error:", error);
      return { error: "Failed to create signature areas" };
    }

    return { success: true };
  } catch (error) {
    console.error("Create signature areas error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Create a presigned upload URL for signed document
 * This allows anonymous users to upload directly to storage bypassing RLS
 */
export async function createSignedDocumentUploadUrl(
  documentId: string
): Promise<{
  uploadUrl?: string;
  filePath?: string;
  error?: string;
}> {
  try {
    // Validate signer access and use the service client (anon RLS removed)
    const gate = await getSignableDocument(documentId);
    if (gate.error || !gate.document) {
      console.error('[Upload] Document not signable:', gate.error);
      return { error: gate.error ?? 'Document not found' };
    }
    const { document } = gate;

    if (document.status === 'completed') {
      return { error: 'Document already completed' };
    }

    if (!document.user_id) {
      return { error: 'Document owner information missing' };
    }

    const filename = `signed_${documentId}.png`;
    const filePath = `${document.user_id}/${filename}`;

    // Check if file already exists and delete it (cleanup from failed previous attempts)
    const storage = getStorage();
    const { keys: existingFiles } = await storage.list(
      "signed-documents",
      `${document.user_id}/signed_${documentId}`
    );

    if (existingFiles.length > 0) {
      await storage.remove("signed-documents", existingFiles);
    }

    // Create presigned upload URL (valid for 5 minutes)
    const { result, error: urlError } = await storage.createSignedUploadUrl(
      "signed-documents",
      filePath,
      { expiresIn: 300 }
    );

    if (urlError || !result) {
      console.error('[Upload] Failed to create presigned URL:', urlError);
      return { error: 'Failed to create upload URL' };
    }

    return {
      uploadUrl: result.url,
      filePath,
    };
  } catch (error) {
    console.error('[Upload] Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Generate PDF from signed image that was already uploaded by client
 * This avoids the 4.5MB body size limit in Vercel serverless functions
 */
export async function generateSignedPdf(
  documentId: string,
  signedImagePath: string
) {
  const startTime = Date.now();

  try {
    // Validate signer access and use the service client (anon RLS removed)
    const gate = await getSignableDocument(documentId);
    if (gate.error || !gate.document || !gate.service) {
      console.error('[PDF] Document not signable:', gate.error);
      return { error: gate.error ?? 'Document not found' };
    }
    const { document, service } = gate;


    // Restrict to the owner's expected key (storage RLS is not a backstop when
    // using service-role / R2). Prevents reading/deleting arbitrary keys.
    const expectedImagePath = `${document.user_id}/signed_${documentId}.png`;
    if (signedImagePath !== expectedImagePath) {
      console.error("[PDF] Invalid signed image path:", signedImagePath);
      return { error: "Invalid signed image path" };
    }

    // Download the signed image from storage
    const storage = getStorage();
    const { data: imageBytes, contentType: imageType, error: downloadError } =
      await storage.download("signed-documents", signedImagePath);

    if (downloadError || !imageBytes) {
      console.error('[PDF] Failed to download signed image:', downloadError);
      return { error: 'Failed to download signed image' };
    }


    // Generate PDF from signed image with A4 size optimization
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    // Embed image based on MIME type
    let embeddedImage;
    try {
      if (imageType === 'image/png' || !imageType) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (imageType === 'image/jpeg' || imageType === 'image/jpg') {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        // Fallback: try PNG first, then JPG
        try {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } catch {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }
      }
    } catch (embedError) {
      console.error('Failed to embed image:', embedError);
      return { error: 'Failed to process image for PDF' };
    }

    // A4 size in points (595.28 x 841.89)
    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    // Calculate scale to fit image within A4 while maintaining aspect ratio
    const imageWidth = embeddedImage.width;
    const imageHeight = embeddedImage.height;
    const scaleX = A4_WIDTH / imageWidth;
    const scaleY = A4_HEIGHT / imageHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = imageWidth * scale;
    const scaledHeight = imageHeight * scale;

    // Center image on A4 page
    const x = (A4_WIDTH - scaledWidth) / 2;
    const y = (A4_HEIGHT - scaledHeight) / 2;

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(embeddedImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });

    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true, // Enable compression
    });

    const pdfBlob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const pdfFilename = `signed_${documentId}.pdf`;
    const pdfPath = `${document.user_id}/${pdfFilename}`;

    const { error: pdfUploadError } = await storage.upload(
      "signed-documents",
      pdfPath,
      pdfBlob,
      { upsert: true, contentType: 'application/pdf' }
    );

    if (pdfUploadError) {
      console.error('[PDF] PDF upload failed:', pdfUploadError);
      return { error: 'Failed to upload signed document PDF' };
    }


    // Store the storage key (private bucket; URLs are generated on read)
    const { error: updateError } = await service
      .from('documents')
      .update({ signed_file_url: pdfPath, signed_pdf_url: pdfPath })
      .eq('id', documentId);

    if (updateError) {
      console.error('[PDF] Update document error:', updateError);
      await storage.remove("signed-documents", [pdfPath]);
      return { error: 'Failed to update document with signed file URL' };
    }

    // Delete the intermediate PNG file since PDF is now the primary format
    const { error: pngDeleteError } = await storage.remove("signed-documents", [signedImagePath]);

    if (pngDeleteError) {
      // Non-critical: log but don't fail the operation
      console.warn(`[PDF] Failed to cleanup PNG file ${signedImagePath}:`, pngDeleteError);
    } else {
    }


    const totalTime = Date.now() - startTime;

    return { success: true, signedPdfUrl: pdfPath };
  } catch (error) {
    console.error('[PDF] ❌ Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Generate signed PDF from original PDF document by embedding signatures directly
 * This is used for PDF-type documents (not image-type)
 */
export async function generateSignedPdfFromPdf(documentId: string) {
  const startTime = Date.now();

  try {
    // Validate signer access and use the service client (anon RLS removed)
    const gate = await getSignableDocument(documentId);
    if (gate.error || !gate.document || !gate.service) {
      console.error('[PDF-Sign] Document not signable:', gate.error);
      return { error: gate.error ?? 'Document not found' };
    }
    const { document, service } = gate;

    if (document.file_type !== 'pdf') {
      return { error: 'Document is not a PDF type' };
    }

    // Download original PDF
    const storage = getStorage();
    const { data: pdfBytes, error: downloadError } = await storage.download(
      "documents",
      document.file_url
    );

    if (downloadError || !pdfBytes) {
      console.error('[PDF-Sign] Failed to download PDF:', downloadError);
      return { error: 'Failed to download original PDF' };
    }


    // Get all signed signatures for this document
    const { data: signatures, error: sigError } = await service
      .from('signatures')
      .select('*')
      .eq('document_id', documentId)
      .not('signature_data', 'is', null);

    if (sigError) {
      console.error('[PDF-Sign] Failed to get signatures:', sigError);
      return { error: 'Failed to get signatures' };
    }

    // Load original PDF with pdf-lib
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();



    // Embed each signature into the correct page
    for (const sig of signatures) {

      if (!sig.signature_data || sig.x == null || sig.y == null || sig.width == null || sig.height == null) {
        console.warn(`[PDF-Sign] Skipping sig ${sig.id}: missing data or coordinates`);
        continue;
      }

      const pageIndex = sig.page_number ?? 0;
      if (pageIndex < 0 || pageIndex >= pages.length) {
        console.warn(`[PDF-Sign] Invalid page index ${pageIndex} for signature ${sig.id}`);
        continue;
      }

      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Ensure numeric values (Supabase may return strings for numeric columns)
      const sx = parseFloat(String(sig.x));
      const sy = parseFloat(String(sig.y));
      const sw = parseFloat(String(sig.width));
      const sh = parseFloat(String(sig.height));

      // Convert relative coordinates (0-100%) to PDF points
      // Note: PDF coordinate system has origin at bottom-left, web has top-left
      const sigX = (sx / 100) * pageWidth;
      const sigWidth = (sw / 100) * pageWidth;
      const sigHeight = (sh / 100) * pageHeight;
      // Flip Y axis: PDF y=0 is bottom, web y=0 is top
      const sigY = pageHeight - ((sy / 100) * pageHeight) - sigHeight;


      try {
        // Extract base64 data from data URL
        const base64Data = sig.signature_data.split(',')[1];
        if (!base64Data) {
          console.warn(`[PDF-Sign] No base64 data found for sig ${sig.id}`);
          return { error: `Failed to process signature data for sig ${sig.id}` };
        }


        const sigBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Embed signature image (PNG format from canvas)
        let embeddedSig;
        try {
          embeddedSig = await pdfDoc.embedPng(sigBytes);
        } catch (pngErr) {
          console.warn(`[PDF-Sign] PNG embed failed for sig ${sig.id}, trying JPG`);
          embeddedSig = await pdfDoc.embedJpg(sigBytes);
        }

        // Calculate aspect-ratio-preserving dimensions within the area
        const sigAspect = embeddedSig.width / embeddedSig.height;
        const areaAspect = sigWidth / sigHeight;
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

        if (sigAspect > areaAspect) {
          drawWidth = sigWidth;
          drawHeight = drawWidth / sigAspect;
          offsetY = (sigHeight - drawHeight) / 2;
        } else {
          drawHeight = sigHeight;
          drawWidth = drawHeight * sigAspect;
          offsetX = (sigWidth - drawWidth) / 2;
        }

        page.drawImage(embeddedSig, {
          x: sigX + offsetX,
          y: sigY + offsetY,
          width: drawWidth,
          height: drawHeight,
        });

      } catch (embedErr) {
        console.error(`[PDF-Sign] Failed to embed signature ${sig.id}:`, embedErr);
        return { error: `Failed to embed signature on page ${pageIndex}` };
      }
    }

    // Save the signed PDF
    const signedPdfBytes = await pdfDoc.save();

    const pdfBlob = new Blob([signedPdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const pdfFilename = `signed_${documentId}.pdf`;
    const pdfPath = `${document.user_id}/${pdfFilename}`;

    // Upload signed PDF
    const { error: uploadError } = await storage.upload(
      "signed-documents",
      pdfPath,
      pdfBlob,
      { upsert: true, contentType: 'application/pdf' }
    );

    if (uploadError) {
      console.error('[PDF-Sign] Upload failed:', uploadError);
      return { error: 'Failed to upload signed PDF' };
    }

    // Store the storage key (private bucket; URLs are generated on read)
    const { error: updateError } = await service
      .from('documents')
      .update({ signed_file_url: pdfPath, signed_pdf_url: pdfPath })
      .eq('id', documentId);

    if (updateError) {
      console.error('[PDF-Sign] Update error:', updateError);
      await storage.remove("signed-documents", [pdfPath]);
      return { error: 'Failed to update document' };
    }

    const totalTime = Date.now() - startTime;

    return { success: true, signedPdfUrl: pdfPath };
  } catch (error) {
    console.error('[PDF-Sign] ❌ Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Update signature areas for a document using PostgreSQL transaction
 */
export async function updateSignatureAreas(
  documentId: string,
  signatureAreas: SignatureArea[]
) {
  try {
    const supabase = await createServerSupabase();
    
    // Use PostgreSQL function with transaction for atomic operation
    const mappedAreas = signatureAreas.map((area) => ({
      ...area,
      area_type: area.type || 'signature',
    }));
    const { data, error } = await supabase.rpc('update_signature_areas_transaction', {
      p_document_id: documentId,
      p_signature_areas: mappedAreas
    });

    if (error) {
      console.error("Transaction function error:", error);
      return { error: "Failed to update signature areas: " + error.message };
    }

    if (data && !data.success) {
      console.error("Function returned error:", data.error);
      return { error: "Database transaction failed: " + data.error };
    }

    
    // Revalidate document detail page
    revalidatePath(`/document/${documentId}`);
    return { success: true };
  } catch (error) {
    console.error("Update signature areas error:", error);
    return { error: "An unexpected error occurred while updating signature areas" };
  }
}

/**
 * Verify document password
 */
export async function verifyDocumentPassword(
  shortUrl: string,
  password: string
) {
  try {
    const supabase = await createServerSupabase();

    // Get document with password
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("password")
      .eq("short_url", shortUrl)
      .single();

    if (docError || !document) {
      return { error: "Document not found" };
    }

    // Check if password matches (hash)
    const isValid = document.password
      ? await bcrypt.compare(password, document.password)
      : false;

    return { success: true, isValid };
  } catch (error) {
    console.error("Verify password error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get signed URL for document file (for publications system)
 * Password verification should be done at publication level before calling this
 */
export async function getDocumentFileSignedUrl(
  documentId: string
): Promise<{
  signedUrl: string | null;
  error?: string;
}> {
  try {
    // Validate signer access and use the service client (anon RLS removed)
    const gate = await getSignableDocument(documentId);
    if (gate.error || !gate.document) {
      return { signedUrl: null, error: gate.error ?? "Document not found" };
    }
    const { document } = gate;

    // Check completion
    if (document.status === "completed") {
      return { signedUrl: null, error: "Document already completed" };
    }

    // Generate signed URL (1 hour validity)
    const { url, error: signError } = await getStorage().createSignedDownloadUrl(
      "documents",
      document.file_url,
      { expiresIn: 3600 }
    );

    if (signError || !url) {
      console.error("Error creating signed URL:", signError);
      return { signedUrl: null, error: "Failed to generate signed URL" };
    }

    return { signedUrl: url };
  } catch (error) {
    console.error("Get document file signed URL error:", error);
    return { signedUrl: null, error: "An unexpected error occurred" };
  }
}

/**
 * Owner-scoped presigned URL for the original document file (for preview in the
 * document detail page). Replaces client-side RLS storage.download so the
 * browser never talks to storage directly.
 */
export async function getOwnedDocumentFileUrl(documentId: string): Promise<{
  url: string | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { url: null, error: "User not authenticated" };
    }

    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, file_url")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document?.file_url) {
      return { url: null, error: "Document not found" };
    }

    const { url, error } = await getStorage().createSignedDownloadUrl(
      "documents",
      document.file_url,
      { expiresIn: 3600 }
    );
    if (error || !url) {
      return { url: null, error: error ?? "Failed to generate URL" };
    }
    return { url };
  } catch (error) {
    console.error("Get owned document file URL error:", error);
    return { url: null, error: "An unexpected error occurred" };
  }
}

/**
 * Get document by ID (for server components)
 */
export async function getDocumentById(id: string): Promise<{
  document: Document | null;
  signatures: Signature[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (docError || !document) {
      return { document: null, signatures: [], error: "Document not found" };
    }

    // Get existing signatures (including signature areas)
    const { data: signatures, error: sigError } = await supabase
      .from("signatures")
      .select("*")
      .eq("document_id", document.id)
      .order("area_index");

    if (sigError) {
      console.error("Signatures error:", sigError);
      return { document, signatures: [], error: "Failed to load signatures" };
    }

    return { document, signatures: signatures || [] };
  } catch (error) {
    console.error("Get document by ID error:", error);
    return {
      document: null,
      signatures: [],
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get user's documents with pagination support (for SSR - first page)
 */
export async function getUserDocuments(
  page: number = 1,
  limit: number = 12,
  status?: "draft" | "published" | "completed"
): Promise<{
  documents: Document[];
  hasMore: boolean;
  total: number;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user (request-cached)
    const { user, error: authError } = await getCachedUser();
    if (authError || !user) {
      return {
        documents: [],
        hasMore: false,
        total: 0,
        error: "User not authenticated",
      };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query (exclude soft-deleted documents)
    let query = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: documents, error: docError, count } = await query;

    if (docError) {
      console.error("Get user documents error:", docError);
      return {
        documents: [],
        hasMore: false,
        total: 0,
        error: "Failed to load documents",
      };
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      documents: documents || [],
      hasMore,
      total,
    };
  } catch (error) {
    console.error("Get user documents error:", error);
    return {
      documents: [],
      hasMore: false,
      total: 0,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get user's documents for client-side loading (for CSR - infinite scroll)
 */
export async function getUserDocumentsClient(
  page: number,
  limit: number = 12,
  status?: "draft" | "published" | "completed"
): Promise<{
  documents: Document[];
  hasMore: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user (request-cached)
    const { user, error: authError } = await getCachedUser();
    if (authError || !user) {
      return { documents: [], hasMore: false, error: "User not authenticated" };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query with optimized field selection (exclude soft-deleted documents)
    let query = supabase
      .from("documents")
      .select("id, filename, alias, status, signed_file_url, signed_pdf_url, created_at, publication_id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data: documents, error: docError, count } = await query;

    if (docError) {
      console.error("Get user documents client error:", docError);
      return {
        documents: [],
        hasMore: false,
        error: "Failed to load documents",
      };
    }

    const total = count || 0;
    const hasMore = offset + limit < total;

    return {
      documents: (documents || []) as unknown as Document[],
      hasMore,
    };
  } catch (error) {
    console.error("Get user documents client error:", error);
    return {
      documents: [],
      hasMore: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get signed URLs for preview and download of a completed document.
 */
export async function getSignedDocumentUrls(documentId: string): Promise<{
  previewUrl: string | null;
  downloadUrl: string | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        previewUrl: null,
        downloadUrl: null,
        error: "User not authenticated",
      };
    }

    // Get document to verify ownership and get signed file path
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, user_id, filename, alias, signed_file_url, signed_pdf_url")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return {
        previewUrl: null,
        downloadUrl: null,
        error: "Document not found",
      };
    }

    let previewUrl: string | null = null;
    let downloadUrl: string | null = null;

    const extractPath = (value: string) => {
      if (!value) return null;
      if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
          const url = new URL(value);
          const parts = url.pathname.split("/");
          const index = parts.indexOf("signed-documents");
          if (index === -1) return null;
          return parts.slice(index + 1).join("/");
        } catch {
          return null;
        }
      }

      const trimmed = value.startsWith("signed-documents/")
        ? value.substring("signed-documents/".length)
        : value;
      return trimmed;
    };

    const storage = getStorage();

    if (document.signed_file_url) {
      const filePath = extractPath(document.signed_file_url);
      if (filePath) {
        const { url, error: previewError } = await storage.createSignedDownloadUrl(
          "signed-documents",
          filePath,
          { expiresIn: 3600 }
        );
        if (previewError) {
          console.error("Error creating preview URL:", previewError);
        } else {
          previewUrl = url;
        }
      }
    }

    if (document.signed_pdf_url) {
      const pdfPath = extractPath(document.signed_pdf_url);
      if (pdfPath) {
        const downloadName = getDocumentDownloadName(
          "pdf",
          document.alias,
          document.filename
        );
        const { url, error: downloadError } = await storage.createSignedDownloadUrl(
          "signed-documents",
          pdfPath,
          { expiresIn: 3600, downloadName }
        );
        if (downloadError) {
          console.error("Error creating download URL:", downloadError);
        } else {
          downloadUrl = url;
        }
      }
    }

    // Fallback: if no dedicated download URL, reuse preview (e.g., legacy data)
    if (!downloadUrl && document.signed_file_url) {
      const filePath = extractPath(document.signed_file_url);
      if (filePath) {
        const fallbackName = getDocumentDownloadName(
          "png",
          document.alias,
          document.filename
        );
        const { url, error: fallbackError } = await storage.createSignedDownloadUrl(
          "signed-documents",
          filePath,
          { expiresIn: 3600, downloadName: fallbackName }
        );
        if (fallbackError) {
          console.error("Error creating fallback download URL:", fallbackError);
        } else {
          downloadUrl = url;
        }
      }
    }

    if (!previewUrl && !downloadUrl) {
      return {
        previewUrl: null,
        downloadUrl: null,
        error: "Signed document not available",
      };
    }

    return { previewUrl, downloadUrl };
  } catch (error) {
    console.error("Get signed document URLs error:", error);
    return {
      previewUrl: null,
      downloadUrl: null,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get a short-lived signed download URL of a completed document for the
 * anonymous signer (no auth). Access is scoped to the publication referenced
 * by `shortUrl`, and the document must belong to that publication and be
 * completed. Password-protected publications require server-side re-verification.
 */
export async function getSignedDocumentUrlForSigner(
  shortUrl: string,
  documentId: string,
  password?: string | null
): Promise<{ downloadUrl: string | null; error?: string }> {
  try {
    // Service role: anonymous signers have no auth session
    const supabaseService = createServiceSupabase();

    // 1. Resolve publication by short URL
    const { data: publication, error: pubError } = await supabaseService
      .from("publications")
      .select("id, password")
      .eq("short_url", shortUrl)
      .single();

    if (pubError || !publication) {
      return { downloadUrl: null, error: "Publication not found" };
    }

    // 2. Password gate (server-side re-verification, not just client state)
    if (publication.password) {
      if (!password) {
        return { downloadUrl: null, error: "Password required" };
      }
      const isValid = await bcrypt.compare(password, publication.password);
      if (!isValid) {
        return { downloadUrl: null, error: "Invalid password" };
      }
    }

    // 3. Document must belong to this publication and be completed (IDOR defense)
    const { data: document, error: docError } = await supabaseService
      .from("documents")
      .select("id, filename, alias, status, signed_pdf_url, signed_file_url, publication_id")
      .eq("id", documentId)
      .eq("publication_id", publication.id)
      .single();

    if (docError || !document) {
      return { downloadUrl: null, error: "Document not found" };
    }

    if (document.status !== "completed") {
      return { downloadUrl: null, error: "Document not completed" };
    }

    const extractPath = (value: string) => {
      if (!value) return null;
      if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
          const url = new URL(value);
          const parts = url.pathname.split("/");
          const index = parts.indexOf("signed-documents");
          if (index === -1) return null;
          return parts.slice(index + 1).join("/");
        } catch {
          return null;
        }
      }
      return value.startsWith("signed-documents/")
        ? value.substring("signed-documents/".length)
        : value;
    };

    // Prefer the PDF artifact; fall back to legacy image artifact
    const isPdf = !!document.signed_pdf_url;
    const source = document.signed_pdf_url || document.signed_file_url;
    const path = source ? extractPath(source) : null;

    if (!path) {
      return { downloadUrl: null, error: "Signed document not available" };
    }

    const downloadName = getDocumentDownloadName(
      isPdf ? "pdf" : "png",
      document.alias,
      document.filename
    );

    // 4. Issue short-lived (5 min) signed URL with download disposition
    const { url, error: urlError } = await getStorage().createSignedDownloadUrl(
      "signed-documents",
      path,
      { expiresIn: 300, downloadName }
    );

    if (urlError || !url) {
      console.error("Error creating signer download URL:", urlError);
      return { downloadUrl: null, error: "Failed to generate download URL" };
    }

    return { downloadUrl: url };
  } catch (error) {
    console.error("Get signer download URL error:", error);
    return { downloadUrl: null, error: "An unexpected error occurred" };
  }
}

/**
 * Resolve a stored signed-document URL/path into a storage object path.
 */
function extractSignedDocumentPath(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const url = new URL(value);
      const parts = url.pathname.split("/");
      const index = parts.indexOf("signed-documents");
      if (index === -1) return null;
      return parts.slice(index + 1).join("/");
    } catch {
      return null;
    }
  }
  return value.startsWith("signed-documents/")
    ? value.substring("signed-documents/".length)
    : value;
}

/**
 * Get a single download for the anonymous signer covering ALL completed
 * documents of a publication. One completed document → a direct signed URL;
 * multiple → a zip archive (base64) bundling each signed document.
 * Access is scoped to the publication and gated by its password.
 */
export async function getSignedDocumentBundleForSigner(
  shortUrl: string,
  password?: string | null
): Promise<{
  downloadUrl?: string | null;
  zipBase64?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const supabaseService = createServiceSupabase();

    // 1. Resolve publication by short URL
    const { data: publication, error: pubError } = await supabaseService
      .from("publications")
      .select("id, name, password")
      .eq("short_url", shortUrl)
      .single();

    if (pubError || !publication) {
      return { error: "Publication not found" };
    }

    // 2. Password gate (server-side re-verification)
    if (publication.password) {
      if (!password) {
        return { error: "Password required" };
      }
      const isValid = await bcrypt.compare(password, publication.password);
      if (!isValid) {
        return { error: "Invalid password" };
      }
    }

    // 3. All completed documents belonging to this publication
    const { data: documents, error: docError } = await supabaseService
      .from("documents")
      .select("id, filename, alias, status, signed_pdf_url, signed_file_url")
      .eq("publication_id", publication.id)
      .eq("status", "completed");

    if (docError) {
      return { error: "Failed to load documents" };
    }

    const completed = (documents ?? [])
      .map((doc) => {
        const isPdf = !!doc.signed_pdf_url;
        const path = extractSignedDocumentPath(
          doc.signed_pdf_url || doc.signed_file_url
        );
        const baseName = getDocumentDownloadBaseName(doc.alias, doc.filename);
        return path ? { path, isPdf, baseName } : null;
      })
      .filter((d): d is { path: string; isPdf: boolean; baseName: string } => !!d);

    if (completed.length === 0) {
      return { error: "Signed document not available" };
    }

    const storage = getStorage();

    // 4a. Single document → direct signed URL (no zip)
    if (completed.length === 1) {
      const { path, isPdf, baseName } = completed[0];
      const downloadName = `${baseName}.${isPdf ? "pdf" : "png"}`;
      const { url, error: urlError } = await storage.createSignedDownloadUrl(
        "signed-documents",
        path,
        { expiresIn: 300, downloadName }
      );
      if (urlError || !url) {
        console.error("Error creating signer download URL:", urlError);
        return { error: "Failed to generate download URL" };
      }
      return { downloadUrl: url };
    }

    // 4b. Multiple documents → zip archive
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const usedNames = new Set<string>();

    for (const { path, isPdf, baseName } of completed) {
      const { data: bytes, error: dlError } = await storage.download(
        "signed-documents",
        path
      );
      if (dlError || !bytes) {
        console.error(`Failed to download ${path} for zip:`, dlError);
        continue;
      }
      let name = `${baseName}.${isPdf ? "pdf" : "png"}`;
      let counter = 2;
      while (usedNames.has(name)) {
        name = `${baseName} (${counter}).${isPdf ? "pdf" : "png"}`;
        counter += 1;
      }
      usedNames.add(name);
      zip.file(name, bytes);
    }

    if (usedNames.size === 0) {
      return { error: "Signed document not available" };
    }

    const zipBase64 = await zip.generateAsync({ type: "base64" });
    const publicationName = (publication.name || "서명문서").replace(
      /[\\/:*?"<>|]/g,
      "_"
    );

    return { zipBase64, filename: `${publicationName}_서명완료.zip` };
  } catch (error) {
    console.error("Get signer document bundle error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a document (only draft status documents can be deleted)
 */
export async function deleteDocument(documentId: string): Promise<{
  success?: boolean;
  error?: string;
}> {

  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      return { error: "User not authenticated" };
    }

    if (!user) {
      return { error: "User not authenticated" };
    }


    // Get document to verify ownership and status
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, user_id, status, file_url, signed_file_url, signed_pdf_url")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError) {
      return { error: "Document not found" };
    }

    if (!document) {
      return { error: "Document not found" };
    }


    // Check document status and handle accordingly
    if (document.status === "published") {
      return { error: "Published documents cannot be deleted" };
    }

    // Handle completed documents with soft delete (no count decrement)
    if (document.status === "completed") {
      const { error: softDeleteError } = await supabase
        .from("documents")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("id", documentId)
        .eq("user_id", user.id);

      if (softDeleteError) {
        console.error("❌ SERVER: Soft delete error:", softDeleteError);
        return { error: "Failed to delete document" };
      }

      // Reclaim storage: the DB row remains as a soft-delete tombstone, but the
      // underlying files are no longer needed. Best-effort — failures here must
      // not fail the delete (the row is already marked deleted).
      try {
        const storage = getStorage();

        if (document.file_url) {
          const { error: docStorageError } = await storage.remove("documents", [
            document.file_url,
          ]);
          if (docStorageError) {
            console.error("⚠️ SERVER: Soft delete - documents storage cleanup failed:", docStorageError);
          }
        }

        // signed-documents: deterministic path + any paths embedded in the URLs.
        const signedPaths = new Set<string>([
          `${document.user_id}/signed_${documentId}.pdf`,
          `${document.user_id}/signed_${documentId}.png`, // intermediate artifact, if any
        ]);
        const s1 = extractSignedDocumentPath(document.signed_file_url);
        const s2 = extractSignedDocumentPath(document.signed_pdf_url);
        if (s1) signedPaths.add(s1);
        if (s2) signedPaths.add(s2);

        const { error: signedStorageError } = await storage.remove(
          "signed-documents",
          [...signedPaths]
        );
        if (signedStorageError) {
          console.error("⚠️ SERVER: Soft delete - signed-documents storage cleanup failed:", signedStorageError);
        }
      } catch (storageError) {
        console.error("⚠️ SERVER: Soft delete - storage cleanup error:", storageError);
        // Non-critical: document is already soft-deleted.
      }

      // Revalidate pages
      revalidatePath('/dashboard');
      revalidatePath(`/document/${documentId}`);

      return { success: true };
    }

    // Handle draft documents with hard delete + count decrement
    if (document.status === "draft") {
      // Check if document was created with credit BEFORE deleting (need documentId to query)
      const { usedCredit } = await wasDocumentCreatedWithCredit(documentId, "create");

      // Refund credit if document was created with credit (BEFORE deleting document!)
      if (usedCredit) {
        const { success: refundSuccess, error: refundError } = await refundCredit("create", documentId);
        if (!refundSuccess || refundError) {
          console.error("⚠️ SERVER: Failed to refund credit:", refundError);
          // Don't fail the entire operation, just log the error
        }
      }

      // Delete associated signatures first (cascade delete)
      const { error: sigError } = await supabase
        .from("signatures")
        .delete()
        .eq("document_id", documentId);

      if (sigError) {
        console.error("❌ SERVER: Delete signatures error:", sigError);
        return { error: "Failed to delete signature areas" };
      }

      // Delete the document file from storage
      if (document.file_url) {
        try {
          // file_url now contains the storage path: {user_id}/{filename}
          const { error: storageError } = await getStorage().remove(
            "documents",
            [document.file_url]
          );

          if (storageError) {
            console.error("⚠️ SERVER: Delete file error:", storageError);
            // Continue with document deletion even if file deletion fails
          }
        } catch (storageError) {
          console.error("⚠️ SERVER: Error parsing file URL:", storageError);
          // Continue with document deletion
        }
      }

      // Delete the document record
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentId)
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("❌ SERVER: Delete document error:", deleteError);
        return { error: "Failed to delete document" };
      }

      // Decrement monthly usage count for draft documents only
      const { success: usageUpdated, error: usageError } = await decrementDocumentCreated();
      if (!usageUpdated || usageError) {
        console.error("⚠️ SERVER: Failed to update usage:", usageError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Revalidate any relevant pages
    revalidatePath('/dashboard');
    revalidatePath(`/document/${documentId}`);

    return { success: true };
  } catch (error) {
    console.error("❌ SERVER: Unexpected error in deleteDocument:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's document counts by status (optimized for performance)
 */
export async function getUserDocumentCounts(): Promise<{
  all: number;
  draft: number;
  published: number;
  completed: number;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        all: 0,
        draft: 0,
        published: 0,
        completed: 0,
        error: "User not authenticated",
      };
    }

    // Get counts for all statuses in parallel using count only queries (exclude soft-deleted)
    const [allResult, draftResult, publishedResult, completedResult] = await Promise.all([
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("status", "draft"),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("status", "published"),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .eq("status", "completed"),
    ]);

    return {
      all: allResult.count || 0,
      draft: draftResult.count || 0,
      published: publishedResult.count || 0,
      completed: completedResult.count || 0,
    };
  } catch (error) {
    console.error("Get document counts error:", error);
    return {
      all: 0,
      draft: 0,
      published: 0,
      completed: 0,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get dashboard data optimized - combines counts and documents in minimal queries
 */
export async function getDashboardData(
  page: number = 1,
  limit: number = 12,
  status?: "draft" | "published" | "completed"
): Promise<{
  documents: Document[];
  hasMore: boolean;
  total: number;
  counts: {
    all: number;
    draft: number;
    published: number;
    completed: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user (request-cached)
    const { user, error: authError } = await getCachedUser();
    if (authError || !user) {
      return {
        documents: [],
        hasMore: false,
        total: 0,
        counts: { all: 0, draft: 0, published: 0, completed: 0 },
        error: "User not authenticated",
      };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Execute both queries in parallel for optimal performance
    const [documentsResult, countsResult] = await Promise.all([
      // Get documents with optimized field selection (exclude soft-deleted)
      (() => {
        let query = supabase
          .from("documents")
          .select("id, filename, alias, status, created_at, signed_file_url, signed_pdf_url, publication_id", { count: "exact" })
          .eq("user_id", user.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        return query;
      })(),

      // Get status counts using a single aggregation query (exclude soft-deleted)
      supabase
        .from("documents")
        .select("status")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
    ]);

    if (documentsResult.error) {
      console.error("Documents query error:", documentsResult.error);
      return {
        documents: [],
        hasMore: false,
        total: 0,
        counts: { all: 0, draft: 0, published: 0, completed: 0 },
        error: "Failed to load documents",
      };
    }

    if (countsResult.error) {
      console.error("Counts query error:", countsResult.error);
      return {
        documents: (documentsResult.data || []) as unknown as Document[],
        hasMore: false,
        total: documentsResult.count || 0,
        counts: { all: 0, draft: 0, published: 0, completed: 0 },
        error: "Failed to load document counts",
      };
    }

    // Process counts from status data
    const statusCounts = (countsResult.data || []).reduce(
      (acc, doc) => {
        acc.all++;
        if (doc.status === "draft") acc.draft++;
        else if (doc.status === "published") acc.published++;
        else if (doc.status === "completed") acc.completed++;
        return acc;
      },
      { all: 0, draft: 0, published: 0, completed: 0 }
    );

    const total = documentsResult.count || 0;
    const hasMore = offset + limit < total;

    return {
      documents: (documentsResult.data || []) as unknown as Document[],
      hasMore,
      total,
      counts: statusCounts,
    };
  } catch (error) {
    console.error("Get dashboard data error:", error);
    return {
      documents: [],
      hasMore: false,
      total: 0,
      counts: { all: 0, draft: 0, published: 0, completed: 0 },
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Update document alias
 */
export async function updateDocumentAlias(
  documentId: string,
  alias: string | null
): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, user_id")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return { error: "Document not found" };
    }

    // Update document alias
    const { error: updateError } = await supabase
      .from("documents")
      .update({ alias })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Update alias error:", updateError);
      return { error: "Failed to update document alias" };
    }

    // Revalidate relevant pages
    revalidatePath(`/document/${documentId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update document alias error:", error);
    return { error: "An unexpected error occurred" };
  }
}
