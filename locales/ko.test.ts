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

  it("has the R11 auth shell/copy values", () => {
    expect(ko["auth.panel.title"]).toBe(
      "오늘 보낸 계약서,\n오늘 서명받으세요"
    );
    expect(ko["auth.panel.description"]).toBe(
      "문서를 올리고 서명 칸을 찍은 뒤 링크만 보내면 됩니다. 받는 사람은 가입 없이 휴대폰에서 서명해요."
    );
    expect(ko["auth.panel.sampleDoc"]).toBe("업무 위탁 계약서");
    expect(ko["login.forgotPassword"]).toBe("비밀번호 재설정");
    expect(ko["login.orEmail"]).toBe("또는 이메일로");
    expect(ko["login.togglePassword"]).toBe("비밀번호 표시 전환");
    expect(ko["register.termsOfService"]).toBe("이용약관");
    expect(ko["register.agreeText"]).toBe("{{terms}}과 {{privacy}}에 동의합니다");
    expect(ko["register.privacyPolicy"]).toBe("개인정보처리방침");
    expect(ko["register.passwordHint"]).toBe(
      "8자 이상, 영문과 숫자를 포함해 주세요."
    );
    expect(ko["register.agreeRequired"]).toBe(
      "계속하려면 약관에 동의해 주세요."
    );
    expect(ko["forgotPassword.title"]).toBe("비밀번호 재설정");
    expect(ko["forgotPassword.resendIn"]).toBe(
      "{{seconds}}초 후 다시 보낼 수 있어요"
    );
    expect(ko["forgotPassword.checkInbox"]).toMatch("받은편지함");
    expect(ko["register.success.checkEmail"]).toBe("이메일을 확인해 주세요");
    expect(ko["register.success.emailSent"]).toBe(
      "인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝납니다."
    );
    expect(en["auth.panel.sampleDoc"]).toBe("Service Agreement");
    expect(en["forgotPassword.title"]).toBe("Reset Password");
    expect(en["register.privacyPolicy"]).toBe("Privacy Policy");
    expect(ko["login.google"]).toBe("구글");
    expect(en["login.google"]).toBe("Google");
  });

  it("has the R21 dashboard header/usage summary values", () => {
    expect(ko["dashboard.header.description"]).toBe("문서를 올리고 서명을 받아보세요.");
    expect(ko["dashboard.publish"]).toBe("발행하기");
    expect(ko["dashboard.upload.document"]).toBe("문서 올리기");
    expect(ko["usage.summary.sent"]).toBe("이번 달 보낸 문서");
    expect(ko["usage.summary.active"]).toBe("진행 중인 문서");
    expect(ko["usage.managePlan"]).toBe("플랜 관리");
    expect(ko["usage.limit.reachedHint"]).toBe(
      "한도에 도달했어요. 플랜을 바꾸거나 추가문서를 구매하세요."
    );

    expect(en["dashboard.publish"]).toBe("Publish");
    expect(en["dashboard.upload.document"]).toBe("Upload document");
    expect(en["usage.summary.sent"]).toBeTruthy();
  });
});
