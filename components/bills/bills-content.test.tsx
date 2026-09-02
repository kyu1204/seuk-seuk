import { describe, expect, it } from "vitest";
// R52
import { readFileSync } from "fs";
import { join } from "path";

const source = readFileSync(join(__dirname, "bills-content.tsx"), "utf-8");

describe("bills-content.tsx (R52)", () => {
  it("renders the page header without a card wrapper", () => {
    const headerBlock = source.slice(0, source.indexOf("<Tabs"));
    expect(headerBlock).not.toMatch(/rounded-xl border bg-card/);
  });

  it("places Tabs outside of CardHeader", () => {
    const tabsIndex = source.indexOf("<Tabs");
    const cardHeaderIndex = source.indexOf("<CardHeader");
    expect(tabsIndex).toBeGreaterThan(-1);
    expect(cardHeaderIndex).toBeGreaterThan(-1);
    expect(tabsIndex).toBeLessThan(cardHeaderIndex);
  });

  it("gives Tabs a bottom margin", () => {
    expect(source).toMatch(/<Tabs[^>]*mb-6/);
  });
});
