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
});
