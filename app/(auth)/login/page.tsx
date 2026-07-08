import type { Metadata } from "next";
import { getMetadataLanguage } from "@/lib/seo/metadata-language";
import LoginPage from "./LoginPage";

const meta = {
  ko: {
    title: "로그인",
    description: "슥슥에 로그인하여 문서 서명을 관리하세요.",
  },
  en: {
    title: "Log in",
    description: "Log in to SeukSeuk to manage your document signing.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getMetadataLanguage();
  return { ...meta[language], alternates: { canonical: "/login" } };
}

export default function Login() {
  return <LoginPage />;
}
