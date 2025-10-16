"use client";

import { useState } from "react";
import type { PublicationWithDocuments } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectBreadcrumb } from "@/components/breadcrumb";
import {
  Copy,
  Check,
  Calendar as CalendarIcon,
  Lock,
  FileText,
  ExternalLink,
  Edit,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { updatePublication } from "@/app/actions/publication-actions";
import { useRouter } from "next/navigation";

interface PublicationDetailContentProps {
  publication: PublicationWithDocuments;
  shortUrl: string;
}

export function PublicationDetailContent({
  publication,
  shortUrl,
}: PublicationDetailContentProps) {
  const [copied, setCopied] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState(publication.name || "");
  const [editPassword, setEditPassword] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState<Date | undefined>(
    publication.expires_at ? new Date(publication.expires_at) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [updatePasswordMode, setUpdatePasswordMode] = useState(false);
  const { t, language } = useLanguage();
  const router = useRouter();

  // Generate share URL
  const shareUrl = `${window.location.origin}/sign/${shortUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await updatePublication(
        publication.id,
        editName,
        updatePasswordMode ? editPassword : null,
        editExpiresAt ? editExpiresAt.toISOString() : null
      );

      if (result.error) {
        alert(result.error);
        return;
      }

      // Success - refresh the page
      setIsEditOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "completed":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "expired":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active":
        return t("publicationDetail.status.active");
      case "completed":
        return t("publicationDetail.status.completed");
      case "expired":
        return t("publicationDetail.status.expired");
      default:
        return status || t("publicationDetail.status.unknown");
    }
  };

  // Get minimum date (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      {/* Breadcrumb */}
      <ProjectBreadcrumb />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t("publicationDetail.header.title")}
        </h1>
        <p className="text-muted-foreground">
          {t("publicationDetail.header.description")}
        </p>
      </div>

      {/* Publication Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{publication.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                {t("publicationDetail.createdAt")}: {new Date(publication.created_at!).toLocaleDateString(
                  language === "ko" ? "ko-KR" : "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(publication.status)}>
                {getStatusLabel(publication.status)}
              </Badge>
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={publication.status === "completed"}
                    title={publication.status === "completed" ? t("publicationDetail.cannotEditCompleted") : undefined}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("publicationDetail.edit")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{t("publicationDetail.editTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("publicationDetail.editDescription")}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">{t("publicationDetail.editName")}</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("publicationDetail.editExpiresAt")}</Label>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !editExpiresAt && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                            type="button"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editExpiresAt
                              ? editExpiresAt.toLocaleDateString(
                                  language === "ko" ? "ko-KR" : "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  }
                                )
                              : t("publicationDetail.editExpiresAtHint")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={editExpiresAt}
                            onSelect={(date) => {
                              if (date) {
                                // Set time to end of day (23:59:59)
                                const endOfDay = new Date(date);
                                endOfDay.setHours(23, 59, 59, 999);
                                setEditExpiresAt(endOfDay);
                              } else {
                                setEditExpiresAt(undefined);
                              }
                              setIsCalendarOpen(false);
                            }}
                            disabled={(date) => date < today}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        {t("publicationDetail.editExpiresAtHint")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{t("publicationDetail.editPassword")}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUpdatePasswordMode(!updatePasswordMode)}
                        >
                          {updatePasswordMode
                            ? t("publicationDetail.cancelPasswordUpdate")
                            : t("publicationDetail.updatePassword")}
                        </Button>
                      </div>
                      {updatePasswordMode && (
                        <>
                          <Input
                            id="edit-password"
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            placeholder={t("publicationDetail.editPasswordPlaceholder")}
                          />
                          <p className="text-xs text-muted-foreground">
                            {t("publicationDetail.editPasswordHint")}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditOpen(false)}
                        disabled={isSubmitting}
                      >
                        {t("publicationDetail.cancel")}
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? t("publicationDetail.saving") : t("publicationDetail.save")}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expiration Date */}
          {publication.expires_at && (
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("publicationDetail.expiresAt")}:</span>
              <span>
                {new Date(publication.expires_at).toLocaleDateString(
                  language === "ko" ? "ko-KR" : "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </span>
            </div>
          )}

          {/* Password Status */}
          <div className="flex items-center gap-2 text-sm">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("publicationDetail.password")}:</span>
            <span>{publication.password ? t("publicationDetail.passwordSet") : t("publicationDetail.passwordNotSet")}</span>
          </div>

          {/* Document Count */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("publicationDetail.documentCount")}:</span>
            <span>{publication.documents?.length || 0}{t("publicationDetail.countUnit")}</span>
          </div>

          {/* Share URL */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("publicationDetail.signatureLink")}</p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm break-all">
                {shareUrl}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title={t("publicationDetail.copyLink")}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(shareUrl, "_blank")}
                title={t("publicationDetail.openInNewTab")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("publicationDetail.shareLinkDescription")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("publicationDetail.documentsList")}</CardTitle>
        </CardHeader>
        <CardContent>
          {publication.documents && publication.documents.length > 0 ? (
            <div className="space-y-3">
              {publication.documents.map((document: any) => {
                const totalSignatures = document.signatures?.length || 0;
                const completedSignatures =
                  document.signatures?.filter((s: any) => s.signature_data !== null)
                    .length || 0;

                return (
                  <Card
                    key={document.id}
                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => {
                      window.location.href = `/document/${document.id}`;
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{document.filename}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              {t("publicationDetail.createdAt")}:{" "}
                              {new Date(document.created_at).toLocaleDateString(
                                language === "ko" ? "ko-KR" : "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                            {totalSignatures > 0 && (
                              <span>
                                {t("publicationDetail.signatures")}: {completedSignatures}/{totalSignatures}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={
                            document.status === "completed"
                              ? "bg-green-500/10 text-green-700 dark:text-green-400"
                              : document.status === "published"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                              : "bg-gray-500/10 text-gray-700 dark:text-gray-400"
                          }
                        >
                          {document.status === "completed"
                            ? t("publicationDetail.documentStatus.completed")
                            : document.status === "published"
                            ? t("publicationDetail.documentStatus.published")
                            : document.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t("publicationDetail.noDocuments")}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
