import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignComplete.tsx", import.meta.url), "utf-8");

describe("SignComplete.tsx source", () => {
  it("shows the remaining-documents copy key", () => {
    expect(source).toContain("sign.complete.remaining");
  });

  it("uses the seal token for the completion badge", () => {
    expect(source).toContain("bg-seal");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });

  it("shows a signed-at line and continue action", () => {
    expect(source).toContain("sign.complete.signedAt");
    expect(source).toContain("sign.complete.continue");
  });

  it("shows the owner-notified note", () => {
    expect(source).toContain("sign.complete.ownerNotified");
  });

  it("falls back to the back-to-list action", () => {
    expect(source).toContain("sign.documentList.backToList");
  });
});
