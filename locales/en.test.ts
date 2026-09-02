import { describe, expect, it } from "vitest";
import en from "./en";

// "language.ko" intentionally holds the native name of Korean ("한국어"),
// shown in the language switcher regardless of active UI language.
const HANGUL_ALLOWLIST = new Set(["language.ko"]);

// R03: header.* keys added for site-header renewal, checked via ko.test.ts parity.
describe("en locale has no stray Korean text", () => {
  it("contains no Hangul outside the allowlist", () => {
    const offenders = Object.entries(en)
      .filter(([key]) => !HANGUL_ALLOWLIST.has(key))
      .filter(([, value]) => /[가-힣]/.test(value));
    expect(offenders).toEqual([]);
  });
});
