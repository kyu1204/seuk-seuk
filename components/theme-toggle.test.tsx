import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./theme-toggle.tsx", import.meta.url), "utf-8");

describe("theme-toggle.tsx source", () => {
  it("has an aria-label", () => {
    expect(source).toContain("aria-label");
  });

  it("uses a fixed w-9 placeholder before mount", () => {
    expect(source).toContain("w-9");
  });
});
