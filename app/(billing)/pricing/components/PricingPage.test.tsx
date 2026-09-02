import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./PricingPage.tsx", import.meta.url), "utf-8");

describe("PricingPage.tsx source", () => {
  it("uses toast instead of alert()", () => {
    expect(source).not.toContain("alert(");
  });

  it("has no remaining alert() calls anywhere in the file", () => {
    expect((source.match(/alert\(/g) || []).length).toBe(0);
  });

  it("imports toast from sonner", () => {
    expect(source).toContain('from "sonner"');
  });
});
