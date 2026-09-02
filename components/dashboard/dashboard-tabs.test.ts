import { describe, expect, it } from "vitest";
import { resolveTab } from "./dashboard-tabs";

describe("resolveTab", () => {
  it("returns documents for null", () => {
    expect(resolveTab(null)).toBe("documents");
  });

  it("returns documents for unknown values", () => {
    expect(resolveTab("bogus")).toBe("documents");
  });

  it("returns publications when given publications", () => {
    expect(resolveTab("publications")).toBe("publications");
  });

  it("returns templates when given templates", () => {
    expect(resolveTab("templates")).toBe("templates");
  });
});
