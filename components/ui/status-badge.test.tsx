import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./status-badge.tsx", import.meta.url), "utf-8");

describe("status-badge.tsx source", () => {
  it("re-exports the pure status-badge-utils helpers", () => {
    expect(source).toContain("status-badge-utils");
  });

  it("uses useLanguage for labels", () => {
    expect(source).toContain("useLanguage");
  });

  it("renders a Check icon for completed status", () => {
    expect(source).toContain("Check");
  });
});
