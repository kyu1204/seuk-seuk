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
  Calendar,
  Lock,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface PublicationDetailContentProps {
  publication: PublicationWithDocuments;
  shortUrl: string;
}

export function PublicationDetailContent({
  publication,
  shortUrl,
}: PublicationDetailContentProps) {
  const [copied, setCopied] = useState(false);
  const { t } = useLanguage();

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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
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
            <div>
              <CardTitle className="text-2xl mb-2">{publication.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t("publicationDetail.createdAt")}: {new Date(publication.created_at!).toLocaleDateString("ko-KR")}
              </div>
            </div>
            <Badge className={getStatusColor(publication.status)}>
              {getStatusLabel(publication.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expiration Date */}
          {publication.expires_at && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{t("publicationDetail.expiresAt")}:</span>
              <span>
                {new Date(publication.expires_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
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
                  document.signatures?.filter((s: any) => s.status === "completed")
                    .length || 0;

                return (
                  <Card
                    key={document.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{document.filename}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              {t("publicationDetail.createdAt")}:{" "}
                              {new Date(document.created_at).toLocaleDateString(
                                "ko-KR"
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
