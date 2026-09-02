import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(__dirname, "breadcrumb.tsx"), "utf-8");

describe("breadcrumb.tsx", () => {
  it("has no t() fallback with a hardcoded default", () => {
    expect(source).not.toMatch(/t\("[a-zA-Z.]+",\s*"/);
  });
});
