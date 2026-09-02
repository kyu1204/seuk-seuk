"use client";

import { FileSignature } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  description?: React.ReactNode;
}

export function AuthShell({ children, title, description }: AuthShellProps) {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen md:grid md:grid-cols-2">
      {/* Left panel - brand */}
      <div className="hidden md:flex flex-col justify-between bg-primary text-primary-foreground p-12">
        <div className="flex items-center gap-2">
          <FileSignature className="h-6 w-6" />
          <span className="font-semibold">{t("app.title")}</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight whitespace-pre-line">
            {t("auth.panel.title")}
          </h1>
          <p className="opacity-80">{t("auth.panel.description")}</p>

          <div className="rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 flex items-center justify-between">
            <span>{t("auth.panel.sampleDoc")}</span>
            <span className="rounded-full px-2.5 h-6 text-xs bg-seal text-primary-foreground inline-flex items-center">
              {t("status.completed")}
            </span>
          </div>
        </div>

        <div className="opacity-80 text-sm">
          © {year} SeukSeuk
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[380px] flex flex-col gap-6">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <FileSignature className="h-6 w-6 text-primary" />
            <span className="font-semibold">{t("app.title")}</span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
