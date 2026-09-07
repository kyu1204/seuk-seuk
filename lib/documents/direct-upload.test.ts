import { describe, expect, it } from "vitest";
import { checkUploadFile, DIRECT_UPLOAD_MAX_BYTES } from "./direct-upload";

describe("checkUploadFile", () => {
  it("accepts a 7MB PDF (over the old 4.5MB Vercel body limit)", () => {
    expect(checkUploadFile({ size: 7_379_066, type: "application/pdf" })).toEqual({ ok: true });
  });
  it("rejects files over the direct-upload cap", () => {
    expect(checkUploadFile({ size: DIRECT_UPLOAD_MAX_BYTES + 1, type: "application/pdf" })).toEqual({
      ok: false,
      reason: "too_large",
    });
  });
  it("rejects unsupported types and empty files", () => {
    expect(checkUploadFile({ size: 10, type: "text/plain" })).toEqual({ ok: false, reason: "unsupported" });
    expect(checkUploadFile({ size: 0, type: "image/png" })).toEqual({ ok: false, reason: "empty" });
  });
});
