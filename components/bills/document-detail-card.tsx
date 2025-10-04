"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Document } from "@/lib/supabase/database.types";
import { useLanguage } from "@/contexts/language-context";
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Eye,
  Edit,
} from "lucide-react";
import Link from "next/link";

interface DocumentDetailCardProps {
  document: Document;
}

export function DocumentDetailCard({ document }: DocumentDetailCardProps) {
  const { t } = useLanguage();

  const getStatusInfo = (status: Document["status"]) => {
    const statusMap = {
      draft: {
        label: t("status.draft"),
        variant: "secondary" as const,
        icon: Edit,
      },
      published: {
        label: t("status.published"),
        variant: "default" as const,
        icon: Clock,
      },
      completed: {
        label: t("status.completed"),
        variant: "success" as const,
        icon: CheckCircle,
      },
    };
    return statusMap[status] || statusMap.draft;
  };

  const statusInfo = getStatusInfo(document.status);
  const StatusIcon = statusInfo.icon;

  const formattedDate = new Date(document.created_at).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const truncateFilename = (filename: string, maxLength: number = 30) => {
    if (filename.length <= maxLength) return filename;
    return filename.slice(0, maxLength) + "...";
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-lg font-semibold truncate"
                title={document.filename}
              >
                {truncateFilename(document.filename)}
              </CardTitle>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={statusInfo.variant}
            className="flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Separator />

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("bills.created")}
            </span>
            <span className="font-medium">{formattedDate}</span>
          </div>

          {document.expires_at && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("bills.expires")}
              </span>
              <span className="font-medium">
                {new Date(document.expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <Separator />

        <Link href={`/document/${document.id}`} className="block">
          <Button className="w-full" variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {t("bills.viewDetails")}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
