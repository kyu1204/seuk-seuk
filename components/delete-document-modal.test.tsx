import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./delete-document-modal.tsx", import.meta.url), "utf-8");

describe("delete-document-modal.tsx source", () => {
  it("has no hardcoded Korean copy", () => {
    expect(source).not.toMatch(/[가-힣]/);
  });

  it("passes the document name for interpolation", () => {
    expect(source).toContain("documentName");
  });

  it("uses translation keys for all copy", () => {
    expect(source).toContain("documentDetail.delete.title");
    expect(source).toContain("documentDetail.delete.confirm");
    expect(source).toContain("documentDetail.delete.description");
    expect(source).toContain("common.cancel");
    expect(source).toContain("common.deleting");
    expect(source).toContain("common.delete");
  });
});
