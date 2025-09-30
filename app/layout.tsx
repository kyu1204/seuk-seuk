import type React from "react";
import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/language-context";
import { cookies } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

// Dynamic metadata based on language
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language =
    (cookieStore.get("seukSeukLanguage")?.value as "ko" | "en") || "ko";

  const metadata = {
    ko: {
      title: "슥슥 - 온라인 문서 서명",
      description: "문서를 쉽게 업로드하고, 서명하고, 공유하세요",
    },
    en: {
      title: "SeukSeuk - Online Document Signing",
      description: "Upload, sign, and share documents online with ease",
    },
    icons: {
      icon: "/favicon.svg",
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };

  return {
    title: metadata[language].title,
    description: metadata[language].description,
    generator: "MINT",
    icons: metadata.icons,
    other: metadata.other,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const language =
    (cookieStore.get("seukSeukLanguage")?.value as "ko" | "en") || "ko";

  return (
    <html lang={language === "ko" ? "ko" : "en"} suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>{children}</LanguageProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
