import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.join(__dirname, "LoginPage.tsx"), "utf-8");

describe("LoginPage.tsx cliche classes", () => {
  it("has no bg-dot-pattern or gradient-text classes", () => {
    expect(src).not.toMatch(/bg-dot-pattern/);
    expect(src).not.toMatch(/gradient-text/);
  });

  it("has no forbidden R11 strings", () => {
    expect(src).not.toMatch(/bg-dot-pattern/);
    expect(src).not.toMatch(/gradient-text/);
    expect(src).not.toMatch(/text-xs text-primary/);
  });
});

describe("LoginPage.tsx R11 auth shell wiring", () => {
  it("uses AuthShell", () => {
    expect(src).toMatch(/AuthShell/);
  });

  it("uses login.title, login.noAccount, login.register copy keys", () => {
    expect(src).toMatch(/login\.title/);
    expect(src).toMatch(/login\.noAccount/);
    expect(src).toMatch(/login\.register/);
  });

  it("has the or-email divider and forgot password link", () => {
    expect(src).toMatch(/login\.orEmail/);
    expect(src).toMatch(/login\.forgotPassword/);
    expect(src).toMatch(/py-2/);
  });

  it("has a password visibility toggle with aria-label", () => {
    expect(src).toMatch(/login\.togglePassword/);
    expect(src).toMatch(/aria-label/);
  });

  it("renders form-level error from state.error", () => {
    expect(src).toMatch(/\.error/);
    expect(src).toMatch(/bg-destructive\/10 text-destructive text-sm px-3 py-2/);
  });
});
