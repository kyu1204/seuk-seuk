import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./SignedDocumentDownloadButton.tsx", import.meta.url),
  "utf-8"
);

describe("SignedDocumentDownloadButton.tsx source", () => {
  it("uses the shared download-error copy key", () => {
    expect(source).toContain("sign.completed.downloadError");
  });

  it("uses destructive tokens for the inline error text", () => {
    expect(source).toContain("text-destructive");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white|text-red-500/);
  });
});
