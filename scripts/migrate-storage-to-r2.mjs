/**
 * One-off migration: copy DB-referenced files from Supabase Storage to R2.
 * Idempotent (skips objects already present in R2). Copy only — DB
 * normalization of signed_* URL columns is done separately via SQL.
 *
 * Usage:
 *   node scripts/migrate-storage-to-r2.mjs           # migrate
 *   DRY_RUN=1 node scripts/migrate-storage-to-r2.mjs # report only
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  S3Client,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const DRY = !!process.env.DRY_RUN;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const s3 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});
const R2_BUCKET = {
  documents: env.R2_BUCKET_DOCUMENTS || "documents",
  "signed-documents": env.R2_BUCKET_SIGNED || "signed-documents",
};

function extractSignedKey(value) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parts = new URL(value).pathname.split("/");
      const i = parts.indexOf("signed-documents");
      return i === -1 ? null : parts.slice(i + 1).join("/");
    } catch {
      return null;
    }
  }
  return value.startsWith("signed-documents/")
    ? value.slice("signed-documents/".length)
    : value;
}

async function collectKeys() {
  const keys = { documents: new Set(), "signed-documents": new Set() };
  const page = 1000;

  // documents.file_url + signed_* (paginated)
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("documents")
      .select("file_url, signed_file_url, signed_pdf_url")
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data.length) break;
    for (const d of data) {
      if (d.file_url) keys.documents.add(d.file_url);
      for (const s of [d.signed_pdf_url, d.signed_file_url]) {
        const k = extractSignedKey(s);
        if (k) keys["signed-documents"].add(k);
      }
    }
    if (data.length < page) break;
  }

  // document_templates.file_url
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("document_templates")
      .select("file_url")
      .range(from, from + page - 1);
    if (error) throw error;
    if (!data.length) break;
    for (const t of data) if (t.file_url) keys.documents.add(t.file_url);
    if (data.length < page) break;
  }

  return keys;
}

async function existsInR2(bucket, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET[bucket], Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function migrateBucket(bucket, keys) {
  let copied = 0, skipped = 0, missing = 0, failed = 0, bytes = 0;
  for (const key of keys) {
    if (await existsInR2(bucket, key)) { skipped++; continue; }
    if (DRY) { copied++; continue; } // report as "to copy" without downloading
    const { data, error } = await supabase.storage.from(bucket).download(key);
    if (error || !data) { missing++; console.warn(`  ⚠️ source missing: ${bucket}/${key}`); continue; }
    const buf = new Uint8Array(await data.arrayBuffer());
    if (DRY) { copied++; bytes += buf.length; continue; }
    try {
      await s3.send(new PutObjectCommand({
        Bucket: R2_BUCKET[bucket],
        Key: key,
        Body: buf,
        ContentType: data.type || undefined,
      }));
      copied++; bytes += buf.length;
    } catch (e) {
      failed++; console.error(`  ❌ upload failed ${bucket}/${key}: ${e.message}`);
    }
  }
  return { total: keys.size, copied, skipped, missing, failed, mb: (bytes / 1048576).toFixed(1) };
}

(async () => {
  console.log(DRY ? "=== DRY RUN (복사 없음) ===" : "=== MIGRATION ===");
  const keys = await collectKeys();
  for (const bucket of ["documents", "signed-documents"]) {
    console.log(`\n[${bucket}] ${keys[bucket].size} keys`);
    const r = await migrateBucket(bucket, keys[bucket]);
    console.log(`  copied=${r.copied} skipped=${r.skipped} missing=${r.missing} failed=${r.failed} (${r.mb}MB)`);
  }
  console.log("\n=== 종료 ===");
})();
