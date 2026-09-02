import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publication-detail-content.tsx", import.meta.url), "utf-8");

describe("publication-detail-content.tsx source", () => {
  it("uses StatusBadge for both status displays", () => {
    expect(source).toContain("<StatusBadge");
  });

  it("uses StatusBadge for the document-in-publication row", () => {
    const count = (source.match(/<StatusBadge/g) ?? []).length;
    expect(count).toBe(2);
  });

  it("casts publication.status to a BadgeStatus-safe value", () => {
    expect(source).toContain("as \"active\" | \"completed\" | \"expired\"");
  });

  it("has no leftover getStatusColor/getStatusLabel helpers", () => {
    expect(source).not.toContain("getStatusColor");
    expect(source).not.toContain("getStatusLabel");
  });
  it("uses StatusBadge instead of ad-hoc badge variants", () => {
    expect(source).toContain("StatusBadge");
    expect(source).not.toContain("bg-green-");
    expect(source).not.toContain("text-gray-");
    expect(source).not.toContain('variant="success"');
  });
});
