import { describe, it, expect } from "vitest";
import { isTemplateAllowedPlan, TEMPLATE_ALLOWED_PLANS } from "./gating";

describe("isTemplateAllowedPlan", () => {
  it("allows the pro plan", () => {
    expect(isTemplateAllowedPlan("pro")).toBe(true);
  });

  it("allows the enterprise plan", () => {
    expect(isTemplateAllowedPlan("enterprise")).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(isTemplateAllowedPlan("Pro")).toBe(true);
    expect(isTemplateAllowedPlan("ENTERPRISE")).toBe(true);
  });

  it("rejects the free/basic plan", () => {
    expect(isTemplateAllowedPlan("free")).toBe(false);
    expect(isTemplateAllowedPlan("basic")).toBe(false);
  });

  it("rejects null/undefined/empty (no subscription)", () => {
    expect(isTemplateAllowedPlan(null)).toBe(false);
    expect(isTemplateAllowedPlan(undefined)).toBe(false);
    expect(isTemplateAllowedPlan("")).toBe(false);
  });

  it("trims surrounding whitespace", () => {
    expect(isTemplateAllowedPlan("  pro  ")).toBe(true);
  });

  it("exposes the allowed plan list", () => {
    expect(TEMPLATE_ALLOWED_PLANS).toContain("pro");
    expect(TEMPLATE_ALLOWED_PLANS).toContain("enterprise");
  });
});
