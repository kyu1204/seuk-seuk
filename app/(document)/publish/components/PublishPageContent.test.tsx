import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./PublishPageContent.tsx", import.meta.url), "utf-8");

describe("PublishPageContent.tsx source", () => {
  it("uses publish.description copy key", () => {
    expect(source).toContain("publish.description");
  });
});
