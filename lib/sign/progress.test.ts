import { describe, expect, it } from "vitest";
import { remainingByPage, nextUnsignedArea } from "./progress";

describe("remainingByPage", () => {
  it("counts only unsigned areas per page", () => {
    expect(
      remainingByPage([
        { page: 1, signed: false },
        { page: 1, signed: true },
        { page: 2, signed: false },
        { page: 2, signed: false },
      ])
    ).toEqual({ 1: 1, 2: 2 });
  });

  it("omits fully signed pages", () => {
    expect(remainingByPage([{ page: 1, signed: true }])).toEqual({});
  });
});

describe("nextUnsignedArea", () => {
  const areas = [
    { id: "a", page: 1, signed: true },
    { id: "b", page: 1, signed: false },
    { id: "c", page: 2, signed: false },
  ];

  it("prefers an unsigned area on the current page", () => {
    expect(nextUnsignedArea(areas, 1)).toEqual({ id: "b", page: 1 });
  });

  it("falls back to the next page in order when current page has none", () => {
    expect(nextUnsignedArea(areas, 2)).toEqual({ id: "c", page: 2 });
  });

  it("returns null when nothing is left unsigned", () => {
    expect(
      nextUnsignedArea(
        [
          { id: "a", page: 1, signed: true },
          { id: "b", page: 2, signed: true },
        ],
        1
      )
    ).toBeNull();
  });
});
