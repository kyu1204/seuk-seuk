import { R2StorageProvider } from "./r2-provider";
import { SupabaseStorageProvider } from "./supabase-provider";
import type {
  StorageProvider,
  StorageBucket,
  SignedDownloadOptions,
  SignedUploadResult,
  StorageDownload,
} from "./types";

/**
 * Zero-downtime migration provider (strangler pattern).
 * - writes: R2 (primary, required) + Supabase (mirror, best-effort)
 * - reads:  R2 first, fall back to Supabase when the object isn't in R2 yet
 * - presigned upload: R2 only (the signed PNG is transient; server rebuilds it)
 *
 * Used during Phase 1 so both stores stay populated and historical data keeps
 * serving from Supabase until the backfill completes.
 */
export class DualStorageProvider implements StorageProvider {
  readonly name = "dual" as const;
  private readonly r2 = new R2StorageProvider();
  private readonly sb = new SupabaseStorageProvider();

  async upload(
    bucket: StorageBucket,
    key: string,
    body: Blob | ArrayBuffer | Uint8Array | Buffer,
    opts?: { contentType?: string; upsert?: boolean }
  ): Promise<{ error?: string }> {
    const primary = await this.r2.upload(bucket, key, body, opts);
    if (primary.error) return primary; // R2 is the source of truth
    // Mirror to Supabase (upsert) so rollback stays possible; non-fatal.
    const mirror = await this.sb.upload(bucket, key, body, {
      ...opts,
      upsert: true,
    });
    if (mirror.error) {
      console.warn(`[dual] Supabase mirror upload failed for ${bucket}/${key}:`, mirror.error);
    }
    return {};
  }

  async download(bucket: StorageBucket, key: string): Promise<StorageDownload> {
    const primary = await this.r2.download(bucket, key);
    if (primary.data) return primary;
    return this.sb.download(bucket, key);
  }

  async createSignedDownloadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: SignedDownloadOptions
  ): Promise<{ url: string | null; error?: string }> {
    if (await this.r2.exists(bucket, key)) {
      return this.r2.createSignedDownloadUrl(bucket, key, opts);
    }
    return this.sb.createSignedDownloadUrl(bucket, key, opts);
  }

  async createSignedUploadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: { expiresIn?: number }
  ): Promise<{ result: SignedUploadResult | null; error?: string }> {
    // Transient intermediate upload — R2 only.
    return this.r2.createSignedUploadUrl(bucket, key, opts);
  }

  async remove(bucket: StorageBucket, keys: string[]): Promise<{ error?: string }> {
    const [r2Res, sbRes] = await Promise.all([
      this.r2.remove(bucket, keys),
      this.sb.remove(bucket, keys),
    ]);
    return r2Res.error ? r2Res : sbRes;
  }

  async copy(
    bucket: StorageBucket,
    srcKey: string,
    destKey: string
  ): Promise<{ error?: string }> {
    // Source may live in either store; download (with fallback) then dual-write.
    const src = await this.download(bucket, srcKey);
    if (!src.data) return { error: "Copy source not found" };
    return this.upload(bucket, destKey, src.data, { contentType: src.contentType });
  }

  async list(
    bucket: StorageBucket,
    prefix: string
  ): Promise<{ keys: string[]; error?: string }> {
    const [r2Res, sbRes] = await Promise.all([
      this.r2.list(bucket, prefix),
      this.sb.list(bucket, prefix),
    ]);
    const keys = new Set([...(r2Res.keys ?? []), ...(sbRes.keys ?? [])]);
    return { keys: [...keys] };
  }
}
