import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./language-selector.tsx", import.meta.url), "utf-8");

describe("language-selector.tsx source", () => {
  it("has an aria-label", () => {
    expect(source).toContain("aria-label");
  });
});
