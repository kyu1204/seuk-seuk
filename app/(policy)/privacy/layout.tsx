import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "슥슥의 개인정보처리방침을 확인하세요.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
