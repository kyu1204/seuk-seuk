import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const source = fs.readFileSync(
  path.join(__dirname, "page.tsx"),
  "utf-8"
);

describe("app/error/page.tsx", () => {
  it("is a client component", () => {
    expect(source).toMatch(/^"use client";/);
  });

  it("uses locale keys instead of hardcoded Korean copy", () => {
    expect(source).toMatch(/t\("error\.title"\)/);
    expect(source).toMatch(/t\("error\.description"\)/);
    expect(source).toMatch(/t\("error\.retryReset"\)/);
    expect(source).toMatch(/t\("error\.home"\)/);
    expect(source).not.toMatch(/오류가 발생했습니다/);
    expect(source).not.toMatch(/인증 링크가 유효하지 않거나/);
  });

  it("only shows the reset button when type=auth", () => {
    expect(source).toMatch(/searchParams[\s\S]*type[\s\S]*===[\s\S]*"auth"/);
  });

  it("always shows a home link", () => {
    expect(source).toMatch(/href="\/"/);
  });
});
