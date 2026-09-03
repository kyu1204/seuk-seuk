import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./pdf-page-renderer.tsx", import.meta.url), "utf-8");

describe("pdf-page-renderer.tsx source", () => {
  it("has no hardcoded Korean error strings", () => {
    expect(source).not.toMatch(/[가-힣]/);
  });

  it("does not concatenate the raw TypeError detail into the user-facing message", () => {
    expect(source).not.toMatch(/onLoadError\?\.\(`[^`]*\$\{detail\}/);
  });

  it("does not build the render-error message from raw error details", () => {
    expect(source).not.toMatch(/onLoadError\?\.\(`PDF/);
  });

  it("has no leftover 'failed to' console strings", () => {
    expect(source).not.toMatch(/Failed to /);
  });

  it("uses the language context", () => {
    expect(source).toContain("useLanguage");
  });

  it("uses locale keys for load/memory errors", () => {
    expect(source).toContain("sign.pdf.loadError");
    expect(source).toContain("sign.pdf.memoryError");
  });
});
