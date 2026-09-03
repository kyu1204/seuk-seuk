import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(__dirname, "google-login-button.tsx"),
  "utf-8"
);

describe("google-login-button.tsx R11 44px touch target", () => {
  it("uses a 44px (h-11) button", () => {
    expect(src).toMatch(/h-11/);
  });

  it("uses the login.google locale key instead of hardcoded text", () => {
    expect(src).toMatch(/login\.google/);
    expect(src).not.toMatch(/>\s*Google\s*</);
    expect(src).toMatch(/t\("login\.google"\)/);
  });
});
