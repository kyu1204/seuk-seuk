import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publication-detail-content.tsx", import.meta.url), "utf-8");

describe("publication-detail-content.tsx source", () => {
  it("has no alert() calls", () => {
    expect(source).not.toContain("alert(");
  });

  it("imports toast from sonner", () => {
    expect(source).toContain('from "sonner"');
  });

  it("uses the update error translation key", () => {
    expect(source).toContain("publicationDetail.updateError");
  });

  it("uses toast.error for update failures", () => {
    expect(source).toContain("toast.error");
  });
});
