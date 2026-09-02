import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "page.tsx"), "utf-8");
// R52

describe("mypage/page.tsx (R52)", () => {
  it("has no hardcoded Korean text", () => {
    const hangulMatches = source.match(/[가-힣]/g) ?? [];
    expect(hangulMatches.length).toBe(0);
  });

  it("uses the mypage.error.loadProfile locale key", () => {
    expect(source).toMatch(/mypage\.error\.loadProfile/);
  });
});
