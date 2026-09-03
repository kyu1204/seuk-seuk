import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "DocumentDetailPage.tsx"),
  "utf-8"
);

describe("DocumentDetailPage.tsx", () => {
  it("uses the pdfNotReady locale key instead of hardcoded Korean", () => {
    expect(source).not.toMatch(/PDF 페이지가 아직 준비되지 않았습니다/);
    expect(source).toMatch(/t\("documentDetail\.pdfNotReady"\)/);
  });

  it("has no t() fallback with a hardcoded Korean default", () => {
    expect(source).not.toMatch(/t\("[a-zA-Z.]*",\s*"[가-힣]/);
  });
});
