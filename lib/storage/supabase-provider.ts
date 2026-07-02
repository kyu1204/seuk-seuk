import { createServiceSupabase } from "@/lib/supabase/server";
import type {
  StorageProvider,
  StorageBucket,
  SignedDownloadOptions,
  SignedUploadResult,
  StorageDownload,
} from "./types";

/**
 * Supabase Storage implementation (service role — access control is enforced
 * by the calling server action, not by storage RLS).
 */
export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase" as const;

  private client() {
    return createServiceSupabase().storage;
  }

  async upload(
    bucket: StorageBucket,
    key: string,
    body: Blob | ArrayBuffer | Uint8Array | Buffer,
    opts?: { contentType?: string; upsert?: boolean }
  ): Promise<{ error?: string }> {
    const { error } = await this.client()
      .from(bucket)
      .upload(key, body as Blob, {
        contentType: opts?.contentType,
        upsert: opts?.upsert ?? false,
      });
    return error ? { error: error.message } : {};
  }

  async download(bucket: StorageBucket, key: string): Promise<StorageDownload> {
    const { data, error } = await this.client().from(bucket).download(key);
    if (error || !data) {
      return { data: null, error: error?.message ?? "Download failed" };
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    return { data: bytes, contentType: data.type || undefined };
  }

  async createSignedDownloadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: SignedDownloadOptions
  ): Promise<{ url: string | null; error?: string }> {
    const { data, error } = await this.client()
      .from(bucket)
      .createSignedUrl(
        key,
        opts?.expiresIn ?? 300,
        opts?.downloadName ? { download: opts.downloadName } : undefined
      );
    if (error || !data) {
      return { url: null, error: error?.message ?? "Failed to sign URL" };
    }
    return { url: data.signedUrl };
  }

  async createSignedUploadUrl(
    bucket: StorageBucket,
    key: string
  ): Promise<{ result: SignedUploadResult | null; error?: string }> {
    const { data, error } = await this.client()
      .from(bucket)
      .createSignedUploadUrl(key);
    if (error || !data) {
      return { result: null, error: error?.message ?? "Failed to sign upload" };
    }
    return {
      result: {
        url: data.signedUrl,
        key,
        provider: "supabase",
        token: data.token,
      },
    };
  }

  async remove(bucket: StorageBucket, keys: string[]): Promise<{ error?: string }> {
    if (keys.length === 0) return {};
    const { error } = await this.client().from(bucket).remove(keys);
    return error ? { error: error.message } : {};
  }

  async copy(
    bucket: StorageBucket,
    srcKey: string,
    destKey: string
  ): Promise<{ error?: string }> {
    const { error } = await this.client().from(bucket).copy(srcKey, destKey);
    return error ? { error: error.message } : {};
  }

  async list(
    bucket: StorageBucket,
    prefix: string
  ): Promise<{ keys: string[]; error?: string }> {
    // Split prefix into folder + name-search to match Supabase's list API.
    const slash = prefix.lastIndexOf("/");
    const folder = slash >= 0 ? prefix.slice(0, slash) : "";
    const search = slash >= 0 ? prefix.slice(slash + 1) : prefix;

    // Supabase list() defaults to 100 items; page explicitly for full enumeration.
    const client = this.client().from(bucket);
    const pageSize = 1000;
    const keys: string[] = [];
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await client.list(folder, {
        limit: pageSize,
        offset,
        ...(search ? { search } : {}),
      });
      if (error) return { keys: [], error: error.message };
      if (!data || data.length === 0) break;
      for (const f of data) keys.push(folder ? `${folder}/${f.name}` : f.name);
      if (data.length < pageSize) break;
    }
    return { keys };
  }
}
