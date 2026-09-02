import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const css = fs.readFileSync(path.join(__dirname, "globals.css"), "utf-8");

describe("globals.css tokens", () => {
  it("defines seal, amber, and ink-navy primary tokens", () => {
    expect(css).toMatch(/--seal:/);
    expect(css).toMatch(/--amber:/);
    expect(css).toMatch(/--primary: 213 52% 25%/);
  });

  it("has no landing-page cliche classes", () => {
    expect(css).not.toMatch(/\.card-angled/);
    expect(css).not.toMatch(/\.gradient-text/);
    expect(css).not.toMatch(/\.bg-dot-pattern/);
    expect(css).not.toMatch(/\.bg-grid-pattern/);
    expect(css).not.toMatch(/\.notification-banner/);
  });
});
