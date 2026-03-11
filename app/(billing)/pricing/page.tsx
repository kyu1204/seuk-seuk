import type { Metadata } from "next";
import { PricingPage } from "./components/PricingPage";

export const metadata: Metadata = {
  title: "요금제",
  description:
    "슥슥의 무료 및 프리미엄 요금제를 확인하세요. 필요에 맞는 전자서명 플랜을 선택하세요.",
  alternates: { canonical: "/pricing" },
};

export default function Pricing() {
  return <PricingPage />;
}