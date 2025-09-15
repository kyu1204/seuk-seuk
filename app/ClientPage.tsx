"use client"

import DocumentUpload from "@/components/document-upload"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/contexts/language-context"

export default function ClientPage() {
  const { t } = useLanguage()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-end mb-4">
          <LanguageSelector />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">{t("app.title")}</h1>
          <p className="text-xl text-muted-foreground">{t("app.description")}</p>
        </div>
        <DocumentUpload />
      </div>
    </div>
  )
}

