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

  it("exports getDocumentSignatureCounts for the publish document list", () => {
    expect(source).toContain("export async function getDocumentSignatureCounts(");
  });
});
