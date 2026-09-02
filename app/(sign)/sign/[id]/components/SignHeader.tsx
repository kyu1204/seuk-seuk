"use client";

import Link from "next/link";
import { FileSignature } from "lucide-react";
import LanguageSelector from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

// Shared header for every screen under /sign/[id] (gate, document list,
// single-document view, completed, not-found). Replaces the four copies of
// this same header markup that used to live in each of those files.
export default function SignHeader() {
  const { t } = useLanguage();

  return (
    <header className="h-14 px-5 border-b bg-background flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <FileSignature className="h-6 w-6 text-primary" />
        <span className="font-bold text-lg">{t("app.title")}</span>
      </Link>
      <LanguageSelector />
    </header>
  );
}
