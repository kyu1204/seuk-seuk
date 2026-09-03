import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./UploadPage.tsx", import.meta.url), "utf-8");

describe("UploadPage.tsx source", () => {
  it("uses upload.page.title copy key", () => {
    expect(source).toContain("upload.page.title");
  });
  it("has no oversized page title class", () => {
    expect(source).not.toContain("text-3xl");
  });
});
