import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publication-card.tsx", import.meta.url), "utf-8");

describe("publication-card.tsx source", () => {
  it("uses StatusBadge for the card status", () => {
    expect(source).toContain("<StatusBadge");
  });

  it("has no leftover getStatusBadge helper", () => {
    expect(source).not.toContain("getStatusBadge");
  });

  it("casts status to a BadgeStatus-safe value", () => {
    expect(source).toContain("as \"active\" | \"completed\" | \"expired\"");
  });
  it("uses StatusBadge instead of ad-hoc badge variants", () => {
    expect(source).toContain("StatusBadge");
    expect(source).not.toContain("bg-green-");
    expect(source).not.toContain("text-gray-");
    expect(source).not.toContain('variant="success"');
  });
});
