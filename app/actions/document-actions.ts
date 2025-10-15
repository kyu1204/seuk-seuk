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
import { canCreateDocument, canPublishDocument, incrementDocumentCreated, decrementDocumentCreated } from "./subscription-actions";
import { sendDocumentCompletionEmail } from "./notification-actions";

// Generate a random short URL
function generateShortUrl(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Upload a file to Supabase Storage and create a document record
 */
export async function uploadDocument(formData: FormData) {
  try {
    const supabase = await createServerSupabase();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

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
    const { canCreate, reason, error: limitError } = await canCreateDocument();
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

    // Generate short URL
    const shortUrl = generateShortUrl();

    // Create document record with user_id
    const documentData: DocumentInsert = {
      filename,
      file_url: fileUrl,
      short_url: shortUrl,
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

    // Increment monthly usage count
    const { success: usageUpdated, error: usageError } = await incrementDocumentCreated();
    if (!usageUpdated || usageError) {
      console.error("Failed to update usage:", usageError);
      // Don't fail the entire operation, just log the error
    }

    return { success: true, document, shortUrl };
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


    // Get document to revalidate the specific signing page
    const { document } = await getDocumentById(documentId);
    if (document?.short_url) {
      revalidatePath(`/sign/${document.short_url}`, "page");
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
      .select("id, status, filename")
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
 * Upload signed document image using presigned URL
 */
export async function uploadSignedDocument(
  documentId: string,
  signedImageData: string
) {
  try {
    // Use service role to bypass RLS for presigned URL generation
    const supabaseService = createServiceSupabase();
    const supabase = await createServerSupabase();

    // Get document to verify existence and get user_id
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, user_id')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return { error: 'Document not found' };
    }

    // Generate filename for signed document
    const filename = `signed_${documentId}.png`;
    const filePath = `${document.user_id}/${filename}`;

    // Create presigned URL for upload using service role to bypass RLS
    const { data: presignedData, error: presignedError } = await supabaseService.storage
      .from('signed-documents')
      .createSignedUploadUrl(filePath, {
        upsert: true
      });

    if (presignedError) {
      console.error('Error creating presigned URL:', presignedError);
      return { error: 'Failed to create upload URL' };
    }

    // Convert data URL to blob
    const response = await fetch(signedImageData);
    const blob = await response.blob();

    // Upload file using presigned URL
    const uploadResponse = await fetch(presignedData.signedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/png',
      },
    });

    if (!uploadResponse.ok) {
      console.error('Upload failed:', uploadResponse.statusText);
      return { error: 'Failed to upload signed document' };
    }

    // Get public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabaseService.storage.from('signed-documents').getPublicUrl(presignedData.path);

    // Update document with signed file URL
    const { error: updateError } = await supabase
      .from('documents')
      .update({ signed_file_url: publicUrl })
      .eq('id', documentId);

    if (updateError) {
      console.error('Update document error:', updateError);
      return { error: 'Failed to update document with signed file URL' };
    }

    return { success: true, signedFileUrl: publicUrl };
  } catch (error) {
    console.error('Upload signed document error:', error);
    return { error: 'An unexpected error occurred' };
  }
}

/**
 * Publish a document (change status from draft to published)
 */
export async function publishDocument(
  documentId: string,
  password: string,
  expiresAt: string | null
) {
  try {
    const supabase = await createServerSupabase();

    // Check if user can publish more documents
    const { canPublish, reason, error: limitError } = await canPublishDocument();
    if (limitError) {
      return { error: limitError };
    }
    if (!canPublish) {
      return { error: reason || "Document publish limit reached" };
    }

    // Handle empty/whitespace passwords by storing null instead of hash
    const trimmedPassword = password.trim();
    const passwordHash = trimmedPassword
      ? await bcrypt.hash(trimmedPassword, 12)
      : null;

    // NOTE: If the documents.password column is NOT NULL, the schema must be relaxed to allow nulls

    const expiresAtISO = expiresAt ? new Date(expiresAt).toISOString() : null;
    const { error } = await supabase
      .from("documents")
      .update({
        status: "published",
        password: passwordHash,
        expires_at: expiresAtISO,
      })
      .eq("id", documentId)
      .eq("status", "draft"); // Only allow publishing from draft status

    if (error) {
      console.error("Publish document error:", error);
      return { error: "Failed to publish document" };
    }

    // Get the updated document to return the short URL
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("short_url")
      .eq("id", documentId)
      .single();

    if (docError) {
      console.error("Get document error:", docError);
      return { error: "Failed to retrieve document after publishing" };
    }

    // Revalidate document detail page
    revalidatePath(`/document/${documentId}`);

    return { success: true, shortUrl: document.short_url };
  } catch (error) {
    console.error("Publish document error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Republish a document (generate new short URL, update password and expiration)
 */
export async function republishDocument(
  documentId: string,
  password: string,
  expiresAt: string | null
) {
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

    // Verify document ownership and status, and get old short_url for revalidation
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, user_id, status, short_url")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return { error: "Document not found" };
    }

    if (document.status !== "published") {
      return { error: "Only published documents can be republished" };
    }

    // Store old short_url for revalidation
    const oldShortUrl = document.short_url;

    // Generate new short URL
    const newShortUrl = generateShortUrl();

    // Hash password or set to null
    const trimmedPassword = password.trim();
    const passwordHash = trimmedPassword
      ? await bcrypt.hash(trimmedPassword, 12)
      : null;

    const expiresAtISO = expiresAt ? new Date(expiresAt).toISOString() : null;

    // Update document with new credentials and URL
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        password: passwordHash,
        expires_at: expiresAtISO,
        short_url: newShortUrl,
      })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Republish document error:", updateError);
      return { error: "Failed to republish document" };
    }

    // Revalidate paths (including old URL to clear cache)
    revalidatePath(`/document/${documentId}`);
    revalidatePath(`/sign/${oldShortUrl}`);
    revalidatePath(`/sign/${newShortUrl}`);

    return { success: true, shortUrl: newShortUrl };
  } catch (error) {
    console.error("Republish document error:", error);
    return { error: "An unexpected error occurred" };
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
 * Get signed URL for document with password verification
 */
export async function getDocumentSignedUrl(
  shortUrl: string,
  password?: string
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
      .select("id, file_url, password, status, expires_at")
      .eq("short_url", shortUrl)
      .single();

    if (docError || !document) {
      return { signedUrl: null, error: "Document not found" };
    }

    // Check expiration
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return { signedUrl: null, error: "Document expired" };
    }

    // Check completion
    if (document.status === "completed") {
      return { signedUrl: null, error: "Document already completed" };
    }

    // Verify password if required
    if (document.password) {
      if (!password) {
        return { signedUrl: null, error: "Password required" };
      }
      const isValid = await bcrypt.compare(password, document.password);
      if (!isValid) {
        return { signedUrl: null, error: "Invalid password" };
      }
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
    console.error("Get document signed URL error:", error);
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

    // Build query
    let query = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
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

    // Build query with optimized field selection (exclude password field for client)
    let query = supabase
      .from("documents")
      .select("id, filename, status, signed_file_url, short_url, created_at, expires_at", { count: "exact" })
      .eq("user_id", user.id)
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
 * Get signed URL for signed document
 */
export async function getSignedDocumentUrl(documentId: string): Promise<{
  signedUrl: string | null;
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
      return { signedUrl: null, error: "User not authenticated" };
    }

    // Get document to verify ownership and get signed file path
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, user_id, filename, signed_file_url")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return { signedUrl: null, error: "Document not found" };
    }

    if (!document.signed_file_url) {
      return { signedUrl: null, error: "Signed document not available" };
    }

    // Extract file path from signed_file_url
    const url = new URL(document.signed_file_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('signed-documents') + 1).join('/');

    // Generate signed URL for download (valid for 1 hour)
    const { data, error: signError } = await supabase.storage
      .from('signed-documents')
      .createSignedUrl(filePath, 3600, {
        download: `서명완료_${document.filename}.png`
      });

    if (signError) {
      console.error('Error creating signed URL:', signError);
      return { signedUrl: null, error: 'Failed to create signed URL' };
    }

    return { signedUrl: data.signedUrl };
  } catch (error) {
    console.error('Get signed document URL error:', error);
    return { signedUrl: null, error: 'An unexpected error occurred' };
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


    // Only allow deletion of draft documents
    if (document.status !== "draft") {
      return { error: "Only draft documents can be deleted" };
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
        } else {
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
      .eq("user_id", user.id)
      .eq("status", "draft"); // Double-check status

    if (deleteError) {
      console.error("❌ SERVER: Delete document error:", deleteError);
      return { error: "Failed to delete document" };
    }


    // Decrement monthly usage count
    const { success: usageUpdated, error: usageError } = await decrementDocumentCreated();
    if (!usageUpdated || usageError) {
      console.error("⚠️ SERVER: Failed to update usage:", usageError);
      // Don't fail the entire operation, just log the error
    } else {
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

    // Get counts for all statuses in parallel using count only queries
    const [allResult, draftResult, publishedResult, completedResult] = await Promise.all([
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "draft"),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "published"),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
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
      // Get documents with optimized field selection
      (() => {
        let query = supabase
          .from("documents")
          .select("id, filename, status, created_at, short_url, signed_file_url, expires_at", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        return query;
      })(),

      // Get status counts using a single aggregation query
      supabase
        .from("documents")
        .select("status")
        .eq("user_id", user.id)
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
