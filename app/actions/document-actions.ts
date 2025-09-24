"use server";

import { createServerSupabase } from "@/lib/supabase/server";
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

    // Generate unique filename using UUID
    const fileExtension = file.name.split(".").pop() || "";
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(uniqueFilename, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload file" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("documents").getPublicUrl(uniqueFilename);

    // Generate short URL
    const shortUrl = generateShortUrl();

    // Create document record (without signature areas)
    const documentData: DocumentInsert = {
      filename,
      file_url: publicUrl,
      short_url: shortUrl,
      status: "draft",
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

    return { success: true, document, shortUrl };
  } catch (error) {
    console.error("Upload document error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get document by short URL
 */
export async function getDocumentByShortUrl(
  shortUrl: string
): Promise<{
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

    // Revalidate the signing page
    revalidatePath(`/sign/[id]`, "page");

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

    const { error } = await supabase
      .from("documents")
      .update({ status: "completed" })
      .eq("id", documentId);

    if (error) {
      console.error("Mark completed error:", error);
      return { error: "Failed to mark document as completed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Mark completed error:", error);
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
 * Upload signed document image to Supabase Storage
 */
export async function uploadSignedDocument(
  documentId: string,
  signedImageData: string
) {
  try {
    const supabase = await createServerSupabase();

    // Convert data URL to blob
    const response = await fetch(signedImageData);
    const blob = await response.blob();

    // Generate filename for signed document
    const filename = `signed_${documentId}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("signed-documents")
      .upload(filename, blob, {
        contentType: "image/png",
        upsert: true, // Replace if already exists
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: "Failed to upload signed document" };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("signed-documents").getPublicUrl(filename);

    // Update document with signed file URL
    const { error: updateError } = await supabase
      .from("documents")
      .update({ signed_file_url: publicUrl })
      .eq("id", documentId);

    if (updateError) {
      console.error("Update document error:", updateError);
      return { error: "Failed to update document with signed file URL" };
    }

    return { success: true, signedFileUrl: publicUrl };
  } catch (error) {
    console.error("Upload signed document error:", error);
    return { error: "An unexpected error occurred" };
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
 * Update signature areas for a document (delete existing and create new ones)
 */
export async function updateSignatureAreas(
  documentId: string,
  signatureAreas: SignatureArea[]
) {
  try {
    const supabase = await createServerSupabase();

    // Start transaction-like operations
    // First, delete existing signature areas
    const { error: deleteError } = await supabase
      .from("signatures")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      console.error("Delete signature areas error:", deleteError);
      return { error: "Failed to delete existing signature areas" };
    }

    // Then create new signature areas if any exist
    if (signatureAreas.length > 0) {
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

      const { error: insertError } = await supabase
        .from("signatures")
        .insert(signatureInserts);

      if (insertError) {
        console.error("Create new signature areas error:", insertError);
        return { error: "Failed to create new signature areas" };
      }
    }

    // Revalidate document detail page
    revalidatePath(`/document/${documentId}`);

    return { success: true };
  } catch (error) {
    console.error("Update signature areas error:", error);
    return { error: "An unexpected error occurred" };
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
 * Get document by ID (for server components)
 */
export async function getDocumentById(
  id: string
): Promise<{
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
