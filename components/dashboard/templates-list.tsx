"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileX, FileStack, Sparkles, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import {
  canUseTemplate,
  getUserTemplates,
  publishFromTemplate,
  deleteTemplate,
} from "@/app/actions/template-actions";
import type { DocumentTemplate } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DashboardSkeleton } from "./dashboard-skeleton";

export function TemplatesList() {
  const { t } = useLanguage();
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [publishTarget, setPublishTarget] = useState<DocumentTemplate | null>(
    null
  );
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const gate = await canUseTemplate();
      if (!gate.canUse) {
        setAllowed(false);
        return;
      }
      setAllowed(true);

      const result = await getUserTemplates();
      if (result.error) {
        setError(result.error);
      } else {
        setTemplates(result.templates || []);
      }
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const openPublish = (template: DocumentTemplate) => {
    setPublishTarget(template);
    setName(template.name);
    setPassword("");
    setExpiresAt("");
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    if (!name.trim()) {
      toast.error(t("publish.errorName", "발행 이름을 입력하세요"));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await publishFromTemplate(publishTarget.id, {
        name: name.trim(),
        password,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("templates.publish", "이 템플릿으로 발행"));
      setPublishTarget(null);
      router.push("/dashboard");
    } catch {
      toast.error(t("publish.errorPublishing", "발행 중 오류가 발생했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (template: DocumentTemplate) => {
    try {
      const result = await deleteTemplate(template.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t("templates.delete", "삭제"));
      loadTemplates();
    } catch {
      toast.error(t("templates.error", "오류가 발생했습니다."));
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  // Upsell for non-Pro users
  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="rounded-full bg-primary/10 p-6 mb-6">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {t("templates.upgrade.title")}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          {t("templates.upgrade.description")}
        </p>
        <Link href="/pricing">
          <Button size="lg">{t("templates.upgrade.cta")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <FileX className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {t("templates.empty.title")}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t("templates.empty.description")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-muted p-2 shrink-0">
                    <FileStack className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.file_type.toUpperCase()} ·{" "}
                      {t("templates.pageCount", { count: template.page_count })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    className="gap-1 flex-1"
                    onClick={() => openPublish(template)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {t("templates.publish")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleDelete(template)}
                    aria-label={t("templates.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!publishTarget}
        onOpenChange={(open) => !open && setPublishTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("templates.publish")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="tpl-pub-name">
                {t("publish.name", "발행 이름")}
              </Label>
              <Input
                id="tpl-pub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-pub-pw">
                {t("publish.password", "비밀번호")}
              </Label>
              <Input
                id="tpl-pub-pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tpl-pub-exp">
                {t("publish.expiration", "만료일")}
              </Label>
              <Input
                id="tpl-pub-exp"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishTarget(null)}
              disabled={isSubmitting}
            >
              {t("common.cancel", "취소")}
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting}>
              {isSubmitting
                ? t("upload.generating", "생성 중...")
                : t("templates.publish")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
