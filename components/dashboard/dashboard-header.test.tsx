import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./dashboard-header.tsx", import.meta.url), "utf-8");

describe("dashboard-header.tsx source", () => {
  it("uses dashboard.header.description", () => {
    expect(source).toContain("dashboard.header.description");
  });

  it("uses dashboard.upload.document", () => {
    expect(source).toContain("dashboard.upload.document");
  });

  it("uses dashboard.publish", () => {
    expect(source).toContain("dashboard.publish");
  });

  it("has a single upload button linking to /upload", () => {
    expect(source).toContain('href="/upload"');
  });

  it("does not use the old title size classes", () => {
    expect(source).not.toContain("text-2xl sm:text-3xl");
  });
});
