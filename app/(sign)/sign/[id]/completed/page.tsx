"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, FileSignature } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LanguageSelector from "@/components/language-selector"
import Link from "next/link"

export default function SignCompletedPage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with logo */}
      <header className="w-full">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <FileSignature className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">{t("app.title")}</span>
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main content with background pattern */}
      <section className="relative overflow-hidden py-20 md:py-32 flex-1">
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border">
              <CardContent className="pt-16 pb-16 text-center">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-8">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 gradient-text">
                    {t("sign.completed.title")}
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    {t("sign.completed.description")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}