import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "TemplateDetailPageContent.tsx"),
  "utf-8"
);

describe("TemplateDetailPageContent.tsx", () => {
  it("has no t() fallback with a hardcoded Korean default", () => {
    expect(source).not.toMatch(/t\("[a-zA-Z.]*",\s*"[가-힣]/);
  });

  it("has no t() fallback with a hardcoded default at all", () => {
    expect(source).not.toMatch(/t\("[a-zA-Z.]+",\s*"/);
  });

  it("uses 삭제하세요 instead of 제거하세요", () => {
    expect(source).not.toMatch(/제거하세요/);
    expect(source).toMatch(/삭제하세요/);
  });
});
