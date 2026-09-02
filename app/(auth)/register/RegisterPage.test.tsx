import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.join(__dirname, "RegisterPage.tsx"), "utf-8");

describe("RegisterPage.tsx cliche classes", () => {
  it("has no bg-dot-pattern or gradient-text classes", () => {
    expect(src).not.toMatch(/bg-dot-pattern/);
    expect(src).not.toMatch(/gradient-text/);
  });

  it("has no quoted ampersand separator between terms and privacy links", () => {
    const forbidden = ["&"].join("");
    expect(src).not.toMatch(new RegExp('"' + " " + forbidden + " " + '"'));
  });
});

describe("RegisterPage.tsx R11 auth shell wiring", () => {
  it("uses AuthShell", () => {
    expect(src).toMatch(/AuthShell/);
  });

  it("uses register.title, register.agreeText, register.termsOfService, register.privacyPolicy", () => {
    expect(src).toMatch(/register\.title/);
    expect(src).toMatch(/register\.agreeText/);
    expect(src).toMatch(/register\.termsOfService/);
    expect(src).toMatch(/register\.privacyPolicy/);
  });

  it("shows the password hint below the field", () => {
    expect(src).toMatch(/register\.passwordHint/);
    expect(src).toMatch(/text-xs text-muted-foreground/);
  });

  it("has a password visibility toggle with aria-label", () => {
    expect(src).toMatch(/aria-label/);
  });

  it("submit button is always enabled and shows agreeRequired when unchecked", () => {
    expect(src).not.toMatch(/disabled={!privacyAccepted}/);
    expect(src).toMatch(/register\.agreeRequired/);
  });
});
