import type { Metadata } from "next";
import { getMetadataLanguage } from "@/lib/seo/metadata-language";

const meta = {
  ko: {
    title: "문의하기",
    description: "슥슥 서비스에 대한 문의사항이 있으시면 연락해 주세요.",
  },
  en: {
    title: "Contact",
    description:
      "Get in touch with the SeukSeuk team for any questions about the service.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getMetadataLanguage();
  return { ...meta[language], alternates: { canonical: "/contact" } };
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
