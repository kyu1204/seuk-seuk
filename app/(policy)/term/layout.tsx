import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "슥슥의 서비스 이용약관을 확인하세요.",
  alternates: { canonical: "/term" },
};

export default function TermLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
