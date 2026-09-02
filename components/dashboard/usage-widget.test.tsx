import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./usage-widget.tsx", import.meta.url), "utf-8");

describe("usage-widget.tsx source", () => {
  it("uses usage.summary.sent", () => {
    expect(source).toContain("usage.summary.sent");
  });

  it("uses usage.summary.active", () => {
    expect(source).toContain("usage.summary.active");
  });

  it("uses usage.managePlan", () => {
    expect(source).toContain("usage.managePlan");
  });

  it("uses usage.limit.reachedHint", () => {
    expect(source).toContain("usage.limit.reachedHint");
  });

  it("does not use collapsible open state", () => {
    expect(source).not.toContain("useState(false)");
  });
});
