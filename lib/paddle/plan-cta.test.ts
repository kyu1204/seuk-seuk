import { describe, expect, it } from "vitest";
import { resolvePlanCta } from "./plan-cta";

describe("resolvePlanCta", () => {
  it("returns disabled currentlyUsing for the current plan", () => {
    expect(
      resolvePlanCta({
        planKey: "pro",
        isCurrent: true,
        isFree: false,
        isEnterprise: false,
        currentRank: 1,
        planRank: 1,
      })
    ).toEqual({ labelKey: "pricingPage.currentlyUsing", href: null, disabled: true });
  });

  it("returns contactUs with /contact href for enterprise plan", () => {
    expect(
      resolvePlanCta({
        planKey: "enterprise",
        isCurrent: false,
        isFree: false,
        isEnterprise: true,
        currentRank: 0,
        planRank: 3,
      })
    ).toEqual({ labelKey: "pricingPage.contactUs", href: "/contact", disabled: false });
  });

  it("returns disabled downgradeNotAllowed for free plan when on a higher plan", () => {
    expect(
      resolvePlanCta({
        planKey: "free",
        isCurrent: false,
        isFree: true,
        isEnterprise: false,
        currentRank: 1,
        planRank: 0,
      })
    ).toEqual({ labelKey: "pricingPage.downgradeNotAllowed", href: null, disabled: true });
  });

  it("returns enabled selectPlan otherwise", () => {
    expect(
      resolvePlanCta({
        planKey: "starter",
        isCurrent: false,
        isFree: false,
        isEnterprise: false,
        currentRank: 0,
        planRank: 1,
      })
    ).toEqual({ labelKey: "pricingPage.selectPlan", href: null, disabled: false });
  });

  it("free plan with no current plan (currentRank equal) is still selectable", () => {
    expect(
      resolvePlanCta({
        planKey: "free",
        isCurrent: false,
        isFree: true,
        isEnterprise: false,
        currentRank: 0,
        planRank: 0,
      })
    ).toEqual({ labelKey: "pricingPage.selectPlan", href: null, disabled: false });
  });
});
