import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./bulk-delete-header.tsx", import.meta.url), "utf-8");

describe("bulk-delete-header.tsx source", () => {
  it("exit button has an aria-label", () => {
    expect(source).toContain('aria-label={t("dashboard.selectionMode.exit")}');
  });
  it("has no leftover title attr for the exit button", () => {
    expect(source).not.toContain('title={t("dashboard.selectionMode.exit")}');
  });
  it("sticks below the site header", () => {
    expect(source).toContain("sticky top-16");
  });
});
