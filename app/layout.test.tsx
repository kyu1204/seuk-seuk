import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const src = fs.readFileSync(path.join(__dirname, "layout.tsx"), "utf-8");

describe("app/layout.tsx theme provider", () => {
  it("uses system theme by default", () => {
    expect(src).not.toMatch(/enableSystem=\{false\}/);
    expect(src).toMatch(/defaultTheme="system"/);
  });
});
