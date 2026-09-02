import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-card.tsx", import.meta.url), "utf-8");

describe("document-card.tsx source", () => {
  it("uses BadgeStatus-safe status value", () => {
    expect(source).toContain("as \"draft\" | \"published\" | \"completed\"");
  });
  it("uses DocumentTile instead of ad-hoc badge variants", () => {
    expect(source).toContain("DocumentTile");
    expect(source).not.toContain("bg-green-");
    expect(source).not.toContain("text-gray-");
    expect(source).not.toContain('variant="success"');
  });
  it("has no hand-rolled checkbox svg or gray border", () => {
    expect(source).not.toContain("<svg");
    expect(source).not.toContain("border-gray-300");
  });
});
