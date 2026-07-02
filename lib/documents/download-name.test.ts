import { describe, expect, it } from "vitest";
import {
  getDocumentDownloadBaseName,
  getDocumentDownloadName,
} from "./download-name";

describe("getDocumentDownloadName", () => {
  it("uses the uploaded document alias without adding a signed prefix", () => {
    expect(getDocumentDownloadName("pdf", "계약서", "upload.pdf")).toBe(
      "계약서.pdf"
    );
  });

  it("replaces an alias extension with the generated signed artifact extension", () => {
    expect(getDocumentDownloadName("pdf", "계약서 초안.png", "scan.png")).toBe(
      "계약서 초안.pdf"
    );
  });

  it("falls back to the original uploaded filename when alias is blank", () => {
    expect(getDocumentDownloadName("pdf", "  ", "original-file.png")).toBe(
      "original-file.pdf"
    );
  });

  it("sanitizes characters that are unsafe in downloaded filenames", () => {
    expect(getDocumentDownloadBaseName("계약서/최종:검토", "fallback.pdf")).toBe(
      "계약서_최종_검토"
    );
  });
});
