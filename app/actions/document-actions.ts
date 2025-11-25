"use server";

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
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

    // Upload file to Supabase Storage with user_id folder structure
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

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
        await supabase.storage.from("documents").remove([filePath]);

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

/**
 * Save a signature for a specific signature area
 */
export async function saveSignature(
  documentId: string,
  areaIndex: number,
  signatureData: string
) {
  try {
    const supabase = await createServerSupabase();

    // Get document to find publication_id for revalidation
    const { data: document } = await supabase
      .from("documents")
      .select("publication_id")
      .eq("id", documentId)
      .single();

    // Update signature with data, status, and signed_at
    const { error: updateError } = await supabase
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
    if (document?.publication_id) {
      // Get publication short_url for revalidation
      const { data: publication } = await supabase
        .from("publications")
        .select("short_url")
        .eq("id", document.publication_id)
        .single();

      if (publication?.short_url) {
        revalidatePath(`/publication/${publication.short_url}`);
      }
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
    const supabase = await createServerSupabase();

    // First check if document exists and is in the right state
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, status, filename, publication_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("❌ Document not found:", docError);
      return { error: "Document not found" };
    }

    if (document.status === "completed") {
      return { success: true };
    }

    // Update document status to completed
    const { error } = await supabase
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
      // Get publication short_url for revalidation
      const { data: publication } = await supabase
        .from("publications")
        .select("short_url")
        .eq("id", document.publication_id)
        .single();

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
  token?: string;
  error?: string;
}> {
  try {
    // Use service role to bypass RLS for presigned URL generation
    const supabaseService = createServiceSupabase();
    const supabase = await createServerSupabase();

    // Get document to verify existence and get user_id
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id, status')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('[Upload] Document not found:', docError);
      return { error: 'Document not found' };
    }

    if (document.status === 'completed') {
      return { error: 'Document already completed' };
    }

    if (!document.user_id) {
      return { error: 'Document owner information missing' };
    }

    const filename = `signed_${documentId}.png`;
    const filePath = `${document.user_id}/${filename}`;

    // Check if file already exists and delete it (cleanup from failed previous attempts)
    const { data: existingFiles } = await supabaseService.storage
      .from('signed-documents')
      .list(document.user_id, {
        search: `signed_${documentId}`
      });

    if (existingFiles && existingFiles.length > 0) {
      console.log(`[Upload] Cleaning up ${existingFiles.length} existing files for document ${documentId}`);
      const filesToDelete = existingFiles.map(f => `${document.user_id}/${f.name}`);
      await supabaseService.storage
        .from('signed-documents')
        .remove(filesToDelete);
    }

    // Create presigned upload URL (valid for 5 minutes)
    const { data, error: urlError } = await supabaseService.storage
      .from('signed-documents')
      .createSignedUploadUrl(filePath);

    if (urlError || !data) {
      console.error('[Upload] Failed to create presigned URL:', urlError);
      return { error: 'Failed to create upload URL' };
    }

    return {
      uploadUrl: data.signedUrl,
      filePath,
      token: data.token,
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
  console.log(`[PDF] Starting PDF generation for ${documentId}`);

  try {
    // Use service role to bypass RLS
    const supabaseService = createServiceSupabase();
    const supabase = await createServerSupabase();

    // Get document to verify existence and get user_id
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('[PDF] Document not found:', docError);
      return { error: 'Document not found' };
    }

    console.log(`[PDF] Document verified (${Date.now() - startTime}ms)`);

    // Download the signed image from storage
    const { data: imageData, error: downloadError } = await supabaseService.storage
      .from('signed-documents')
      .download(signedImagePath);

    if (downloadError || !imageData) {
      console.error('[PDF] Failed to download signed image:', downloadError);
      return { error: 'Failed to download signed image' };
    }

    const arrayBuffer = await imageData.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);
    console.log(
      `[PDF] Image downloaded: ${imageData.type || 'unknown'}, ${Math.round(imageData.size / 1024)}KB (${Date.now() - startTime}ms)`
    );

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabaseService.storage.from('signed-documents').getPublicUrl(signedImagePath);

    // Generate PDF from signed image with A4 size optimization
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    // Embed image based on MIME type
    let embeddedImage;
    try {
      if (imageData.type === 'image/png' || !imageData.type) {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (imageData.type === 'image/jpeg' || imageData.type === 'image/jpg') {
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
    console.log(`[PDF] PDF generated: ${Math.round(pdfBytes.length / 1024)}KB (${Date.now() - startTime}ms)`);

    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfFilename = `signed_${documentId}.pdf`;
    const pdfPath = `${document.user_id}/${pdfFilename}`;

    const { error: pdfUploadError } = await supabaseService.storage
      .from('signed-documents')
      .upload(pdfPath, pdfBlob, {
        upsert: true,
        contentType: 'application/pdf',
      });

    if (pdfUploadError) {
      console.error('[PDF] PDF upload failed:', pdfUploadError);
      return { error: 'Failed to upload signed document PDF' };
    }

    console.log(`[PDF] PDF uploaded successfully (${Date.now() - startTime}ms)`);

    const {
      data: { publicUrl: pdfPublicUrl },
    } = supabaseService.storage.from('signed-documents').getPublicUrl(pdfPath);

    // Update document with signed file URLs
    const { error: updateError } = await supabase
      .from('documents')
      .update({ signed_file_url: publicUrl, signed_pdf_url: pdfPublicUrl })
      .eq('id', documentId);

    if (updateError) {
      console.error('[PDF] Update document error:', updateError);
      await supabaseService.storage
        .from('signed-documents')
        .remove([pdfPath]);
      return { error: 'Failed to update document with signed file URL' };
    }

    console.log(`[PDF] Database updated (${Date.now() - startTime}ms)`);

    const totalTime = Date.now() - startTime;
    console.log(`[PDF] ✅ Complete! Total time: ${totalTime}ms`);

    return { success: true, signedFileUrl: publicUrl, signedPdfUrl: pdfPublicUrl };
  } catch (error) {
    console.error('[PDF] ❌ Unexpected error:', error);
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
    const { data, error } = await supabase.rpc('update_signature_areas_transaction', {
      p_document_id: documentId,
      p_signature_areas: signatureAreas
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
    // Use service role to bypass RLS for signed URL generation
    const supabaseService = createServiceSupabase();
    const supabase = await createServerSupabase();

    // Get document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, file_url, status")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      return { signedUrl: null, error: "Document not found" };
    }

    // Check completion
    if (document.status === "completed") {
      return { signedUrl: null, error: "Document already completed" };
    }

    // Generate signed URL (1 hour validity) using service role to bypass RLS
    const { data, error: signError } = await supabaseService.storage
      .from("documents")
      .createSignedUrl(document.file_url, 3600);

    if (signError || !data) {
      console.error("Error creating signed URL:", signError);
      return { signedUrl: null, error: "Failed to generate signed URL" };
    }

    return { signedUrl: data.signedUrl };
  } catch (error) {
    console.error("Get document file signed URL error:", error);
    return { signedUrl: null, error: "An unexpected error occurred" };
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
      documents: documents || [],
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
      .select("id, user_id, filename, signed_file_url, signed_pdf_url")
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

    const storage = supabase.storage.from("signed-documents");

    if (document.signed_file_url) {
      const filePath = extractPath(document.signed_file_url);
      if (filePath) {
        const { data, error: previewError } = await storage.createSignedUrl(
          filePath,
          3600
        );
        if (previewError) {
          console.error("Error creating preview URL:", previewError);
        } else {
          previewUrl = data?.signedUrl ?? null;
        }
      }
    }

    if (document.signed_pdf_url) {
      const pdfPath = extractPath(document.signed_pdf_url);
      if (pdfPath) {
        const originalName =
          document.filename.replace(/\.[^/.]+$/, "") || document.filename;
        const downloadName = `서명완료_${originalName}.pdf`;
        const { data, error: downloadError } = await storage.createSignedUrl(
          pdfPath,
          3600,
          { download: downloadName }
        );
        if (downloadError) {
          console.error("Error creating download URL:", downloadError);
        } else {
          downloadUrl = data?.signedUrl ?? null;
        }
      }
    }

    // Fallback: if no dedicated download URL, reuse preview (e.g., legacy data)
    if (!downloadUrl && document.signed_file_url) {
      const filePath = extractPath(document.signed_file_url);
      if (filePath) {
        const originalName = document.filename.replace(/\.[^/.]+$/, "");
        const fallbackName = `서명완료_${originalName}.png`;
        const { data, error: fallbackError } = await storage.createSignedUrl(
          filePath,
          3600,
          { download: fallbackName }
        );
        if (fallbackError) {
          console.error("Error creating fallback download URL:", fallbackError);
        } else {
          downloadUrl = data?.signedUrl ?? null;
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
      .select("id, user_id, status, file_url")
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
          const { error: storageError } = await supabase.storage
            .from("documents")
            .remove([document.file_url]);

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

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
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
        documents: documentsResult.data || [],
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
      documents: documentsResult.data || [],
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
