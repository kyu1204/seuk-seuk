import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./templates-list.tsx", import.meta.url), "utf-8");

describe("templates-list.tsx source", () => {
  it("no leftover truncateName helper", () => {
    expect(source).not.toContain("truncateName");
  });
  it("template tiles have no workflow status badge", () => {
    expect(source).not.toContain('status="draft"');
  });
  it("grid uses gap-5 sm:grid-cols-2 lg:grid-cols-4", () => {
    expect(source).toContain("grid gap-5 sm:grid-cols-2 lg:grid-cols-4");
  });
  it("has no leftover Card import for the template grid", () => {
    expect(source).not.toContain('import { Card, CardContent, CardHeader } from "@/components/ui/card"');
  });

  it("still uses useSearchParams for the publishTemplate flow", () => {
    expect(source).toContain("useSearchParams");
  });

  it("navigates to the publications tab after publishing", () => {
    expect(source).toContain('router.push("/dashboard?tab=publications")');
  });

  it("uses DocumentTile for the card layout without a manual role=link", () => {
    expect(source).toContain("DocumentTile");
    expect(source).not.toContain('role="link"');
  });

  it("uses AlertDialog for delete confirmation", () => {
    expect(source).toContain("AlertDialog");
    expect(source).toContain("templates.delete.confirmTitle");
    expect(source).toContain("templates.delete.confirmDescription");
    expect(source).toContain("templates.delete.confirm");
    expect(source).toContain("text-destructive");
    expect(source).toContain("common.cancel");
  });

  it("shows toasts for delete success/error and publish success", () => {
    expect(source).toContain("templates.delete.success");
    expect(source).toContain("templates.delete.error");
    expect(source).toContain("templates.publish.success");
  });

  it("shows a retryable error state instead of raw Error text", () => {
    expect(source).not.toContain("Error: {error}");
    expect(source).toContain("templates.error.load");
    expect(source).toContain("common.retry");
  });

  it("deletion is matched by template id", () => {
    expect(source).toContain("deleteTarget");
  });

  it("guards the delete target name against undefined for the type checker", () => {
    expect(source).toContain('deleteTarget?.name ?? ""');
  });
});
