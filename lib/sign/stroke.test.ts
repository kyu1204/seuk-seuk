import { describe, expect, it } from "vitest";
import { midpoint, scaleForDpr, pushStroke, popStroke } from "./stroke";

describe("midpoint", () => {
  it("averages two points", () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 10, y: 4 })).toEqual({ x: 5, y: 2 });
  });
});

describe("scaleForDpr", () => {
  it("rounds css size scaled by dpr to integers", () => {
    expect(scaleForDpr(300.4, 220, 2)).toEqual({ width: 601, height: 440 });
  });

  it("handles dpr of 1", () => {
    expect(scaleForDpr(300, 200, 1)).toEqual({ width: 300, height: 200 });
  });
});

describe("pushStroke", () => {
  it("appends a stroke to history without mutating the original array", () => {
    const history: number[][] = [[1]];
    const next = pushStroke(history, [2]);
    expect(next).toEqual([[1], [2]]);
    expect(history).toEqual([[1]]);
  });
});

describe("popStroke", () => {
  it("removes and returns the last stroke", () => {
    const history = [[1], [2], [3]];
    const { history: next, removed } = popStroke(history);
    expect(next).toEqual([[1], [2]]);
    expect(removed).toEqual([3]);
  });

  it("returns null removed and same empty history when nothing to pop", () => {
    const { history: next, removed } = popStroke([]);
    expect(next).toEqual([]);
    expect(removed).toBeNull();
  });
});
