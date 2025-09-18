"use client"

import DocumentUpload from "@/components/document-upload"
import LanguageSelector from "@/components/language-selector"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function UploadPage() {
  const { t } = useLanguage()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t("upload.backToHome")}</span>
            </Button>
          </Link>
          <LanguageSelector />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t("upload.title")}</h1>
          <p className="text-muted-foreground">{t("upload.description")}</p>
        </div>

        <DocumentUpload />
      </div>
    </div>
  )
}

