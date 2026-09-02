"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Check, FileText, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface RemainingDocument {
  id: string;
  name: string;
  completed: number;
  total: number;
}

interface SignCompleteProps {
  documentName: string;
  signedCount: number;
  downloadButton: ReactNode;
  remainingDocuments: RemainingDocument[];
  onContinue: (id: string) => void;
  onBackToList: () => void;
  ownerNotified: boolean;
}

export default function SignComplete({
  documentName,
  signedCount,
  downloadButton,
  remainingDocuments,
  onContinue,
  onBackToList,
  ownerNotified,
}: SignCompleteProps) {
  const { t } = useLanguage();
  const nextDocument = remainingDocuments[0];

  return (
    <div className="max-w-md mx-auto px-5 py-10 flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-seal text-primary-foreground">
        <Check className="h-[30px] w-[30px]" strokeWidth={3} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t("sign.complete.title")}</h1>
        <p className="text-muted-foreground">
          {t("sign.complete.description", { name: documentName, count: signedCount })}
        </p>
      </div>

      <div className="w-full rounded-xl border bg-card p-4 flex items-center gap-3 text-left">
        <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{documentName}</p>
          <p className="text-sm text-muted-foreground">
            {t("sign.complete.signedAt", { date: new Date().toLocaleDateString() })}
          </p>
        </div>
        {downloadButton}
      </div>

      {nextDocument && (
        <div className="w-full rounded-xl border bg-card p-4 flex flex-col gap-3 text-left">
          <p className="text-sm text-muted-foreground">
            {t("sign.complete.remaining", { count: remainingDocuments.length })}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{nextDocument.name}</p>
              <p className="text-sm text-muted-foreground">
                {t("sign.documentList.signaturesCompleted", {
                  completed: nextDocument.completed,
                  total: nextDocument.total,
                })}
              </p>
            </div>
            <Button size="sm" onClick={() => onContinue(nextDocument.id)}>
              {t("sign.complete.continue")}
            </Button>
          </div>
        </div>
      )}

      {ownerNotified && (
        <p className="text-xs text-muted-foreground">{t("sign.complete.ownerNotified")}</p>
      )}

      {remainingDocuments.length === 0 && !ownerNotified && (
        <Button variant="outline" onClick={onBackToList} className="w-full">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("sign.documentList.backToList")}
        </Button>
      )}
    </div>
  );
}
