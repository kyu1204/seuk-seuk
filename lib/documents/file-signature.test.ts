import { describe, expect, it } from "vitest";
import { sniffFileType } from "./file-signature";

const bytes = (...parts: (string | number[])[]) =>
  new Uint8Array(
    parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)).concat(new Array(16).fill(0))
  );

describe("sniffFileType", () => {
  it("recognises pdf, png, jpg, webp and gif signatures", () => {
    expect(sniffFileType(bytes("%PDF-1.7"))).toBe("pdf");
    expect(sniffFileType(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]))).toBe("png");
    expect(sniffFileType(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("jpg");
    expect(sniffFileType(bytes("RIFF", [0, 0, 0, 0], "WEBPVP8 "))).toBe("webp");
    expect(sniffFileType(bytes("GIF89a"))).toBe("gif");
  });
  it("returns null for anything else (e.g. an HTML file renamed to .png)", () => {
    expect(sniffFileType(bytes("<html><body>"))).toBeNull();
    expect(sniffFileType(new Uint8Array(3))).toBeNull();
  });
});
