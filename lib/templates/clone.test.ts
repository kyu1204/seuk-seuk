import { describe, it, expect } from "vitest";
import {
  extractFileExtension,
  buildTemplateStoragePath,
  buildClonedDocumentStoragePath,
  buildClonedDocumentInsert,
  buildClonedSignatureInserts,
  buildTemplateAreaInserts,
} from "./clone";
import type {
  DocumentTemplate,
  TemplateSignatureArea,
} from "@/lib/supabase/database.types";
import type { SignatureArea } from "@/lib/supabase/database.types";

describe("extractFileExtension", () => {
  it("extracts extension from a filename", () => {
    expect(extractFileExtension("contract.pdf")).toBe("pdf");
    expect(extractFileExtension("scan.PNG")).toBe("png");
  });

  it("extracts extension from a storage path", () => {
    expect(extractFileExtension("user-123/templates/abc.jpeg")).toBe("jpeg");
  });

  it("returns empty string when there is no extension", () => {
    expect(extractFileExtension("noext")).toBe("");
    expect(extractFileExtension("")).toBe("");
  });
});

describe("buildTemplateStoragePath", () => {
  it("nests template files under the user's templates folder", () => {
    expect(buildTemplateStoragePath("user-1", "pdf", "uuid-9")).toBe(
      "user-1/templates/uuid-9.pdf"
    );
  });
});

describe("buildClonedDocumentStoragePath", () => {
  it("places cloned document files in the user's root folder (matches uploadDocument)", () => {
    expect(buildClonedDocumentStoragePath("user-1", "png", "uuid-3")).toBe(
      "user-1/uuid-3.png"
    );
  });

  it("never collides with the template path", () => {
    const tpl = buildTemplateStoragePath("user-1", "pdf", "x");
    const doc = buildClonedDocumentStoragePath("user-1", "pdf", "x");
    expect(tpl).not.toBe(doc);
  });
});

const template: DocumentTemplate = {
  id: "tpl-1",
  user_id: "user-1",
  name: "NDA Template",
  file_url: "user-1/templates/orig.pdf",
  file_type: "pdf",
  page_count: 3,
  is_deleted: false,
  deleted_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
};

describe("buildClonedDocumentInsert", () => {
  it("creates a draft document carrying over template file metadata", () => {
    const result = buildClonedDocumentInsert({
      template,
      userId: "user-1",
      fileUrl: "user-1/new-doc.pdf",
      createdMonth: "2026-06",
    });

    expect(result).toMatchObject({
      filename: "NDA Template",
      file_url: "user-1/new-doc.pdf",
      file_type: "pdf",
      page_count: 3,
      status: "draft",
      user_id: "user-1",
      created_month: "2026-06",
    });
  });

  it("does not carry over signed urls, publication_id, or template id", () => {
    const result = buildClonedDocumentInsert({
      template,
      userId: "user-1",
      fileUrl: "user-1/new-doc.pdf",
      createdMonth: "2026-06",
    }) as Record<string, unknown>;

    expect(result.signed_file_url).toBeUndefined();
    expect(result.signed_pdf_url).toBeUndefined();
    expect(result.publication_id).toBeUndefined();
    expect(result.id).toBeUndefined();
  });
});

describe("buildClonedSignatureInserts", () => {
  const areas: TemplateSignatureArea[] = [
    {
      id: "a2",
      template_id: "tpl-1",
      area_index: 1,
      x: 50,
      y: 60,
      width: 100,
      height: 40,
      page_number: 1,
      area_type: "text",
      created_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "a1",
      template_id: "tpl-1",
      area_index: 0,
      x: 10,
      y: 20,
      width: 80,
      height: 30,
      page_number: 0,
      area_type: "signature",
      created_at: "2026-01-01T00:00:00Z",
    },
  ];

  it("maps template areas to pending, unsigned signature rows", () => {
    const result = buildClonedSignatureInserts("doc-9", areas);
    expect(result).toHaveLength(2);
    for (const row of result) {
      expect(row.document_id).toBe("doc-9");
      expect(row.status).toBe("pending");
      expect(row.signature_data).toBeNull();
    }
  });

  it("preserves coordinates, page number, and area type", () => {
    const result = buildClonedSignatureInserts("doc-9", areas);
    const sig = result.find((r) => r.area_type === "signature")!;
    expect(sig).toMatchObject({
      area_index: 0,
      x: 10,
      y: 20,
      width: 80,
      height: 30,
      page_number: 0,
      area_type: "signature",
    });
  });

  it("sorts by area_index so order is deterministic", () => {
    const result = buildClonedSignatureInserts("doc-9", areas);
    expect(result.map((r) => r.area_index)).toEqual([0, 1]);
  });

  it("returns an empty array for no areas", () => {
    expect(buildClonedSignatureInserts("doc-9", [])).toEqual([]);
  });
});

describe("buildTemplateAreaInserts", () => {
  const drawn: SignatureArea[] = [
    { x: 1, y: 2, width: 3, height: 4, type: "signature", pageNumber: 0 },
    { x: 5, y: 6, width: 7, height: 8, type: "text", pageNumber: 2 },
  ];

  it("maps drawn areas to template area inserts with sequential indexes", () => {
    const result = buildTemplateAreaInserts("tpl-7", drawn);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      template_id: "tpl-7",
      area_index: 0,
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      area_type: "signature",
      page_number: 0,
    });
    expect(result[1]).toMatchObject({
      template_id: "tpl-7",
      area_index: 1,
      area_type: "text",
      page_number: 2,
    });
  });

  it("defaults area_type to signature and page_number to 0 when missing", () => {
    const result = buildTemplateAreaInserts("tpl-7", [
      { x: 0, y: 0, width: 1, height: 1 } as SignatureArea,
    ]);
    expect(result[0].area_type).toBe("signature");
    expect(result[0].page_number).toBe(0);
  });
});
