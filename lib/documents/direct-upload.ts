/**
 * Browser-side direct upload to a presigned storage URL.
 * Files never pass through a server action, so the Vercel 4.5MB request body
 * limit does not apply. Progress is reported via XMLHttpRequest upload events.
 */

export const DIRECT_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

export type UploadFileCheck = { ok: true } | { ok: false; reason: "too_large" | "unsupported" | "empty" };

const SUPPORTED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/** Pure pre-flight check so the user gets a clear message before any network call. */
export const TEMPLATE_SUPPORTED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function checkUploadFile(
  file: { size: number; type: string },
  maxBytes: number = DIRECT_UPLOAD_MAX_BYTES,
  allowed: Set<string> = SUPPORTED_MIME
): UploadFileCheck {
  if (!file || file.size <= 0) return { ok: false, reason: "empty" };
  if (!allowed.has(file.type)) return { ok: false, reason: "unsupported" };
  if (file.size > maxBytes) return { ok: false, reason: "too_large" };
  return { ok: true };
}

export function uploadToSignedUrl(
  url: string,
  file: Blob,
  opts: { contentType: string; onProgress?: (percent: number) => void; signal?: AbortSignal }
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new Error("Upload aborted"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", opts.contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed with status ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.onabort = () => reject(new Error("Upload aborted"));
    if (opts.signal) {
      opts.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(file);
  });
}
