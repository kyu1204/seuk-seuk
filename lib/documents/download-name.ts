const FILE_EXTENSION_PATTERN = /\.[^/.]+$/;
const UNSAFE_FILENAME_CHARS = /[\\/:*?"<>|\r\n]+/g;

export function getDocumentDownloadBaseName(
  alias?: string | null,
  filename?: string | null
): string {
  const preferredName = alias?.trim() || filename?.trim() || "document";
  const withoutExtension =
    preferredName.replace(FILE_EXTENSION_PATTERN, "").trim() ||
    preferredName.trim();
  const safeName = withoutExtension
    .replace(UNSAFE_FILENAME_CHARS, "_")
    .replace(/\s+/g, " ")
    .trim();

  return safeName || "document";
}

export function getDocumentDownloadName(
  extension: "pdf" | "png",
  alias?: string | null,
  filename?: string | null
): string {
  return `${getDocumentDownloadBaseName(alias, filename)}.${extension}`;
}
