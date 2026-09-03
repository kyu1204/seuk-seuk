import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignHeader.tsx", import.meta.url), "utf-8");

describe("SignHeader.tsx source", () => {
  it("uses the spec header height/padding/border/background classes", () => {
    expect(source).toContain("h-14 px-5 border-b bg-background");
  });

  it("renders the logo link and the language selector", () => {
    expect(source).toContain("LanguageSelector");
    expect(source).toContain('href="/"');
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });
});
