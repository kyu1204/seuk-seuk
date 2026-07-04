import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getPublicationByShortUrl } from "@/app/actions/publication-actions";
import { createServiceSupabase } from "@/lib/supabase/server";
import SignPageContainer from "./components/SignPageContainer";

// Server Component that fetches data and renders SPA container
interface PageProps {
  params: { id: string };
}

// Dynamic metadata so shared links (KakaoTalk, iMessage, etc.) preview the
// publication name. Sign links are private, so keep them out of search indexes.
// Crawlers send no cookies, so they get the Korean default; human visitors get
// their saved language, same as the root layout.
// Title fallback chain: publication name → first document alias → filename.
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = createServiceSupabase();
  const { data: publication } = await supabase
    .from("publications")
    .select("name, documents(alias, filename, is_deleted, created_at)")
    .eq("short_url", params.id)
    .eq("is_deleted", false)
    .single();

  const robots = { index: false, follow: false };

  if (!publication) {
    return { robots };
  }

  const cookieStore = cookies();
  const language =
    (cookieStore.get("seukSeukLanguage")?.value as "ko" | "en") || "ko";

  const documents = (publication.documents ?? [])
    .filter((doc) => !doc.is_deleted)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  const firstDocLabel =
    documents[0]?.alias?.trim() || documents[0]?.filename?.trim() || "";

  let title = publication.name?.trim() || "";
  if (!title && firstDocLabel) {
    title =
      documents.length > 1
        ? language === "ko"
          ? `${firstDocLabel} 외 ${documents.length - 1}건`
          : `${firstDocLabel} and ${documents.length - 1} more`
        : firstDocLabel;
  }
  if (!title) {
    title = language === "ko" ? "서명 요청" : "Signature Request";
  }

  const meta = {
    ko: {
      description: `"${title}" 문서에 서명이 요청되었습니다. 슥슥에서 확인하고 서명해 주세요.`,
      siteName: "슥슥",
      locale: "ko_KR",
    },
    en: {
      description: `You've been requested to sign "${title}". Review and sign it on SeukSeuk.`,
      siteName: "SeukSeuk",
      locale: "en_US",
    },
  }[language];

  return {
    title,
    description: meta.description,
    robots,
    openGraph: {
      title,
      description: meta.description,
      type: "website",
      siteName: meta.siteName,
      locale: meta.locale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: meta.description,
    },
  };
}

export default async function SignPage({ params }: PageProps) {
  const { id } = params;

  // Fetch publication data server-side (includes all documents)
  const { publication, requiresPassword, error } =
    await getPublicationByShortUrl(id);

  // Only show 404 if publication doesn't exist
  if (!publication) {
    notFound();
  }

  // Log non-fatal errors for monitoring
  if (error && publication) {
    console.warn(`Non-fatal error for publication ${id}:`, error);
  }

  // Pass data to SPA container (handles list ↔ document switching)
  return (
    <SignPageContainer
      publicationData={publication}
      requiresPassword={requiresPassword || false}
    />
  );
}
