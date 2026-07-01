import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectsCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  StorageBucket,
  SignedDownloadOptions,
  SignedUploadResult,
  StorageDownload,
} from "./types";

/**
 * Cloudflare R2 implementation via the S3-compatible API.
 * Access control is enforced by the calling server action; all objects are
 * private and only reachable through short-lived presigned URLs.
 */
export class R2StorageProvider implements StorageProvider {
  readonly name = "r2" as const;
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  private physicalBucket(bucket: StorageBucket): string {
    return bucket === "documents"
      ? process.env.R2_BUCKET_DOCUMENTS || "documents"
      : process.env.R2_BUCKET_SIGNED || "signed-documents";
  }

  private static contentDisposition(name: string): string {
    // RFC 5987 encoding so non-ASCII (Korean) filenames survive.
    return `attachment; filename*=UTF-8''${encodeURIComponent(name)}`;
  }

  private static async toBytes(
    body: Blob | ArrayBuffer | Uint8Array | Buffer
  ): Promise<Uint8Array> {
    // Buffer is a Uint8Array subclass, so this catches it too.
    if (body instanceof Uint8Array) return body;
    if (body instanceof ArrayBuffer) return new Uint8Array(body);
    return new Uint8Array(await body.arrayBuffer());
  }

  async upload(
    bucket: StorageBucket,
    key: string,
    body: Blob | ArrayBuffer | Uint8Array | Buffer,
    opts?: { contentType?: string }
  ): Promise<{ error?: string }> {
    try {
      const bytes = await R2StorageProvider.toBytes(body);
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.physicalBucket(bucket),
          Key: key,
          Body: bytes,
          ContentType: opts?.contentType,
        })
      );
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Upload failed" };
    }
  }

  async download(bucket: StorageBucket, key: string): Promise<StorageDownload> {
    try {
      const res = await this.s3.send(
        new GetObjectCommand({ Bucket: this.physicalBucket(bucket), Key: key })
      );
      const bytes = await res.Body!.transformToByteArray();
      return { data: bytes, contentType: res.ContentType };
    } catch (e) {
      return { data: null, error: e instanceof Error ? e.message : "Download failed" };
    }
  }

  async createSignedDownloadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: SignedDownloadOptions
  ): Promise<{ url: string | null; error?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.physicalBucket(bucket),
        Key: key,
        ResponseContentDisposition: opts?.downloadName
          ? R2StorageProvider.contentDisposition(opts.downloadName)
          : undefined,
      });
      const url = await getSignedUrl(this.s3, command, {
        expiresIn: opts?.expiresIn ?? 300,
      });
      return { url };
    } catch (e) {
      return { url: null, error: e instanceof Error ? e.message : "Failed to sign URL" };
    }
  }

  async createSignedUploadUrl(
    bucket: StorageBucket,
    key: string,
    opts?: { expiresIn?: number }
  ): Promise<{ result: SignedUploadResult | null; error?: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.physicalBucket(bucket),
        Key: key,
      });
      const url = await getSignedUrl(this.s3, command, {
        expiresIn: opts?.expiresIn ?? 300,
      });
      return { result: { url, key, provider: "r2" } };
    } catch (e) {
      return { result: null, error: e instanceof Error ? e.message : "Failed to sign upload" };
    }
  }

  async remove(bucket: StorageBucket, keys: string[]): Promise<{ error?: string }> {
    if (keys.length === 0) return {};
    try {
      await this.s3.send(
        new DeleteObjectsCommand({
          Bucket: this.physicalBucket(bucket),
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Delete failed" };
    }
  }

  async copy(
    bucket: StorageBucket,
    srcKey: string,
    destKey: string
  ): Promise<{ error?: string }> {
    try {
      const b = this.physicalBucket(bucket);
      await this.s3.send(
        new CopyObjectCommand({
          Bucket: b,
          CopySource: `${b}/${encodeURIComponent(srcKey)}`,
          Key: destKey,
        })
      );
      return {};
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Copy failed" };
    }
  }

  async list(
    bucket: StorageBucket,
    prefix: string
  ): Promise<{ keys: string[]; error?: string }> {
    try {
      const res = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.physicalBucket(bucket),
          Prefix: prefix,
        })
      );
      const keys = (res.Contents ?? []).map((o) => o.Key!).filter(Boolean);
      return { keys };
    } catch (e) {
      return { keys: [], error: e instanceof Error ? e.message : "List failed" };
    }
  }
}
