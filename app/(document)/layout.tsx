import type React from "react";
import SiteHeader from "@/components/site-header";

export default function DocumentLayout({
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
