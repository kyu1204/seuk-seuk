"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  const truncateName = (templateName: string, maxLength: number = 35) => {
    if (templateName.length <= maxLength) return templateName;
    return `${templateName.slice(0, maxLength)}...`;
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              role="link"
              tabIndex={0}
              className="h-64 flex flex-col cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => router.push(`/templates/${template.id}`)}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget) return;
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  router.push(`/templates/${template.id}`);
                }
              }}
            >
              <CardHeader className="pt-6 pb-3 flex-1 flex flex-col justify-center">
                <div className="flex flex-col items-center text-center space-y-3">
                  <FileStack className="h-8 w-8 text-primary flex-shrink-0" />
                  <h3
                    className="font-medium text-sm leading-relaxed text-center px-2 break-words"
                    title={template.name}
                  >
                    {truncateName(template.name)}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {template.file_type.toUpperCase()} ·{" "}
                    {t("templates.pageCount", { count: template.page_count })}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-4 mt-auto">
                <div className="flex items-center justify-center gap-2">
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
