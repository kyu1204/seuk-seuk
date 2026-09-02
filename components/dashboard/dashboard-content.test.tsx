import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./dashboard-content.tsx", import.meta.url), "utf-8");

describe("dashboard-content.tsx source", () => {
  it("uses useSearchParams", () => {
    expect(source).toContain("useSearchParams");
  });

  it("uses setActiveTab for the Tabs onValueChange", () => {
    expect(source).toContain("onValueChange={(value) => setActiveTab(value as TabType)}");
  });

  it("scrolls false on tab replace", () => {
    expect(source).toContain("{ scroll: false }");
  });

  it("shows tab counts", () => {
    expect(source).toContain("text-muted-foreground ml-1");
  });

  it("uses resolveTab from dashboard-tabs", () => {
    expect(source).toContain("resolveTab");
  });

  it("uses router.replace to sync the tab", () => {
    expect(source).toContain("router.replace");
  });

  it("matches bulk delete failures by id, not name", () => {
    expect(source).toContain("failedIds");
  });

  it("shows a retryable error state instead of raw Error text", () => {
    expect(source).not.toContain("Error: {error}");
    expect(source).toContain("dashboard.error.load");
    expect(source).toContain("common.retry");
  });

  it("shows delete progress in the bulk delete modal button", () => {
    expect(source).toContain("dashboard.bulkDelete.progress");
  });

  it("passes items to the bulk delete modal", () => {
    expect(source).toContain("items={");
  });

  it("normalizes nullable document status", () => {
    expect(source).toContain('doc.status ?? "draft"');
  });
});
