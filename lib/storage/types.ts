// Storage abstraction — provider-agnostic interface.
// Logical bucket names are stable across providers; each provider maps them
// to its own physical bucket.

export type StorageBucket = "documents" | "signed-documents";

export interface SignedDownloadOptions {
  /** URL validity in seconds (default 300). */
  expiresIn?: number;
  /** If set, forces a download with this filename (Content-Disposition). */
  downloadName?: string;
}

export interface SignedUploadResult {
  /** URL the client uploads to. */
  url: string;
  /** Storage key the file will land at. */
  key: string;
  /** Provider discriminator so the client uploads with the right method. */
  provider: "supabase" | "r2";
  /** Supabase signed-upload token (Supabase provider only). */
  token?: string;
}

export interface StorageDownload {
  data: Uint8Array | null;
  contentType?: string;
  error?: string;
}

export interface StorageProvider {
  readonly name: "supabase" | "r2" | "dual";

  upload(
    bucket: StorageBucket,
    key: string,
    body: Blob | ArrayBuffer | Uint8Array | Buffer,
    opts?: { contentType?: string; upsert?: boolean }
  ): Promise<{ error?: string }>;

  download(bucket: StorageBucket, key: string): Promise<StorageDownload>;

  createSignedDownloadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: SignedDownloadOptions
  ): Promise<{ url: string | null; error?: string }>;

  createSignedUploadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: { expiresIn?: number }
  ): Promise<{ result: SignedUploadResult | null; error?: string }>;

  remove(bucket: StorageBucket, keys: string[]): Promise<{ error?: string }>;

  copy(
    bucket: StorageBucket,
    srcKey: string,
    destKey: string
  ): Promise<{ error?: string }>;

  /** List object keys under a prefix (used for cleanup). */
  list(bucket: StorageBucket, prefix: string): Promise<{ keys: string[]; error?: string }>;
}
