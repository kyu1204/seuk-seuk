import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./SignedDocumentBundleButton.tsx", import.meta.url),
  "utf-8"
);

describe("SignedDocumentBundleButton.tsx source", () => {
  it("builds the fallback zip filename from the locale key", () => {
    expect(source).toContain('`${t("sign.download.bundleName")}.zip`');
  });

  it("imports useLanguage exactly once", () => {
    expect(source.match(/import \{ useLanguage \}/g)?.length ?? 0).toBe(1);
  });

  it("uses the locale key for the zip bundle filename instead of hardcoded korean", () => {
    expect(source).toContain("sign.download.bundleName");
    expect(source).not.toContain("서명문서.zip");
  });

  it("renders the fetch error inline", () => {
    expect(source).toContain("{error &&");
  });

  it("uses destructive tokens for the inline error text", () => {
    expect(source).toContain("text-destructive");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white|text-red-500/);
  });
});
