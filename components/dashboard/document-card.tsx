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
  const { t } = useLanguage();

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
    "ko-KR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  return (
    <Link href={`/document/${document.id}`} className="block group">
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:scale-[1.02]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <h3 className="font-medium text-sm leading-relaxed line-clamp-2 break-all">
                {document.filename}
              </h3>
            </div>
            <Badge variant={statusBadge.variant} className="flex-shrink-0 text-xs">
              {statusBadge.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={document.created_at}>{formattedDate}</time>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}