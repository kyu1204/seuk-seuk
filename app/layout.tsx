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
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/json-ld";

const inter = Inter({ subsets: ["latin"] });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seukseuk.com";

// Dynamic metadata based on language
export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language =
    (cookieStore.get("seukSeukLanguage")?.value as "ko" | "en") || "ko";

  const meta = {
    ko: {
      title: "슥슥 - 온라인 문서 서명",
      description:
        "슥슥으로 문서를 쉽게 업로드하고, 서명 영역을 지정하고, 링크 하나로 서명을 받으세요. 무료로 시작할 수 있는 전자서명 서비스입니다.",
    },
    en: {
      title: "SeukSeuk - Online Document Signing",
      description:
        "Upload documents, define signature areas, and collect signatures with a single link. Start for free with SeukSeuk, the easiest e-signature service.",
    },
  };

  const title = meta[language].title;
  const description = meta[language].description;

  return {
    title: {
      default: title,
      template: `%s | ${language === "ko" ? "슥슥" : "SeukSeuk"}`,
    },
    description,
    generator: "MINT",
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: "/",
      languages: {
        ko: "/",
        en: "/",
      },
    },
    icons: {
      icon: "/favicon.svg",
      apple: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      locale: language === "ko" ? "ko_KR" : "en_US",
      alternateLocale: language === "ko" ? "en_US" : "ko_KR",
      url: BASE_URL,
      siteName: language === "ko" ? "슥슥" : "SeukSeuk",
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      ...Sentry.getTraceData(),
    },
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
      <head>
        <meta name="naver-site-verification" content="24ae5cf6d9a265c90d7a677e7b820b8fbb00472b" />
        <OrganizationJsonLd />
        <WebSiteJsonLd baseUrl={BASE_URL} />
      </head>
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
