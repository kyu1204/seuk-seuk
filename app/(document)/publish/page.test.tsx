import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf-8");

describe("publish/page.tsx source", () => {
  it("has no hardcoded Korean copy", () => {
    expect((source.match(/[가-힣]/g) || []).length).toBe(0);
  });

  it("reads searchParams", () => {
    expect(source).toContain("searchParams");
  });
});
