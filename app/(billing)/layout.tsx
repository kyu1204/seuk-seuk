import type React from "react";
import SiteHeader from "@/components/site-header";

export default function BillingLayout({
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
