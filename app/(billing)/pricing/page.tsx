import type { Metadata } from "next";
import { getMetadataLanguage } from "@/lib/seo/metadata-language";
import { PricingPage } from "./components/PricingPage";

const meta = {
  ko: {
    title: "요금제",
    description:
      "슥슥의 무료 및 프리미엄 요금제를 확인하세요. 필요에 맞는 전자서명 플랜을 선택하세요.",
  },
  en: {
    title: "Pricing",
    description:
      "Explore SeukSeuk's free and premium plans. Choose the e-signature plan that fits your needs.",
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const language = await getMetadataLanguage();
  return { ...meta[language], alternates: { canonical: "/pricing" } };
}

export default function Pricing() {
  return <PricingPage />;
}