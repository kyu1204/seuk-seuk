import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./signature-modal.tsx", import.meta.url), "utf-8");

describe("signature-modal.tsx source", () => {
  it("scales the canvas for devicePixelRatio", () => {
    expect(source).toContain("devicePixelRatio");
  });

  it("smooths strokes with quadraticCurveTo", () => {
    expect(source).toContain("quadraticCurveTo");
  });

  it("has an undo action", () => {
    expect(source).toContain("signature.undo");
  });

  it("does not manage the last pointer position with useState", () => {
    expect(source).not.toMatch(/lastX.*useState/);
  });

  it("uses pointer events instead of mouse/touch handlers", () => {
    expect(source).not.toMatch(/onMouseMove|onTouchMove/);
    expect(source).toContain("onPointerDown");
    expect(source).toContain("onPointerMove");
    expect(source).toContain("onPointerUp");
  });

  it("confirms discard via AlertDialog copy", () => {
    expect(source).toContain("signature.discardTitle");
    expect(source).toContain("signature.discardConfirm");
  });

  it("shows a placeholder when empty", () => {
    expect(source).toContain("signature.placeholder");
  });

  it("tracks stroke count in state for undo disabling", () => {
    expect(source).toContain("setStrokeCount");
  });

  it("disables undo when there are no strokes", () => {
    expect(source).toMatch(/undo\}[\s\S]*disabled=\{isSubmitting \|\| strokeCount === 0\}/);
  });
});
