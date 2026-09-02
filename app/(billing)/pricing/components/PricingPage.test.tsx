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

  it("has no leftover 연동 예정 copy", () => {
    expect(source).not.toContain("연동 예정");
  });

  it("has a billing cycle radiogroup", () => {
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain('role="radio"');
    expect(source).toContain("aria-checked");
  });

  it("has no banned color utility classes", () => {
    expect(source).not.toMatch(/bg-green-/);
    expect(source).not.toContain("bg-red-500");
    expect(source).not.toContain("text-red-600");
    expect(source).not.toContain("scale-105");
  });

  it("has no inline Korean fallback copy passed to t()", () => {
    expect(source).not.toMatch(/t\("[^"]+",\s*"[가-힣]/);
  });

  it("uses resolvePlanCta from lib/paddle/plan-cta", () => {
    expect(source).toContain("resolvePlanCta");
    expect(source).toContain('from "@/lib/paddle/plan-cta"');
  });
});
