import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf-8");

describe("register/success page.tsx cliche classes", () => {
  it("has no bg-dot-pattern or gradient-text classes", () => {
    expect(src).not.toMatch(/bg-dot-pattern/);
    expect(src).not.toMatch(/gradient-text/);
  });
});

describe("register/success page.tsx R11 auth shell wiring", () => {
  it("uses AuthShell and register.success.checkEmail/emailSent", () => {
    expect(src).toMatch(/AuthShell/);
    expect(src).toMatch(/register\.success\.checkEmail/);
    expect(src).toMatch(/register\.success\.emailSent/);
  });

  it("does not use the retired register.success.title copy", () => {
    expect(src).not.toMatch(/register\.success\.title/);
  });
});
