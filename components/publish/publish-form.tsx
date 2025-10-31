"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/supabase/database.types";
import { createPublication } from "@/app/actions/publication-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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

interface PublishFormProps {
  documents: Document[];
}

export default function PublishForm({ documents }: PublishFormProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [publicationName, setPublicationName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!publicationName.trim()) {
      setError(t("publish.errorName"));
      return;
    }

    if (!password.trim()) {
      setError(t("publish.errorPassword"));
      return;
    }

    if (!expiresAt) {
      setError(t("publish.errorExpiration"));
      return;
    }

    if (selectedDocuments.length === 0) {
      setError(t("publish.errorDocuments"));
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
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success && result.shortUrl) {
        // Redirect to publication detail page
        router.push(`/publication/${result.shortUrl}`);
      }
    } catch (err) {
      setError(t("publish.errorPublishing"));
      setIsLoading(false);
    }
  };

  // Get minimum date (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="publicationName">{t("publish.name")}</Label>
        <Input
          id="publicationName"
          type="text"
          value={publicationName}
          onChange={(e) => setPublicationName(e.target.value)}
          placeholder={t("publish.namePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("publish.password")}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("publish.passwordPlaceholder")}
          required
        />
      </div>

      {/* Date Picker with Popover + Calendar (from original modal) */}
      <div className="space-y-2">
        <Label>{t("publish.expiration")}</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !expiresAt && "text-muted-foreground"
              )}
              disabled={isLoading}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiresAt
                ? expiresAt.toLocaleDateString(
                    language === "ko" ? "ko-KR" : "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : t("publish.expirationPlaceholder")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiresAt}
              onSelect={(date) => {
                if (date) {
                  // Set time to end of day (23:59:59)
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
        <p className="text-xs text-gray-500">
          {t("publish.expirationHint")}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t("publish.documentSelection")} ({selectedDocuments.length}/{documents.length})</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedDocuments.length === documents.length ? t("publish.deselectAll") : t("publish.selectAll")}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {documents.map((document) => (
            <Card
              key={document.id}
              className={`transition-colors ${
                selectedDocuments.includes(document.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <CardContent className="p-0">
                <Label
                  htmlFor={`document-${document.id}`}
                  className="flex items-center gap-3 p-4 cursor-pointer"
                >
                  <Checkbox
                    id={`document-${document.id}`}
                    checked={selectedDocuments.includes(document.id)}
                    onCheckedChange={() => handleDocumentToggle(document.id)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{document.alias || document.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(document.created_at).toLocaleDateString(
                        language === "ko" ? "ko-KR" : "en-US"
                      )}
                    </p>
                  </div>
                </Label>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {t("publish.cancel")}
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? t("publish.submitting") : t("publish.submit")}
        </Button>
      </div>
    </form>
  );
}
