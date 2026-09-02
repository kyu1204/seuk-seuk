import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./templates-list.tsx", import.meta.url), "utf-8");

describe("templates-list.tsx source", () => {
  it("still uses useSearchParams for the publishTemplate flow", () => {
    expect(source).toContain("useSearchParams");
  });

  it("navigates to the publications tab after publishing", () => {
    expect(source).toContain('router.push("/dashboard?tab=publications")');
  });
});
