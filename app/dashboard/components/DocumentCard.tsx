"use client";

import { useState } from "react";
import {
  FileImage,
  MoreHorizontal,
  Edit,
  Trash2,
  Share,
  Eye,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/language-context";
import { DocumentWithStats, DocumentAction } from "../types/dashboard";
import { format, formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface DocumentCardProps {
  document: DocumentWithStats;
  onAction: (action: DocumentAction, documentId: string) => void;
}

export default function DocumentCard({
  document,
  onAction,
}: DocumentCardProps) {
  const { t, language } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const dateLocale = language === "ko" ? ko : enUS;

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      draft: { variant: "outline", label: t("dashboard.status.draft") },
      published: { variant: "default", label: t("dashboard.status.published") },
      completed: {
        variant: "secondary",
        label: t("dashboard.status.completed"),
      },
      expired: { variant: "destructive", label: t("dashboard.status.expired") },
    };

    return variants[status] || { variant: "outline", label: status };
  };

  const handleAction = (action: DocumentAction) => {
    if (action === "delete") {
      setShowDeleteDialog(true);
    } else {
      onAction(action, document.id);
    }
  };

  const confirmDelete = () => {
    onAction("delete", document.id);
    setShowDeleteDialog(false);
  };

  const statusBadge = getStatusBadge(document.status || "draft");
  const createdAt = new Date(document.created_at || "");
  const updatedAt = new Date(document.updated_at || "");

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                <FileImage className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm leading-5 truncate"
                  title={document.title}
                >
                  {document.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={statusBadge.variant}
                    className="text-xs py-0 px-2"
                  >
                    {statusBadge.label}
                  </Badge>
                  {document.shareInfo?.hasActiveShare && (
                    <Badge variant="outline" className="text-xs py-0 px-2">
                      <Share className="w-3 h-3 mr-1" />
                      {t("dashboard.shared")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleAction("view")}>
                  <Eye className="w-4 h-4 mr-2" />
                  {t("dashboard.actions.view")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("edit")}>
                  <Edit className="w-4 h-4 mr-2" />
                  {t("dashboard.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction("share")}>
                  <Share className="w-4 h-4 mr-2" />
                  {t("dashboard.actions.share")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleAction("delete")}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("dashboard.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Signature Progress */}
          {document.signatureStats.total > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">
                  {t("dashboard.signatureProgress")}
                </span>
                <span className="font-medium">
                  {document.signatureStats.completed}/
                  {document.signatureStats.total}
                </span>
              </div>
              <Progress
                value={document.signatureStats.progress}
                className="h-1.5"
              />
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>
                  {t("dashboard.signaturesRemaining", {
                    count: document.signatureStats.pending,
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {t("dashboard.created")}:{" "}
                {format(createdAt, "MMM dd, yyyy", { locale: dateLocale })}
              </span>
            </div>

            {updatedAt.getTime() !== createdAt.getTime() && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {t("dashboard.updated")}:{" "}
                  {formatDistanceToNow(updatedAt, {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>
            )}

            {document.shareInfo?.lastAccessed && (
              <div className="flex items-center gap-1">
                <Share className="w-3 h-3" />
                <span>
                  {t("dashboard.lastAccessed")}:{" "}
                  {formatDistanceToNow(document.shareInfo.lastAccessed, {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("view")}
              className="flex-1 text-xs h-7"
            >
              <Eye className="w-3 h-3 mr-1" />
              {t("dashboard.actions.view")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction("edit")}
              className="flex-1 text-xs h-7"
            >
              <Edit className="w-3 h-3 mr-1" />
              {t("dashboard.actions.edit")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("dashboard.deleteDialog.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.deleteDialog.description", {
                title: document.title,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("dashboard.deleteDialog.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
