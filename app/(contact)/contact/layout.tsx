import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의하기",
  description: "슥슥 서비스에 대한 문의사항이 있으시면 연락해 주세요.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
