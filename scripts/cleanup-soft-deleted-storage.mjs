// 소프트 삭제된(is_deleted=true) 문서의 스토리지 파일을 정리하는 일회성 스크립트.
//
// 사용법:
//   node scripts/cleanup-soft-deleted-storage.mjs            # dry-run (미리보기만)
//   node scripts/cleanup-soft-deleted-storage.mjs --execute  # 실제 삭제
//
// - documents 버킷: file_url 경로
// - signed-documents 버킷: signed_{id}.pdf + 중간 산출물 signed_{id}.png (URL에서 추출한 경로 포함)
// DB row(소프트 삭제 tombstone)는 건드리지 않고 스토리지 파일만 제거한다.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const EXECUTE = process.argv.includes("--execute");

// .env.local 수동 파싱 (dotenv 의존성 없이)
function loadEnv() {
  const env = {};
  try {
    const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch (e) {
    console.error("⚠️  .env.local 읽기 실패:", e.message);
  }
  return env;
}

const env = loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function extractSignedPath(value) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parts = new URL(value).pathname.split("/");
      const idx = parts.indexOf("signed-documents");
      return idx === -1 ? null : parts.slice(idx + 1).join("/");
    } catch {
      return null;
    }
  }
  return value.startsWith("signed-documents/")
    ? value.substring("signed-documents/".length)
    : value;
}

async function chunkedRemove(bucket, paths) {
  const unique = [...new Set(paths.filter(Boolean))];
  let removed = 0;
  for (let i = 0; i < unique.length; i += 100) {
    const batch = unique.slice(i, i + 100);
    if (EXECUTE) {
      const { data, error } = await supabase.storage.from(bucket).remove(batch);
      if (error) {
        console.error(`  ❌ ${bucket} 배치 삭제 실패:`, error.message);
      } else {
        removed += data?.length ?? 0;
      }
    }
  }
  return { total: unique.length, removed };
}

async function main() {
  console.log(`\n=== 소프트 삭제 문서 스토리지 정리 (${EXECUTE ? "EXECUTE 🔴" : "DRY-RUN 🟡"}) ===\n`);

  // 페이지네이션으로 전체 조회 (기본 1000 limit 대비 안전)
  const docs = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("documents")
      .select("id, user_id, file_url, signed_file_url, signed_pdf_url")
      .eq("is_deleted", true)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    docs.push(...data);
    if (data.length < pageSize) break;
  }

  console.log(`대상 소프트 삭제 문서: ${docs.length}개`);

  const docPaths = [];
  const signedPaths = [];
  for (const d of docs) {
    if (d.file_url) docPaths.push(d.file_url);
    // 결정적 경로
    signedPaths.push(`${d.user_id}/signed_${d.id}.pdf`);
    signedPaths.push(`${d.user_id}/signed_${d.id}.png`); // 중간 산출물(있을 수 있음)
    // URL에서 추출한 경로도 포함 (belt & suspenders)
    const s1 = extractSignedPath(d.signed_file_url);
    const s2 = extractSignedPath(d.signed_pdf_url);
    if (s1) signedPaths.push(s1);
    if (s2) signedPaths.push(s2);
  }

  const uniqueDoc = [...new Set(docPaths.filter(Boolean))];
  const uniqueSigned = [...new Set(signedPaths.filter(Boolean))];
  console.log(`  documents 버킷 대상 경로: ${uniqueDoc.length}개`);
  console.log(`  signed-documents 버킷 대상 경로(후보, png 포함): ${uniqueSigned.length}개`);

  if (!EXECUTE) {
    console.log("\n[미리보기] 실제 삭제하려면 --execute 플래그를 붙여 다시 실행하세요.");
    console.log("샘플 documents 경로:", uniqueDoc.slice(0, 3));
    console.log("샘플 signed 경로   :", uniqueSigned.slice(0, 3));
    return;
  }

  const docResult = await chunkedRemove("documents", uniqueDoc);
  const signedResult = await chunkedRemove("signed-documents", uniqueSigned);

  console.log(`\n✅ 완료`);
  console.log(`  documents: ${docResult.removed}/${docResult.total} 삭제`);
  console.log(`  signed-documents: ${signedResult.removed}/${signedResult.total} 삭제 (없는 png 경로는 무시됨)`);
}

main().catch((e) => {
  console.error("❌ 스크립트 오류:", e);
  process.exit(1);
});
