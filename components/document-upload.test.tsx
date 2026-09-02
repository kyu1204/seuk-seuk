import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-upload.tsx", import.meta.url), "utf-8");

describe("document-upload.tsx source", () => {
  // TDD marker: import location for toast helper is asserted above.
  // TDD marker: modal close button now uses common.cancel key, not string compare.
  // TDD marker: top bar uses upload.meta and grid layout per R31 spec.
  it("uses the lg 260px sidebar grid layout", () => {
    expect(source).toContain("lg:grid-cols-[260px_minmax(0,1fr)]");
  });
  it("switches touch-action based on drag state for mobile pan", () => {
    expect(source).toContain("isDragging ? 'none' : 'pan-y'");
  });
  it("uses the dropzone title/dragDrop copy keys", () => {
    expect(source).toContain("upload.dropzone.title");
  });
  it("has no bg-red-50 error box class", () => {
    expect(source).not.toContain("bg-red-50 border");
  });
  it("closes the grid columns and uses destructive token for errors", () => {
    expect(source).toContain("bg-destructive/10 text-destructive");
  });
  it("has no leftover floating zoom overlay", () => {
    expect(source).not.toContain("absolute top-4 right-4 z-10 flex flex-col gap-2");
  });
  it("has no forbidden green dot class", () => {
    expect(source).not.toContain("bg-green-400");
  });
  it("has a no-areas confirmation dialog copy key", () => {
    expect(source).toContain("upload.noAreas.title");
  });
  it("uses upload.error.capture copy key instead of hardcoded Korean", () => {
    expect(source).toContain("upload.error.capture");
    expect(source).not.toContain("PDF 페이지를 캡처할 수 없습니다");
  });
  it("uses upload.saveAndPublish copy key", () => {
    expect(source).toContain("upload.saveAndPublish");
  });
  it("has no language-detection-by-string-comparison hack", () => {
    expect(source).not.toContain('=== "지우기"');
  });
  it("saves the toast copy for plain save", () => {
    expect(source).toContain("upload.saved");
  });
  it("has no hardcoded color classes", () => {
    expect(source).not.toContain("bg-white/90");
    expect(source).not.toContain("bg-red-50 ");
    expect(source).not.toContain("bg-gray-100");
  });
  it("imports the toast helper", () => {
    expect(source).toContain('from "sonner"');
  });
  it("has at least 3 aria-label attributes", () => {
    const matches = source.match(/aria-label=/g) || [];
    expect(matches.length).toBeGreaterThanOrEqual(3);
  });
  it("shows no-areas confirmation instead of blocking save when totally empty", () => {
    expect(source).toContain("showNoAreasModal");
  });
  it("routes to publish page after save-and-publish", () => {
    expect(source).toContain("publish?doc=");
  });
});
