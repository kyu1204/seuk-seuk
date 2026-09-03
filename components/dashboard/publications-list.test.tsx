import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publications-list.tsx", import.meta.url), "utf-8");

describe("publications-list.tsx source", () => {
  it("uses the shared dashboard grid spacing", () => {
    expect(source).toContain("grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4");
  });

  it("shows a retryable error state instead of raw Error text", () => {
    expect(source).not.toContain("Error: {error}");
    expect(source).toContain("dashboard.publications.error.load");
    expect(source).toContain("common.retry");
  });

  it("matches bulk delete failures by id, not name", () => {
    expect(source).toContain("failedIds");
  });

  it("passes items to the bulk delete modal", () => {
    expect(source).toContain("items={");
  });
});
