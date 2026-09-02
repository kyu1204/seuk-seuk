import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(__dirname, "kakao-login-button.tsx"),
  "utf-8"
);

describe("kakao-login-button.tsx R11 44px touch target", () => {
  it("uses a 44px (h-11) button", () => {
    expect(src).toMatch(/h-11/);
  });
});
