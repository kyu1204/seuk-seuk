import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./dashboard-skeleton.tsx", import.meta.url), "utf-8");

describe("dashboard-skeleton.tsx source", () => {
  it("reuses DocumentCardsSkeletonGrid instead of a hand-rolled grid", () => {
    expect(source).toContain("DocumentCardsSkeletonGrid");
  });
});
