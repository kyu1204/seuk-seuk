import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "no-documents-view.tsx"), "utf-8");

describe("no-documents-view.tsx (R52)", () => {
  it("uses the bills.noDocuments.* keys", () => {
    expect(source).toMatch(/bills\.noDocuments\.title/);
    expect(source).toMatch(/bills\.noDocuments\.description/);
    expect(source).toMatch(/bills\.noDocuments\.action/);
  });
});
