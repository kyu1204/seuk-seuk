import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignDocumentList.tsx", import.meta.url), "utf-8");

describe("SignDocumentList.tsx source", () => {
  it("uses the shared SignHeader instead of a copy-pasted header", () => {
    expect(source).toContain("SignHeader");
  });

  it("shows the sentBy line on the gate/list screens", () => {
    expect(source).toContain("sign.gate.sentBy");
    expect(source).toContain("sign.gate.sentByUnknown");
  });

  it("shows the gate summary line", () => {
    expect(source).toContain("sign.gate.summary");
    expect(source).toContain("sign.gate.summaryNoExpiry");
  });

  it("uses the max-w-md gate layout", () => {
    expect(source).toContain("max-w-md mx-auto px-5 py-8 flex flex-col gap-6");
  });

  it("uses the updated password copy keys", () => {
    expect(source).toContain("sign.password.title");
    expect(source).toContain("sign.password.description");
    expect(source).toContain("sign.password.verify");
    expect(source).toContain("sign.password.help");
    expect(source).not.toContain("sign.password.instruction");
  });

  it("shows password errors with destructive tokens", () => {
    expect(source).toContain("text-destructive text-sm");
  });

  it("has a password visibility toggle with the shared aria label", () => {
    expect(source).toContain("login.togglePassword");
    expect(source).toContain('autoComplete="current-password"');
  });

  it("uses simple row cards for the document list instead of DocumentTile", () => {
    expect(source).not.toContain("DocumentTile");
    expect(source).toContain("rounded-xl border bg-card p-4 flex items-center gap-4");
  });

  it("uses StatusBadge and the pending copy key for row status", () => {
    expect(source).toContain("StatusBadge");
    expect(source).toContain("sign.documentList.pending");
  });

  it("uses sign.documentList.sign / .view for row actions, not a full-card onClick", () => {
    expect(source).toContain("sign.documentList.sign");
    expect(source).toContain("sign.documentList.view");
    expect(source).not.toMatch(/<Card[^>]*onClick/);
  });

  it("uses the documentList description with a count param", () => {
    expect(source).toContain("sign.documentList.description");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });

  it("uses seal/amber tokens for completed/expired states", () => {
    expect(source).toContain("text-seal");
    expect(source).toContain("text-amber");
  });
});
