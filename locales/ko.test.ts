import { describe, expect, it } from "vitest";
import ko from "./ko";
import en from "./en";

describe("locale parity (ko/en)", () => {
  it("has identical key sets", () => {
    const koKeys = Object.keys(ko).sort();
    const enKeys = Object.keys(en).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it("has no empty values in ko", () => {
    for (const [key, value] of Object.entries(ko)) {
      expect(value, `ko["${key}"] should not be empty`).not.toBe("");
    }
  });

  it("has no empty values in en", () => {
    // English has no counter word equivalent to Korean "개", so the unit
    // suffix is intentionally blank (quantity renders bare, e.g. "5").
    const EMPTY_ALLOWLIST = new Set(["pricing.credit.per"]);
    for (const [key, value] of Object.entries(en)) {
      if (EMPTY_ALLOWLIST.has(key)) continue;
      expect(value, `en["${key}"] should not be empty`).not.toBe("");
    }
  });

  it("has the R02 status label values", () => {
    expect(ko["status.draft"]).toBe("초안");
    expect(ko["status.published"]).toBe("발행됨");
    expect(ko["status.completed"]).toBe("완료");
    expect(ko["status.expired"]).toBe("만료");
    expect(ko["dashboard.filter.published"]).toBe("발행됨");
    expect(ko["dashboard.tabs.publications"]).toBe("발행됨");
    expect(ko["dashboard.publications.status.expired"]).toBe("만료");
    expect(ko["publicationDetail.status.expired"]).toBe("만료");
    expect(ko["publicationDetail.documentStatus.published"]).toBe("발행됨");

    expect(en["status.draft"]).toBe("Draft");
    expect(en["status.published"]).toBe("Published");
    expect(en["status.completed"]).toBe("Completed");
    expect(en["status.expired"]).toBe("Expired");
    expect(en["dashboard.filter.published"]).toBe("Published");
    expect(en["dashboard.tabs.publications"]).toBe("Published");
  });

  it("has the R03 header nav/aria label values", () => {
    expect(ko["header.nav.documents"]).toBe("내 문서");
    expect(ko["header.nav.pricing"]).toBe("요금제");
    expect(ko["header.nav.bills"]).toBe("결제");
    expect(ko["header.themeToggle"]).toBe("테마 변경");
    expect(ko["header.languageSelect"]).toBe("언어 선택");

    expect(en["header.nav.documents"]).toBe("Documents");
    expect(en["header.nav.pricing"]).toBe("Pricing");
    expect(en["header.nav.bills"]).toBe("Billing");
    expect(en["header.themeToggle"]).toBe("Change theme");
    expect(en["header.languageSelect"]).toBe("Select language");
  });
});
