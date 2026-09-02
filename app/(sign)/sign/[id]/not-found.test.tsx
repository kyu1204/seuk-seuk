import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./not-found.tsx", import.meta.url), "utf-8");

describe("not-found.tsx source", () => {
  it("does not import FileSignature directly (SignHeader owns the logo)", () => {
    expect(source).not.toContain("FileSignature");
  });

  it("uses the shared SignHeader instead of a copy-pasted header", () => {
    expect(source).toContain("SignHeader");
  });

  it("uses an outline return-home button (2)", () => {
    expect(source).toMatch(/variant="outline"/);
    expect(source).toContain("sign.returnHome");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });
});
