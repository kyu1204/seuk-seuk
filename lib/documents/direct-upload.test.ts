import { describe, expect, it } from "vitest";
import { checkUploadFile, DIRECT_UPLOAD_MAX_BYTES, uploadToSignedUrl } from "./direct-upload";

describe("uploadToSignedUrl", () => {
  it("does not start a PUT when the signal is already aborted", async () => {
    const opened: string[] = [];
    class FakeXhr {
      upload = {};
      open(m: string) { opened.push(m); }
      setRequestHeader() {}
      send() { opened.push("send"); }
      abort() {}
    }
    (globalThis as any).XMLHttpRequest = FakeXhr;
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadToSignedUrl("https://example.invalid/put", new Blob(["x"]), {
        contentType: "text/plain",
        signal: controller.signal,
      })
    ).rejects.toThrow("Upload aborted");
    expect(opened).toEqual([]);
  });
});

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
