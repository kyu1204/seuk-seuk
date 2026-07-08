import type { Metadata } from "next";
import { getMetadataLanguage } from "@/lib/seo/metadata-language";

const meta = {
  ko: {
    title: "이용약관",
    description: "슥슥의 서비스 이용약관을 확인하세요.",
  },
  en: {
    title: "Terms of Service",
    description: "Read SeukSeuk's terms of service.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getMetadataLanguage();
  return { ...meta[language], alternates: { canonical: "/term" } };
}

export default function TermLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
