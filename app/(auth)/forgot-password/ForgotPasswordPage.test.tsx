import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(
  path.join(__dirname, "ForgotPasswordPage.tsx"),
  "utf-8"
);

describe("ForgotPasswordPage.tsx cliche classes", () => {
  it("has no bg-dot-pattern or gradient-text classes", () => {
    expect(src).not.toMatch(/bg-dot-pattern/);
    expect(src).not.toMatch(/gradient-text/);
  });
});

describe("ForgotPasswordPage.tsx R11 auth shell wiring", () => {
  it("uses AuthShell and forgotPassword.title", () => {
    expect(src).toMatch(/AuthShell/);
    expect(src).toMatch(/forgotPassword\.title/);
  });

  it("resend calls the server action again with a 30s cooldown", () => {
    expect(src).toMatch(/forgotPassword\.resendIn/);
    expect(src).toMatch(/30/);
    expect(src).toMatch(/dispatch/);
  });

  it("checkInbox copy refers to 받은편지함", () => {
    expect(src).toMatch(/forgotPassword\.checkInbox/);
  });
});
