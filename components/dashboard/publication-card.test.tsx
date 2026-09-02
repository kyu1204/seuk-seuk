import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publication-card.tsx", import.meta.url), "utf-8");

describe("publication-card.tsx source", () => {
  it("uses DocumentTile for the card layout", () => {
    expect(source).toContain("DocumentTile");
  });

  it("has no leftover getStatusBadge helper", () => {
    expect(source).not.toContain("getStatusBadge");
  });

  it("casts status to a BadgeStatus-safe value", () => {
    expect(source).toContain("as \"active\" | \"completed\" | \"expired\"");
  });
  it("uses DocumentTile instead of ad-hoc badge variants", () => {
    expect(source).not.toContain("bg-green-");
    expect(source).not.toContain("text-gray-");
    expect(source).not.toContain('variant="success"');
  });
  it("has no hand-rolled checkbox svg or gray border", () => {
    expect(source).not.toContain("<svg");
    expect(source).not.toContain("border-gray-300");
  });

  it("uses toast instead of alert() for delete errors", () => {
    expect(source).not.toContain("alert(");
    expect(source).toContain("dashboard.publications.delete.error");
    expect(source).toContain("toast.error");
  });
});
