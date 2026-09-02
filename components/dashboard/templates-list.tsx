"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileX, Send, Trash2, Sparkles } from "lucide-react";
import { DocumentTile } from "@/components/dashboard/document-tile";
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
  const searchParams = useSearchParams();

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
        if (gate.reason === "plan_not_allowed") {
          setAllowed(false);
          return;
        }
        setError(gate.error || "Failed to load templates");
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

  useEffect(() => {
    const publishTemplateId = searchParams.get("publishTemplate");
    if (!publishTemplateId || templates.length === 0) return;

    const template = templates.find((item) => item.id === publishTemplateId);
    if (!template) return;

    openPublish(template);
    router.replace("/dashboard?tab=templates", { scroll: false });
  }, [router, searchParams, templates]);

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
      router.push("/dashboard?tab=publications");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold">{t("templates.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("templates.description")}
          </p>
        </div>
      </div>

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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <DocumentTile
              key={template.id}
              title={template.name}
              metaLeft={template.file_type.toUpperCase()}
              metaRight={t("templates.card.areas", { count: template.page_count })}
              onClick={() => router.push(`/templates/${template.id}`)}
              actions={
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      openPublish(template);
                    }}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    {t("templates.publish")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDelete(template);
                    }}
                    aria-label={t("templates.delete")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              }
            />
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
