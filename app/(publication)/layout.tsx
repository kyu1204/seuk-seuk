import type React from "react";
import SiteHeader from "@/components/site-header";

export default function PublicationLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader showScrollEffect={false} />
      {children}
    </>
  );
}
