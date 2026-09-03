import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./publication-actions.ts", import.meta.url), "utf-8");

describe("publication-actions.ts source", () => {
  // R41: gate/list summary fields
  it("uses deriveSenderName from the shared helper", () => {
    expect(source).toContain('import { deriveSenderName } from "@/lib/publications/sender-name"');
    expect(source).toContain("deriveSenderName(");
  });

  it("looks up the publication owner via admin.getUserById", () => {
    expect(source).toMatch(/auth\.admin\.getUserById\(\s*publication\.user_id\s*\)/);
  });

  it("returns senderName alongside the publication", () => {
    expect(source).toMatch(/senderName/);
  });

  it("returns gate summary fields (name, documentCount, expiresAt) with requiresPassword", () => {
    expect(source).toContain("documentCount");
    expect(source).toContain("expiresAt");
  });

  it("falls back to empty senderName if the owner lookup fails", () => {
    expect(source).toContain('senderName = ""');
  });
});
