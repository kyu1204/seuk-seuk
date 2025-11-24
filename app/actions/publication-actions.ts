"use server";

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  PublicationInsert,
  ClientPublication,
  PublicationWithDocuments
} from "@/lib/supabase/database.types";
import bcrypt from "bcryptjs";
import { deductCredit } from "./credit-actions";
import { getUserUsageLimits } from "./subscription-actions";

// Generate random short URL
function generateShortUrl(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new publication and link documents to it
 */
export async function createPublication(
  name: string,
  password: string,
  expiresAt: string | null,
  documentIds: string[]
): Promise<{ success?: boolean; shortUrl?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Validate inputs
    if (!name.trim()) {
      return { error: "Publication name is required" };
    }

    if (documentIds.length === 0) {
      return { error: "At least one document must be selected" };
    }

    // Verify all documents belong to user and are draft status
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id, status")
      .in("id", documentIds)
      .eq("user_id", user.id);

    if (docError || !documents) {
      return { error: "Failed to verify documents" };
    }

    if (documents.length !== documentIds.length) {
      return { error: "Some documents not found or not owned by user" };
    }

    const nonDraftDocs = documents.filter(d => d.status !== "draft");
    if (nonDraftDocs.length > 0) {
      return { error: "Only draft documents can be published" };
    }

    // Check subscription limits - importing dynamically to avoid circular dependency
    const { canCreatePublication } = await import("./subscription-actions");
    const { canCreate, reason, error: limitError } = await canCreatePublication(documentIds.length);

    if (!canCreate) {
      return { error: reason || limitError || "Cannot create publication" };
    }

    // Hash password
    const trimmedPassword = password.trim();
    const passwordHash = trimmedPassword
      ? await bcrypt.hash(trimmedPassword, 12)
      : null;

    // Generate short URL
    const shortUrl = generateShortUrl();

    // Create publication
    const publicationData: PublicationInsert = {
      user_id: user.id,
      name: name.trim(),
      password: passwordHash,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      short_url: shortUrl,
      status: "active"
    };

    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .insert(publicationData)
      .select()
      .single();

    if (pubError || !publication) {
      console.error("Publication creation error:", pubError);
      return { error: "Failed to create publication" };
    }

    // Link documents to publication and update status
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        publication_id: publication.id,
        status: "published"
      })
      .in("id", documentIds);

    if (updateError) {
      console.error("Document linking error:", updateError);
      // Rollback: delete publication
      await supabase.from("publications").delete().eq("id", publication.id);
      return { error: "Failed to link documents to publication" };
    }

    // Note: monthly_usage.published_completed_count is automatically updated by
    // the database trigger (trigger_document_status_change) when document status changes
    // No need to manually increment here

    // Credit deduction logic for publish credits
    const { limits } = await getUserUsageLimits();
    const monthlyRemaining = limits?.activeDocumentLimit === -1
      ? Infinity
      : (limits?.activeDocumentLimit || 0) - (limits?.currentActiveDocuments || 0);

    let creditsToDeduct = 0;
    if (monthlyRemaining < documentIds.length) {
      if (monthlyRemaining === Infinity) {
        creditsToDeduct = 0;
      } else {
        creditsToDeduct = documentIds.length - Math.max(0, monthlyRemaining);
      }
    }

    // Deduct credits if needed
    for (let i = 0; i < creditsToDeduct; i++) {
      const { success, error: creditError } = await deductCredit("publish", documentIds[i]);
      if (!success || creditError) {
        console.error("Failed to deduct publish credit:", creditError);
        // Don't rollback entire publication, just log error
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/publish");

    return { success: true, shortUrl: publication.short_url };
  } catch (error) {
    console.error("Create publication error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update an existing publication (for republish/edit)
 */
export async function updatePublication(
  publicationId: string,
  name: string,
  password: string | null,
  expiresAt: string | null
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Validate inputs
    if (!name.trim()) {
      return { error: "Publication name is required" };
    }

    // Verify publication belongs to user
    const { data: publication, error: verifyError } = await supabase
      .from("publications")
      .select("id, user_id, status")
      .eq("id", publicationId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !publication) {
      return { error: "Publication not found or not owned by user" };
    }

    // Cannot edit completed publications
    if (publication.status === "completed") {
      return { error: "Cannot edit completed publications" };
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    };

    // Handle password update
    if (password !== null) {
      const trimmedPassword = password.trim();
      if (trimmedPassword) {
        // Hash new password
        updateData.password = await bcrypt.hash(trimmedPassword, 12);
      } else {
        // Remove password protection
        updateData.password = null;
      }
    }
    // If password is null, keep existing password (don't update)

    // If publication was expired, reactivate it
    if (publication.status === "expired") {
      updateData.status = "active";
    }

    // Update publication
    const { error: updateError } = await supabase
      .from("publications")
      .update(updateData)
      .eq("id", publicationId);

    if (updateError) {
      console.error("Publication update error:", updateError);
      return { error: "Failed to update publication" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/publish");
    revalidatePath(`/publication/${publicationId}`);

    return { success: true };
  } catch (error) {
    console.error("Update publication error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get all publications for the current user with document counts
 */
export async function getUserPublications(): Promise<{
  success?: boolean;
  publications?: ClientPublication[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const { data: publications, error: pubError } = await supabase
      .from("publications")
      .select("*, documents(count)")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (pubError) {
      console.error("Get publications error:", pubError);
      return { error: "Failed to fetch publications" };
    }

    // Transform to ClientPublication format (without password hash)
    const clientPublications: ClientPublication[] = (publications || []).map((pub: any) => ({
      id: pub.id,
      user_id: pub.user_id,
      name: pub.name,
      expires_at: pub.expires_at,
      short_url: pub.short_url,
      status: pub.status,
      created_at: pub.created_at,
      updated_at: pub.updated_at,
      requiresPassword: !!pub.password,
      documentCount: pub.documents?.[0]?.count || 0
    }));

    return { success: true, publications: clientPublications };
  } catch (error) {
    console.error("Get user publications error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a publication by short URL (for signing page)
 */
export async function getPublicationByShortUrl(
  shortUrl: string
): Promise<{
  success?: boolean;
  publication?: PublicationWithDocuments;
  requiresPassword?: boolean;
  error?: string;
}> {
  try {
    // Use service role to bypass RLS for public access
    const supabase = createServiceSupabase();

    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select(`
        *,
        documents(*, signatures(*))
      `)
      .eq("short_url", shortUrl)
      .single();

    if (pubError || !publication) {
      console.error("❌ Publication not found:", { shortUrl, error: pubError });
      return { error: "Publication not found or expired" };
    }

    // Check expiration and update status if needed
    if (publication.expires_at) {
      const expiresAt = new Date(publication.expires_at);
      if (expiresAt < new Date() && publication.status !== "expired") {
        // Update status to expired
        await supabase
          .from("publications")
          .update({ status: "expired" })
          .eq("id", publication.id);
        // Update the publication object with new status
        publication.status = "expired";
      }
    }

    // Check if all documents are completed and update publication status
    if (publication.status === "active" && publication.documents) {
      const allCompleted = publication.documents.every((doc: any) => doc.status === "completed");
      if (allCompleted && publication.documents.length > 0) {
        await supabase
          .from("publications")
          .update({ status: "completed" })
          .eq("id", publication.id);
        // Update the publication object with new status
        publication.status = "completed";
      }
    }

    return {
      success: true,
      publication: publication as PublicationWithDocuments,
      requiresPassword: !!publication.password
    };
  } catch (error) {
    console.error("Get publication by short URL error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Verify publication password
 */
export async function verifyPublicationPassword(
  shortUrl: string,
  password: string
): Promise<{ success?: boolean; isValid?: boolean; error?: string }> {
  try {
    // Use service role to bypass RLS for public access
    const supabase = createServiceSupabase();

    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select("password")
      .eq("short_url", shortUrl)
      .single();

    if (pubError || !publication) {
      return { error: "Publication not found" };
    }

    if (!publication.password) {
      // No password required, always valid
      return { success: true, isValid: true };
    }

    const isValid = await bcrypt.compare(password, publication.password);

    // Return isValid status like original implementation
    return { success: true, isValid };
  } catch (error) {
    console.error("Verify publication password error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Check if all documents in a publication are completed
 * and update publication status to "completed" if so
 */
export async function checkAndCompletePublication(
  publicationId: string
): Promise<{ success?: boolean; isCompleted?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get publication info with short_url
    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select("id, short_url, status")
      .eq("id", publicationId)
      .single();

    if (pubError || !publication) {
      console.error("Error fetching publication:", pubError);
      return { error: "Publication not found" };
    }

    // Get all documents in this publication
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id, status")
      .eq("publication_id", publicationId);

    if (docError) {
      console.error("Error fetching documents:", docError);
      return { error: "Failed to fetch documents" };
    }

    if (!documents || documents.length === 0) {
      return { error: "No documents found in publication" };
    }

    // Check if all documents are completed
    const allCompleted = documents.every(doc => doc.status === "completed");

    if (allCompleted && publication.status !== "completed") {
      // Update publication status to completed
      const { error: updateError } = await supabase
        .from("publications")
        .update({ status: "completed" })
        .eq("id", publicationId);

      if (updateError) {
        console.error("Error updating publication status:", updateError);
        return { error: "Failed to update publication status" };
      }

      revalidatePath("/dashboard");
      revalidatePath(`/publication/${publication.short_url}`);
      return { success: true, isCompleted: true };
    }

    return { success: true, isCompleted: false };
  } catch (error) {
    console.error("Check and complete publication error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a publication and unlink documents
 */
export async function deletePublication(
  publicationId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Verify publication belongs to user and get documents with signatures
    const { data: publication, error: verifyError } = await supabase
      .from("publications")
      .select(`
        id,
        user_id,
        status,
        documents (
          id,
          status,
          signatures (id)
        )
      `)
      .eq("id", publicationId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !publication) {
      return { error: "Publication not found or not owned by user" };
    }

    // Handle completed publications with soft delete
    if (publication.status === "completed") {
      // Soft delete publication
      const { error: softDeletePubError } = await supabase
        .from("publications")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq("id", publicationId);

      if (softDeletePubError) {
        console.error("Publication soft delete error:", softDeletePubError);
        return { error: "Failed to delete publication" };
      }

      // Soft delete all associated documents (keep status as completed)
      const documentIds = (publication.documents as any[])?.map(doc => doc.id) || [];
      if (documentIds.length > 0) {
        const { error: softDeleteDocsError } = await supabase
          .from("documents")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
          })
          .in("id", documentIds);

        if (softDeleteDocsError) {
          console.error("Documents soft delete error:", softDeleteDocsError);
          return { error: "Failed to delete documents" };
        }
      }

      revalidatePath("/dashboard");
      revalidatePath("/publish");

      return { success: true };
    }

    // Handle active publications
    if (publication.status === "active") {
      // Check if any document has signatures
      const documents = (publication.documents as any[]) || [];
      const hasSignatures = documents.some(doc =>
        doc.signatures && doc.signatures.length > 0
      );

      if (hasSignatures) {
        return { error: "Cannot delete publication with signed documents" };
      }

      // No signatures - can delete and revert documents to draft
      // Unlink documents (set publication_id to null and status to draft)
      const { error: unlinkError } = await supabase
        .from("documents")
        .update({
          publication_id: null,
          status: "draft"
        })
        .eq("publication_id", publicationId);

      if (unlinkError) {
        console.error("Document unlinking error:", unlinkError);
        return { error: "Failed to unlink documents" };
      }

      // Note: monthly_usage.published_completed_count is automatically updated by
      // the database trigger (trigger_document_status_change) when document status changes
      // No need to manually decrement here

      // Delete publication
      const { error: deleteError } = await supabase
        .from("publications")
        .delete()
        .eq("id", publicationId);

      if (deleteError) {
        console.error("Publication deletion error:", deleteError);
        return { error: "Failed to delete publication" };
      }

      revalidatePath("/dashboard");
      revalidatePath("/publish");

      return { success: true };
    }

    // Handle expired publications (treat like active)
    if (publication.status === "expired") {
      // Check if any document has signatures
      const documents = (publication.documents as any[]) || [];
      const hasSignatures = documents.some(doc =>
        doc.signatures && doc.signatures.length > 0
      );

      if (hasSignatures) {
        return { error: "Cannot delete publication with signed documents" };
      }

      // No signatures - can delete
      const { error: deleteError } = await supabase
        .from("publications")
        .delete()
        .eq("id", publicationId);

      if (deleteError) {
        console.error("Publication deletion error:", deleteError);
        return { error: "Failed to delete publication" };
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/publish");

    return { success: true };
  } catch (error) {
    console.error("Delete publication error:", error);
    return { error: "An unexpected error occurred" };
  }
}
