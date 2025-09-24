import type React from "react";
import SiteHeader from "@/components/site-header";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SiteHeader showScrollEffect={true} />
      {children}
    </>
  );
}
