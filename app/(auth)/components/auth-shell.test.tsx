import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.join(__dirname, "auth-shell.tsx"), "utf-8");

describe("auth-shell.tsx layout classes", () => {
  it("has the AuthShell mini card and right panel classes", () => {
    expect(src).toMatch(/w-full max-w-\[380px\]/);
    expect(src).toMatch(/bg-seal text-primary-foreground/);
  });

  it("has the AuthShell grid/panel classes", () => {
    expect(src).toMatch(/bg-primary/);
    expect(src).toMatch(/md:grid-cols-2/);
    expect(src).toMatch(/md:hidden/);
  });

  it("has no bg-dot-pattern or gradient-text classes", () => {
    expect(src).not.toMatch(/bg-dot-pattern/);
    expect(src).not.toMatch(/gradient-text/);
  });
});
