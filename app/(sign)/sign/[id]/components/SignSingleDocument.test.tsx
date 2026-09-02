import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignSingleDocument.tsx", import.meta.url), "utf-8");

describe("SignSingleDocument.tsx source", () => {
  it("uses the shared SignHeader instead of copy-pasted headers", () => {
    expect(source).toContain("SignHeader");
  });

  it("uses seal/amber tokens for completed/expired states", () => {
    expect(source).toContain("text-seal");
    expect(source).toContain("text-amber");
  });

  it("uses bg-background instead of bg-white for overlays", () => {
    expect(source).not.toMatch(/bg-white/);
    expect(source).toContain("bg-background/90");
    expect(source).toContain("bg-background rounded-lg p-4");
  });

  it("uses destructive tokens for the inline error box", () => {
    expect(source).toContain("bg-destructive/10");
  });

  it("uses seal-soft/amber-soft backgrounds", () => {
    expect(source).toContain("bg-seal-soft");
    expect(source).toContain("bg-amber-soft");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });
});
