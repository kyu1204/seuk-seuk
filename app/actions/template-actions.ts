"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import type {
  DocumentTemplate,
  DocumentTemplateInsert,
  SignatureArea,
  TemplateWithAreas,
} from "@/lib/supabase/database.types";
import { isTemplateAllowedPlan } from "@/lib/templates/gating";
import {
  extractFileExtension,
  buildTemplateStoragePath,
  buildClonedDocumentStoragePath,
  buildClonedDocumentInsert,
  buildClonedSignatureInserts,
  buildTemplateAreaInserts,
} from "@/lib/templates/clone";
import { getCurrentSubscription } from "./subscription-actions";

/**
 * Gate the template feature to Pro / Enterprise plans.
 */
export async function canUseTemplate(): Promise<{
  canUse: boolean;
  error?: string;
}> {
  try {
    const { subscription, error } = await getCurrentSubscription();
    if (error) {
      return { canUse: false, error };
    }

    if (isTemplateAllowedPlan(subscription?.plan?.name)) {
      return { canUse: true };
    }

    return {
      canUse: false,
      error: "템플릿 기능은 Pro 또는 Enterprise 플랜에서만 사용할 수 있습니다.",
    };
  } catch (error) {
    console.error("Can use template error:", error);
    return { canUse: false, error: "An unexpected error occurred" };
  }
}

/**
 * Create a template from a freshly uploaded file (Pro/Enterprise only).
 * Returns the new template id; signature areas are saved separately via
 * createTemplateAreas (mirrors uploadDocument + createSignatureAreas).
 */
export async function createTemplate(formData: FormData): Promise<{
  success?: boolean;
  templateId?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { canUse, error: gateError } = await canUseTemplate();
    if (!canUse) {
      return { error: gateError || "Template feature not available" };
    }

    const file = formData.get("file") as File;
    const name = formData.get("name") as string;

    if (!file || !name?.trim()) {
      return { error: "File and name are required" };
    }

    // Whitelist allowed MIME types so non-image/non-PDF files can't be stored
    // with mismatched metadata.
    const allowedMime = new Set([
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ]);
    if (!allowedMime.has(file.type)) {
      return { error: "지원하지 않는 파일 형식입니다." };
    }

    const isPdf = file.type === "application/pdf";
    const fileType = isPdf ? "pdf" : "image";
    let pageCount = 1;

    if (isPdf) {
      try {
        const { PDFDocument } = await import("pdf-lib");
        const arrayBuffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        pageCount = pdfDoc.getPageCount();
      } catch (err) {
        console.error("Failed to read PDF page count:", err);
        return { error: "Failed to process PDF file" };
      }
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Upload the template source file to a dedicated templates path
    const ext = extractFileExtension(file.name) || (isPdf ? "pdf" : "png");
    const filePath = buildTemplateStoragePath(user.id, ext, randomUUID());

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Template upload error:", uploadError);
      return { error: "Failed to upload template file" };
    }

    const templateData: DocumentTemplateInsert = {
      user_id: user.id,
      name: name.trim(),
      file_url: filePath,
      file_type: fileType,
      page_count: pageCount,
    };

    const { data: template, error: dbError } = await supabase
      .from("document_templates")
      .insert(templateData)
      .select()
      .single();

    if (dbError || !template) {
      console.error("Template DB error:", dbError);
      // Rollback uploaded file
      await supabase.storage.from("documents").remove([filePath]);
      return { error: "Failed to create template record" };
    }

    revalidatePath("/dashboard");
    return { success: true, templateId: template.id };
  } catch (error) {
    console.error("Create template error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Persist the layout (signature areas) for a template.
 */
export async function createTemplateAreas(
  templateId: string,
  signatureAreas: SignatureArea[]
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { canUse, error: gateError } = await canUseTemplate();
    if (!canUse) {
      return { error: gateError || "Template feature not available" };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Verify ownership
    const { data: template, error: verifyError } = await supabase
      .from("document_templates")
      .select("id, user_id")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !template) {
      return { error: "Template not found or not owned by user" };
    }

    // Make the operation idempotent: clear existing areas before inserting so
    // repeated calls (retries / edits) don't accumulate duplicate area_index.
    const { error: clearError } = await supabase
      .from("template_signature_areas")
      .delete()
      .eq("template_id", templateId);

    if (clearError) {
      console.error("Reset template areas error:", clearError);
      return { error: "Failed to reset template areas" };
    }

    const inserts = buildTemplateAreaInserts(templateId, signatureAreas);
    if (inserts.length > 0) {
      const { error } = await supabase
        .from("template_signature_areas")
        .insert(inserts);

      if (error) {
        console.error("Create template areas error:", error);
        return { error: "Failed to create template areas" };
      }
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create template areas error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * List the current user's templates.
 */
export async function getUserTemplates(): Promise<{
  success?: boolean;
  templates?: DocumentTemplate[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("document_templates")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get templates error:", error);
      return { error: "Failed to load templates" };
    }

    return { success: true, templates: data || [] };
  } catch (error) {
    console.error("Get templates error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single template with its layout areas.
 */
export async function getTemplateById(templateId: string): Promise<{
  success?: boolean;
  template?: TemplateWithAreas;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("document_templates")
      .select("*, template_signature_areas(*)")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .eq("is_deleted", false)
      .single();

    if (error || !data) {
      return { error: "Template not found" };
    }

    return { success: true, template: data as TemplateWithAreas };
  } catch (error) {
    console.error("Get template error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Soft-delete a template (keeps storage cleanup best-effort).
 */
export async function deleteTemplate(templateId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const { data: template, error: verifyError } = await supabase
      .from("document_templates")
      .select("id, user_id")
      .eq("id", templateId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !template) {
      return { error: "Template not found or not owned by user" };
    }

    const { error } = await supabase
      .from("document_templates")
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", templateId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete template error:", error);
      return { error: "Failed to delete template" };
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Delete template error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Publish from a template: clone the template into a fresh draft document +
 * pending signatures, then run the standard publish flow. Charging/limits
 * follow the normal publish path (same as a freshly uploaded document).
 */
export async function publishFromTemplate(
  templateId: string,
  options: { name: string; password: string; expiresAt: string | null }
): Promise<{ success?: boolean; shortUrl?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { canUse, error: gateError } = await canUseTemplate();
    if (!canUse) {
      return { error: gateError || "Template feature not available" };
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Load template + areas with ownership check
    const { template: fullTemplate, error: loadError } =
      await getTemplateById(templateId);
    if (loadError || !fullTemplate) {
      return { error: loadError || "Template not found" };
    }

    // Same charging policy as a normal document creation
    const { canCreateDocument, incrementDocumentCreated, decrementDocumentCreated } =
      await import("./subscription-actions");
    const { deductCredit, refundCredit } = await import("./credit-actions");

    const { canCreate, usingCredit, reason, error: limitError } =
      await canCreateDocument();
    if (limitError) return { error: limitError };
    if (!canCreate) return { error: reason || "Document creation limit reached" };

    // Copy the template source file into a new document path so the cloned
    // document owns its own file (deleteDocument removes file_url directly).
    const ext =
      extractFileExtension(fullTemplate.file_url) ||
      (fullTemplate.file_type === "pdf" ? "pdf" : "png");
    const newFilePath = buildClonedDocumentStoragePath(
      user.id,
      ext,
      randomUUID()
    );

    const { error: copyError } = await supabase.storage
      .from("documents")
      .copy(fullTemplate.file_url, newFilePath);

    if (copyError) {
      console.error("Template file copy error:", copyError);
      return { error: "Failed to copy template file" };
    }

    // Create the cloned draft document
    const documentData = buildClonedDocumentInsert({
      template: fullTemplate,
      userId: user.id,
      fileUrl: newFilePath,
      createdMonth: new Date().toISOString().slice(0, 7),
    });

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert(documentData)
      .select()
      .single();

    if (docError || !document) {
      console.error("Cloned document insert error:", docError);
      await supabase.storage.from("documents").remove([newFilePath]);
      return { error: "Failed to create document from template" };
    }

    // Track usage + credits exactly like uploadDocument
    await incrementDocumentCreated();
    let creditDeducted = false;
    if (usingCredit) {
      const { success, error: creditError } = await deductCredit(
        "create",
        document.id
      );
      if (!success || creditError) {
        console.error("Failed to deduct credit:", creditError);
        await decrementDocumentCreated();
        await supabase.from("documents").delete().eq("id", document.id);
        await supabase.storage.from("documents").remove([newFilePath]);
        return { error: "크레딧 차감 실패" };
      }
      creditDeducted = true;
    }

    // Compensating rollback for failures after usage/credit were applied.
    const rollbackClone = async () => {
      await decrementDocumentCreated();
      if (creditDeducted) {
        await refundCredit("create", document.id);
      }
      await supabase.from("documents").delete().eq("id", document.id);
      await supabase.storage.from("documents").remove([newFilePath]);
    };

    // Clone signature areas as pending signatures
    const signatureInserts = buildClonedSignatureInserts(
      document.id,
      fullTemplate.template_signature_areas
    );
    if (signatureInserts.length > 0) {
      const { error: sigError } = await supabase
        .from("signatures")
        .insert(signatureInserts);

      if (sigError) {
        console.error("Cloned signatures insert error:", sigError);
        await rollbackClone();
        return { error: "Failed to clone signature areas" };
      }
    }

    // Hand off to the standard publish flow
    const { createPublication } = await import("./publication-actions");
    const result = await createPublication(
      options.name,
      options.password,
      options.expiresAt,
      [document.id]
    );

    if (result.error || !result.shortUrl) {
      console.error("Publish from template error:", result.error);
      await rollbackClone();
      return { error: result.error || "Failed to publish" };
    }

    revalidatePath("/dashboard");
    return { success: true, shortUrl: result.shortUrl };
  } catch (error) {
    console.error("Publish from template error:", error);
    return { error: "An unexpected error occurred" };
  }
}
