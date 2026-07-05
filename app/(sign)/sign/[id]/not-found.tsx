"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";
import { FileSignature, LinkIcon } from "lucide-react";
import Link from "next/link";

export default function SignNotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header with logo */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">{t("app.title")}</span>
          </Link>
          <LanguageSelector />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center container mx-auto px-4 pb-16">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <LinkIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl">{t("sign.notFound")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">{t("sign.notFoundDesc")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("sign.notFoundContact")}
                </p>
              </div>
              <Button asChild className="w-full" size="lg">
                <Link href="/">{t("sign.returnHome")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
