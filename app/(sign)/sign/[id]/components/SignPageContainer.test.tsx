import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignPageContainer.tsx", import.meta.url), "utf-8");

describe("SignPageContainer.tsx source", () => {
  it("does not keep an unused useLanguage hook", () => {
    expect(source).not.toContain("const { t } = useLanguage();");
  });

  it("uses the shared SignHeader", () => {
    expect(source).toContain("SignHeader");
  });

  it("computes remaining documents and signed count for the completed view", () => {
    expect(source).toContain("remainingDocuments");
    expect(source).toContain("signedCount");
  });

  it("accepts and forwards senderName", () => {
    expect(source).toContain("senderName");
    expect(source).toContain("senderName={senderName}");
  });

  it("uses the shared SignComplete view for the completed screen", () => {
    expect(source).toContain("SignComplete");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });
});
