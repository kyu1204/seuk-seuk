import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("app/(home)/components/HomePage.tsx", "utf8");
const css = readFileSync("app/globals.css", "utf8");

describe("home hero motion", () => {
  it("uses staggered entrance classes and the kinetic title", () => {
    expect(src).toContain("KineticTitle");
    expect(src).toContain('className="home-rise');
    expect(src).toContain("home-view");
  });
  it("keeps every motion class gated behind prefers-reduced-motion", () => {
    const gated = css.split("@media (prefers-reduced-motion: no-preference)")[1] ?? "";
    for (const cls of [".home-rise", ".home-word", ".home-pop", ".home-glow", ".home-hint", ".home-view"]) {
      expect(gated).toContain(cls);
    }
  });
  it("does not reintroduce removed clichés or hardcoded colors", () => {
    expect(src).not.toMatch(/emerald-|text-white|gradient-text|card-angled/);
  });
});
