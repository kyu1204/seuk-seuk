import { describe, expect, it } from "vitest";
// R52
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "delete-account-form.tsx"), "utf-8");

describe("delete-account-form.tsx (R52)", () => {
  it("uses the mypage.dangerZone.confirmEmail locale key", () => {
    expect(source).toMatch(/mypage\.dangerZone\.confirmEmail/);
  });
});
