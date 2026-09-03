export interface ResolvePlanCtaInput {
  planKey: string;
  isCurrent: boolean;
  isFree: boolean;
  isEnterprise: boolean;
  currentRank: number;
  planRank: number;
}

export interface PlanCta {
  labelKey: string;
  href: string | null;
  disabled: boolean;
}

export function resolvePlanCta({
  isCurrent,
  isFree,
  isEnterprise,
  currentRank,
  planRank,
}: ResolvePlanCtaInput): PlanCta {
  if (isCurrent) {
    return { labelKey: "pricingPage.currentlyUsing", href: null, disabled: true };
  }
  if (isEnterprise) {
    return { labelKey: "pricingPage.contactUs", href: "/contact", disabled: false };
  }
  if (isFree && currentRank > planRank) {
    return { labelKey: "pricingPage.downgradeNotAllowed", href: null, disabled: true };
  }
  return { labelKey: "pricingPage.selectPlan", href: null, disabled: false };
}
