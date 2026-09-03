import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./area-selector.tsx", import.meta.url), "utf-8");

describe("area-selector.tsx source", () => {
  it("has no fixed 50vh mobile height cap", () => {
    expect(source).not.toContain("max-h-[50vh]");
  });
});
