import { describe, expect, it } from "vitest";
// touch2
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "no-subscription-view.tsx"), "utf-8");

describe("no-subscription-view.tsx (R52)", () => {
  it("uses the bills.noSubscription.* keys", () => {
    expect(source).toMatch(/bills\.noSubscription\.title/);
    expect(source).toMatch(/bills\.noSubscription\.description/);
    expect(source).toMatch(/bills\.noSubscription\.action/);
  });
});
