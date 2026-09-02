import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publish-form.tsx", import.meta.url), "utf-8");

describe("publish-form.tsx source", () => {
  it("uses publish.password.optional copy key", () => {
    expect(source).toContain("publish.password.optional");
  });

  it("has no hardcoded gray hint text color", () => {
    expect(source).not.toContain("text-gray-500");
  });

  it("focuses the first invalid field", () => {
    expect(source).toContain(".focus()");
  });
});
