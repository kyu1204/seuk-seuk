import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignPageContainer.tsx", import.meta.url), "utf-8");

describe("SignPageContainer.tsx source", () => {
  it("uses the shared SignHeader", () => {
    expect(source).toContain("SignHeader");
  });

  it("accepts and forwards senderName", () => {
    expect(source).toContain("senderName");
    expect(source).toContain("senderName={senderName}");
  });

  it("uses the seal token for the completed screen", () => {
    expect(source).toContain("text-seal");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });
});
