import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publications-list.tsx", import.meta.url), "utf-8");

describe("publications-list.tsx source", () => {
  it("uses the shared dashboard grid spacing", () => {
    expect(source).toContain("grid gap-5 sm:grid-cols-2 lg:grid-cols-4");
  });
});
