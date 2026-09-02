import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./infinite-scroll-documents.tsx", import.meta.url), "utf-8");

describe("infinite-scroll-documents.tsx source", () => {
  it("uses the shared dashboard grid spacing", () => {
    expect(source).toContain("grid gap-5 sm:grid-cols-2 lg:grid-cols-4");
  });
});
