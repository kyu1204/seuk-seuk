import { describe, expect, it } from "vitest";
// R52
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "mypage-content.tsx"), "utf-8");

describe("mypage-content.tsx (R52)", () => {
  it("uses the destructive-border danger zone card", () => {
    expect(source).toMatch(/border-destructive\/40/);
  });

  it("has no inline Korean fallback strings in t() calls", () => {
    expect(source).not.toMatch(/t\("[a-zA-Z.]*",\s*"[가-힣]/);
  });

  it("renders the three spec cards", () => {
    expect(source).toMatch(/mypage\.profile\.title/);
    expect(source).toMatch(/mypage\.plan\.title/);
    expect(source).toMatch(/mypage\.dangerZone\.title/);
  });

  it("reuses the shared UsageWidget for plan usage", () => {
    expect(source).toMatch(/UsageWidget/);
  });

  it("links to /bills to manage the plan", () => {
    expect(source).toMatch(/mypage\.plan\.manage/);
    expect(source).toMatch(/\/bills/);
  });
});
