/**
 * Detects the real file type from the first bytes (magic numbers), independent
 * of what the client claimed in Content-Type or the file name.
 */
export type SniffedType = "pdf" | "png" | "jpg" | "webp" | "gif" | null;

export function sniffFileType(bytes: Uint8Array): SniffedType {
  if (bytes.length < 12) return null;
  const ascii = (start: number, len: number) =>
    String.fromCharCode(...bytes.subarray(start, start + len));
  if (ascii(0, 5) === "%PDF-") return "pdf";
  if (bytes[0] === 0x89 && ascii(1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a) return "png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") return "webp";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "gif";
  return null;
}
