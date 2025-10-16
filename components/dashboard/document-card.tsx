import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { Document } from "@/lib/supabase/database.types";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const { t, language } = useLanguage();

  const getStatusBadge = (status: Document["status"]) => {
    const statusMap = {
      draft: {
        label: t("status.draft"),
        variant: "secondary" as const,
      },
      published: {
        label: t("status.published"),
        variant: "default" as const,
      },
      completed: {
        label: t("status.completed"),
        variant: "success" as const,
      },
    };

    return statusMap[status] || statusMap.draft;
  };

  const statusBadge = getStatusBadge(document.status);
  const formattedDate = new Date(document.created_at).toLocaleDateString(
    language === "ko" ? "ko-KR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Truncate filename if it's too long
  const truncateFilename = (filename: string, maxLength: number = 45) => {
    if (filename.length <= maxLength) return filename;
    return filename.slice(0, maxLength) + "...";
  };

  return (
    <Link href={`/document/${document.id}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:scale-[1.02] h-48 flex flex-col">
        <CardHeader className="pb-3 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={statusBadge.variant} className="flex-shrink-0 text-xs">
              {statusBadge.label}
            </Badge>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <h3
              className="font-medium text-sm leading-relaxed text-center px-2 break-words"
              title={document.filename}
            >
              {truncateFilename(document.filename)}
            </h3>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 mt-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={document.created_at}>{formattedDate}</time>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}