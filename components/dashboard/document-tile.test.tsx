import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./document-tile.tsx", import.meta.url), "utf-8");

describe("document-tile.tsx source", () => {
  it("uses role=button and aria-pressed for selectable cards", () => {
    expect(source).toContain('role="button"');
    expect(source).toContain("aria-pressed");
  });
  it("uses the shared Checkbox component", () => {
    expect(source).toContain("Checkbox");
  });
  it("uses the spec card height and hover border", () => {
    expect(source).toContain("h-36");
    expect(source).toContain("hover:border-primary/30");
  });
  it("status prop is optional so cards without a workflow status render no badge", () => {
    expect(source).toContain("status?: BadgeStatus");
  });
  it("does not use a scale hover effect", () => {
    expect(source).not.toContain("scale-");
  });
  it("only renders StatusBadge when a status is given", () => {
    expect(source).toContain("{status && <StatusBadge");
  });
});
