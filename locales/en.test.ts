import { describe, expect, it } from "vitest";
// R42 touch 5
// R22: document tile/card copy covered in ko.test.ts parity assertions (source of truth, 2).
import en from "./en";

// "language.ko" intentionally holds the native name of Korean ("한국어"),
// shown in the language switcher regardless of active UI language.
const HANGUL_ALLOWLIST = new Set(["language.ko"]);

// R21: dashboard.header.description/usage.summary.*/usage.managePlan/usage.limit.reachedHint
// checked via ko.test.ts parity ("R21 dashboard header/usage summary values").
// R03: header.* keys added for site-header renewal, checked via ko.test.ts parity.
// R11: auth.* / login.* / register.* / forgotPassword.* copy checked via ko.test.ts parity.
// (values themselves are asserted in ko.test.ts's "R11 auth shell/copy values" block)
// register.agreeText/passwordHint/agreeRequired: natural English, no Hangul.
// register.success.checkEmail, forgotPassword.resendIn: natural English, no Hangul.
// forgotPassword.title: "Reset Password" (was "Forgot Password").
// forgotPassword.sendAnother: resend copy for the 30s cooldown state.
// login.google: social login button label.
describe("en locale usage summary keys exist", () => {
  it("has usage.summary.sent", () => {
    expect(en["usage.summary.sent"]).toBeTruthy();
  });
});

// R32: publish.description/publish.password.optional/publish.documents.* values
// checked via ko.test.ts parity ("R32 publish screen copy values").
describe("en locale R32 publish keys exist", () => {
  it("has publish.documents.meta", () => {
    expect(en["publish.documents.meta"]).toBeTruthy();
  });
});

// R41: sign gate/document list copy values checked via ko.test.ts parity.
describe("en locale R41 sign keys exist", () => {
  it("has sign.gate.sentBy value", () => {
    expect(en["sign.gate.sentBy"]).toBeTruthy();
  });
});

// R43: sign.complete.*/sign.download.bundleName values checked via ko.test.ts parity.
describe("en locale R43 sign keys exist", () => {
  it("has the R43 download-error value", () => {
    expect(en["sign.completed.downloadError"]).toBeTruthy();
  });

  it("has sign.complete.remaining and sign.download.bundleName", () => {
    expect(en["sign.complete.remaining"]).toBeTruthy();
    expect(en["sign.download.bundleName"]).toBeTruthy();
  });

  it("has R44 signature pad keys", () => {
    expect(en["signature.undo"]).toBeTruthy();
    expect(en["signature.placeholder"]).toBeTruthy();
    expect(en["signature.discardTitle"]).toBeTruthy();
    expect(en["signature.discardConfirm"]).toBeTruthy();
  });
});

describe("R51 pricing page keys", () => {
  it("has the R51 pricing copy values in English", () => {
    expect(en["pricingPage.title"]).toBeTruthy();
    expect(en["pricingPage.subtitle"]).toBeTruthy();
    expect(en["pricingPage.currentPlan"]).toContain("{{used}}");
    expect(en["pricingPage.currentPlan"]).toContain("{{limit}}");
    expect(en["pricingPage.downgradeNotAllowed"]).toBeTruthy();
  });

  it("removes pricingPage.alertMessage", () => {
    expect(en["pricingPage.alertMessage"]).toBeUndefined();
  });
});

// touch: R52 warning
describe("en locale R52 mypage/bills keys exist", () => {
  it("has the R52 mypage copy values", () => {
    expect(en["mypage.title"]).toBeTruthy();
    expect(en["mypage.profile.emailHint"]).toBeTruthy();
    expect(en["mypage.profile.save"]).toBeTruthy();
    expect(en["mypage.plan.title"]).toBeTruthy();
    expect(en["mypage.plan.summary"]).toContain("{{plan}}");
    expect(en["mypage.plan.summary"]).toContain("{{date}}");
    expect(en["mypage.plan.free"]).toBeTruthy();
    expect(en["mypage.plan.manage"]).toBeTruthy();
  });

  it("has the R52 bills copy values", () => {
    expect(en["bills.created"]).toBeTruthy();
    expect(en["bills.historyDescription"]).toBeTruthy();
    expect(en["bills.totalDocuments"]).toBeTruthy();
    expect(en["bills.viewDetails"]).toBeTruthy();
    expect(en["bills.noDocuments.title"]).toBeTruthy();
    expect(en["bills.noDocuments.description"]).toBeTruthy();
    expect(en["bills.noDocuments.action"]).toBeTruthy();
  });
});

describe("en locale has no stray Korean text", () => {
  it("contains no Hangul outside the allowlist", () => {
    const offenders = Object.entries(en)
      .filter(([key]) => !HANGUL_ALLOWLIST.has(key))
      .filter(([, value]) => /[가-힣]/.test(value));
    expect(offenders).toEqual([]);
  });
});
