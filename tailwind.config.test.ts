import { describe, expect, it } from "vitest";
import config from "./tailwind.config";

describe("tailwind.config colors", () => {
  it("defines seal and amber tokens", () => {
    const colors = (config.theme as any).extend.colors;
    expect(colors.seal.DEFAULT).toBe("hsl(var(--seal))");
    expect(colors.seal.soft).toBe("hsl(var(--seal-soft))");
    expect(colors.amber.DEFAULT).toBe("hsl(var(--amber))");
    expect(colors.amber.soft).toBe("hsl(var(--amber-soft))");
  });
});
