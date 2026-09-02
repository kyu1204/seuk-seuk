import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./site-header.tsx", import.meta.url), "utf-8");

describe("site-header.tsx source", () => {
  it("has at least 2 aria-label attributes", () => {
    expect((source.match(/aria-label/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it("does not use bg-transparent", () => {
    expect(source).not.toContain("bg-transparent");
  });

  it("has a nav aria-label", () => {
    expect(source).toContain('aria-label="site navigation"');
  });

  it("has a logo aria-label", () => {
    expect(source).toContain("aria-label={t(\"app.title\")}");
  });

  it("links to /dashboard", () => {
    expect(source).toContain('href="/dashboard"');
  });

  it("uses sticky header with backdrop blur", () => {
    expect(source).toContain("sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur");
  });
});
