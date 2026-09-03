import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf-8");

describe("sign/[id]/page.tsx source", () => {
  it("passes senderName down to SignPageContainer", () => {
    expect(source).toContain("senderName={senderName || \"\"}");
  });

  it("uses the sign.meta.andMore locale key instead of hardcoded Korean text", () => {
    expect(source).toContain("sign.meta.andMore");
    expect(source).not.toContain("외 ${documents.length - 1}건");
  });

  it("looks up the andMore copy from the imported locale object (server component)", () => {
    expect(source).toMatch(/import ko from ["']@\/locales\/ko["']/);
    expect(source).toMatch(/import en from ["']@\/locales\/en["']/);
  });

  it("passes requiresPassword through to SignPageContainer still", () => {
    expect(source).toContain("requiresPassword={requiresPassword");
  });

  it("destructures senderName from getPublicationByShortUrl", () => {
    expect(source).toContain("senderName");
  });
  // touch2
});
