import type {
  DocumentInsert,
  DocumentTemplate,
  SignatureArea,
  SignatureInsert,
  TemplateSignatureArea,
  TemplateSignatureAreaInsert,
} from "@/lib/supabase/database.types";

/**
 * Extract the (lowercased) file extension from a filename or storage path.
 * Returns an empty string when there is no extension.
 */
export function extractFileExtension(pathOrName: string): string {
  if (!pathOrName) return "";
  const base = pathOrName.split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || dot === base.length - 1) return "";
  return base.slice(dot + 1).toLowerCase();
}

/**
 * Storage path for a template's source file. Kept separate from cloned
 * document paths so deleting a cloned document never removes the template
 * original (deleteDocument removes the file at documents.file_url directly).
 */
export function buildTemplateStoragePath(
  userId: string,
  ext: string,
  uuid: string
): string {
  return `${userId}/templates/${uuid}.${ext}`;
}

/**
 * Storage path for a cloned document file. Matches the layout used by
 * uploadDocument ({user_id}/{uuid}.{ext}).
 */
export function buildClonedDocumentStoragePath(
  userId: string,
  ext: string,
  uuid: string
): string {
  return `${userId}/${uuid}.${ext}`;
}

/**
 * Build the documents row for a publish-from-template clone. The result is a
 * fresh draft document; signed URLs / publication linkage / template id are
 * intentionally omitted so the standard publish flow can take over.
 */
export function buildClonedDocumentInsert(params: {
  template: DocumentTemplate;
  userId: string;
  fileUrl: string;
  createdMonth: string;
}): DocumentInsert {
  const { template, userId, fileUrl, createdMonth } = params;
  return {
    filename: template.name,
    file_url: fileUrl,
    file_type: template.file_type,
    page_count: template.page_count,
    status: "draft",
    user_id: userId,
    created_month: createdMonth,
  };
}

/**
 * Build pending, unsigned signature rows for a cloned document from the
 * template's layout areas. Sorted by area_index for deterministic ordering.
 */
export function buildClonedSignatureInserts(
  documentId: string,
  areas: TemplateSignatureArea[]
): SignatureInsert[] {
  return [...areas]
    .sort((a, b) => a.area_index - b.area_index)
    .map((area) => ({
      document_id: documentId,
      area_index: area.area_index,
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      area_type: area.area_type || "signature",
      page_number: area.page_number ?? 0,
      status: "pending",
      signature_data: null,
    }));
}

/**
 * Build template_signature_areas rows from areas drawn in the editor.
 * Mirrors createSignatureAreas but targets the template table.
 */
export function buildTemplateAreaInserts(
  templateId: string,
  areas: SignatureArea[]
): TemplateSignatureAreaInsert[] {
  return areas.map((area, index) => ({
    template_id: templateId,
    area_index: index,
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
    area_type: area.type || "signature",
    page_number: area.pageNumber ?? 0,
  }));
}
