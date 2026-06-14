/**
 * Plan gating for the template feature (Pro / Enterprise only).
 *
 * Mirrors the pattern used by `canUploadPdf` in subscription-actions.ts so
 * that template access is decided consistently with other premium features.
 */
export const TEMPLATE_ALLOWED_PLANS = ["pro", "enterprise"] as const;

export function isTemplateAllowedPlan(
  planName: string | null | undefined
): boolean {
  if (!planName) return false;
  const normalized = planName.trim().toLowerCase();
  return (TEMPLATE_ALLOWED_PLANS as readonly string[]).includes(normalized);
}
