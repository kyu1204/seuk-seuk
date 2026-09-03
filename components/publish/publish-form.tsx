"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/supabase/database.types";
import { createPublication } from "@/app/actions/publication-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { toast } from "sonner";

interface PublishFormProps {
  documents: Document[];
  signatureCounts: Record<string, number>;
  preselectedDocumentId?: string;
}

function defaultExpiration() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  date.setHours(23, 59, 59, 999);
  return date;
}

export default function PublishForm({
  documents,
  signatureCounts,
  preselectedDocumentId,
}: PublishFormProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>(
    preselectedDocumentId && (signatureCounts[preselectedDocumentId] || 0) > 0
      ? [preselectedDocumentId]
      : []
  );
  const [publicationName, setPublicationName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date>(defaultExpiration());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [documentsError, setDocumentsError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  const selectableDocuments = documents.filter(
    (document) => (signatureCounts[document.id] || 0) > 0
  );

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === selectableDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(selectableDocuments.map((doc) => doc.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setDocumentsError("");
    setSubmitError("");

    if (!publicationName.trim()) {
      setNameError(t("publish.errorName"));
      nameRef.current?.focus();
      return;
    }

    if (selectedDocuments.length === 0) {
      setDocumentsError(t("publish.errorDocuments"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await createPublication(
        publicationName,
        password,
        expiresAt.toISOString(),
        selectedDocuments
      );

      if (result.error) {
        setSubmitError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success && result.shortUrl) {
        toast.success(t("publish.success"));
        router.push(`/publication/${result.shortUrl}`);
      }
    } catch (err) {
      setSubmitError(t("publish.errorPublishing"));
      setIsLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>{t("publish.documents.title")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("publish.documents.count", {
                total: documents.length,
                selected: selectedDocuments.length,
              })}
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={handleSelectAll}
          >
            {selectedDocuments.length === selectableDocuments.length && selectableDocuments.length > 0
              ? t("publish.deselectAll")
              : t("publish.selectAll")}
          </button>
        </div>

        {documentsError && (
          <p className="text-sm text-destructive">{documentsError}</p>
        )}

        <div className="space-y-2">
          {documents.map((document) => {
            const areaCount = signatureCounts[document.id] || 0;
            const isSelectable = areaCount > 0;
            const isSelected = selectedDocuments.includes(document.id);
            return (
              <Label
                key={document.id}
                htmlFor={`document-${document.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3",
                  isSelectable ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                  isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <Checkbox
                  id={`document-${document.id}`}
                  checked={isSelected}
                  disabled={!isSelectable}
                  onCheckedChange={() => handleDocumentToggle(document.id)}
                />
                <div className="flex-1">
                  <p className="font-medium">{document.alias || document.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {isSelectable
                      ? t("publish.documents.meta", {
                          pages: document.page_count,
                          signatures: areaCount,
                        })
                      : t("publish.documents.noAreas")}
                  </p>
                </div>
              </Label>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-5">
        {submitError && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {submitError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="publicationName">{t("publish.name")}</Label>
          <Input
            id="publicationName"
            ref={nameRef}
            type="text"
            value={publicationName}
            onChange={(e) => setPublicationName(e.target.value)}
            placeholder={t("publish.namePlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("publish.nameHint")}</p>
          {nameError && <p className="text-sm text-destructive">{nameError}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="password">{t("publish.password")}</Label>
            <span className="text-xs text-muted-foreground">{t("publish.password.optional")}</span>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("publish.passwordPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("publish.passwordHint")}</p>
        </div>

        <div className="space-y-2">
          <Label>{t("publish.expiration")}</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                disabled={isLoading}
                type="button"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiresAt.toLocaleDateString(
                  language === "ko" ? "ko-KR" : "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiresAt}
                onSelect={(date) => {
                  if (date) {
                    const endOfDay = new Date(date);
                    endOfDay.setHours(23, 59, 59, 999);
                    setExpiresAt(endOfDay);
                  }
                  setIsCalendarOpen(false);
                }}
                disabled={(date) => date < today}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            {t("publish.expirationHint")}
          </p>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? t("publish.submitting") : t("publish.submit")}
        </Button>
      </div>
    </form>
  );
}
