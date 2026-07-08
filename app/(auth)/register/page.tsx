import type { Metadata } from "next";
import { getMetadataLanguage } from "@/lib/seo/metadata-language";
import RegisterPage from "./RegisterPage";

const meta = {
  ko: {
    title: "회원가입",
    description:
      "슥슥에 무료로 가입하고 온라인 문서 서명 서비스를 시작하세요.",
  },
  en: {
    title: "Sign up",
    description:
      "Sign up for free and start collecting signatures online with SeukSeuk.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getMetadataLanguage();
  return { ...meta[language], alternates: { canonical: "/register" } };
}

export default function Register() {
  return <RegisterPage />;
}
