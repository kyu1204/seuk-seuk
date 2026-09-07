import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-actions.ts", import.meta.url), "utf-8");

describe("document-actions.ts source", () => {
  it("getUserDocumentsClient selects page_count for the dashboard tile meta", () => {
    const selectLine = source
      .split("\n")
      .find((line) => line.includes('"id, filename, alias, status, signed_file_url'));
    expect(selectLine).toContain("page_count");
  });

  it("exposes the direct-to-storage upload flow (presign + finalize) so files skip the 4.5MB Vercel body limit", () => {
    expect(source).toContain("export async function createDocumentUploadUrl(");
    expect(source).toContain("export async function finalizeDocumentUpload(");
    expect(source).toContain("createSignedUploadUrl(");
    // finalize must refuse keys outside the caller's own folder
    expect(source).toContain("key.startsWith(pendingFolder)");
    expect(source).toContain("storage.head(");
    expect(source).toContain("countPdfPages(");
  });

  it("exports getDocumentSignatureCounts for the publish document list", () => {
    expect(source).toContain("export async function getDocumentSignatureCounts(");
  });
});
