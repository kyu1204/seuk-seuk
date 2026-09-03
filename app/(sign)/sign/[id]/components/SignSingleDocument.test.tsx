import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./SignSingleDocument.tsx", import.meta.url), "utf-8");

describe("SignSingleDocument.tsx source", () => {
  it("drops unused CheckCircle/Clock icon imports now owned by SignComplete/SignDocumentList", () => {
    expect(source).not.toContain("CheckCircle");
    expect(source).not.toContain("Clock,");
  });

  it("delegates completed/expired states to the container instead of rendering its own cards", () => {
    expect(source).not.toContain("sign.completed.title");
    expect(source).not.toContain("sign.expired.title");
    expect(source).not.toContain("<Card>");
  });

  it("hands off to the container's onComplete/onBack instead of rendering its own completed/expired card", () => {
    expect(source).toMatch(/isPublicationCompleted \|\| isDocumentCompleted/);
    expect(source).toContain("onComplete(documentLabel, documentData.id)");
    expect(source).toContain("onBack()");
  });

  it("uses destructive tokens for the inline error box", () => {
    expect(source).toContain("bg-destructive/10");
  });

  it("uses the seal-soft background for signed area highlights", () => {
    expect(source).toContain("bg-seal-soft");
  });

  it("has no hardcoded gray/green/red/white color classes", () => {
    expect(source).not.toMatch(/text-gray-|bg-green-50|bg-red-50|bg-white/);
  });

  it("has no pulsing animation on unsigned areas", () => {
    expect(source).not.toMatch(/animate-pulse/);
  });

  it("has no unresolved 'failed to' internal debug strings 2", () => {
    expect(source).not.toMatch(/Failed to /);
  });

  it("has two sticky bars (top header and bottom submit)", () => {
    expect(source.match(/sticky/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("sets touchAction conditionally on zoom level", () => {
    expect(source).toMatch(/touchAction:\s*zoom(Level)?\s*>\s*1\s*\?\s*["']none["']\s*:\s*["']pan-y["']/);
  });

  it("confirms submission with an AlertDialog", () => {
    expect(source).toContain("sign.submit.confirmTitle");
  });

  it("uses the shared progress helpers", () => {
    expect(source).toContain("remainingByPage");
    expect(source).toContain("nextUnsignedArea");
  });

  it("has no hardcoded korean text outside t() calls", () => {
    expect(source).not.toMatch(/`[^`]*남음/);
  });

  it("uses zoom locale keys 2", () => {
    expect(source).toContain("sign.zoomIn");
    expect(source).toContain("sign.zoomOut");
    expect(source).toContain("sign.zoomReset");
  });

  it("has no inline t() fallback literals", () => {
    expect(source).not.toMatch(/t\("sign\.zoom(In|Out|Reset)",\s*"/);
  });

  it("gives each signature area an accessible role/label", () => {
    expect(source).toContain('role="button"');
    expect(source).toContain("sign.area.label");
  });
});
