import { describe, expect, it } from "vitest";
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

describe("en locale has no stray Korean text", () => {
  it("contains no Hangul outside the allowlist", () => {
    const offenders = Object.entries(en)
      .filter(([key]) => !HANGUL_ALLOWLIST.has(key))
      .filter(([, value]) => /[가-힣]/.test(value));
    expect(offenders).toEqual([]);
  });
});
