"use client";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

import { ConsentForm } from "./ConsentForm";

export function ConsentPageContent({ nextPath }: { nextPath: string }) {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <CardTitle>{t("consent.title")}</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {t("consent.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
            <p>{t("consent.linksDescription")}</p>
            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>
                <Link
                  href="/term"
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {t("consent.viewTerms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-medium text-primary hover:underline"
                >
                  {t("consent.viewPrivacy")}
                </Link>
              </li>
            </ul>
          </div>

          <ConsentForm nextPath={nextPath} />
        </CardContent>
      </Card>
    </div>
  );
}

export default ConsentPageContent;
