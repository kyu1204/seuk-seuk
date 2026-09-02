import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./status-filter.tsx", import.meta.url), "utf-8");

describe("status-filter.tsx source", () => {
  it("uses the spec chip styles for selected/unselected states", () => {
    expect(source).toContain("bg-primary/10 text-primary border-primary/30");
    expect(source).toContain("border text-muted-foreground bg-transparent");
  });
  it("has no unused Button/useState imports", () => {
    expect(source).not.toContain('import { useState }');
  });
  it("has no self mb-6 (parent owns spacing)", () => {
    expect(source).not.toContain("mb-6");
  });
});
