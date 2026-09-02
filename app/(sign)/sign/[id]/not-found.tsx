"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { LinkIcon } from "lucide-react";
import Link from "next/link";
import SignHeader from "./components/SignHeader";

export default function SignNotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SignHeader />

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
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link href="/">{t("sign.returnHome")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
