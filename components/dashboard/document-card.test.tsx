import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-card.tsx", import.meta.url), "utf-8");

describe("document-card.tsx source", () => {
  it("uses BadgeStatus-safe status value", () => {
    expect(source).toContain("as \"draft\" | \"published\" | \"completed\"");
  });
  it("uses StatusBadge instead of ad-hoc badge variants", () => {
    expect(source).toContain("StatusBadge");
    expect(source).not.toContain("bg-green-");
    expect(source).not.toContain("text-gray-");
    expect(source).not.toContain('variant="success"');
  });
});
