import type { Metadata } from "next";
import { getMetadataLanguage } from "@/lib/seo/metadata-language";

const meta = {
  ko: {
    title: "개인정보처리방침",
    description: "슥슥의 개인정보처리방침을 확인하세요.",
  },
  en: {
    title: "Privacy Policy",
    description: "Read SeukSeuk's privacy policy.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getMetadataLanguage();
  return { ...meta[language], alternates: { canonical: "/privacy" } };
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
