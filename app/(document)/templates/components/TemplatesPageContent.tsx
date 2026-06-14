"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProjectBreadcrumb } from "@/components/breadcrumb";
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
import { FileStack, Sparkles, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import type { DocumentTemplate } from "@/lib/supabase/database.types";
import {
  publishFromTemplate,
  deleteTemplate,
} from "@/app/actions/template-actions";

interface TemplatesPageContentProps {
  allowed: boolean;
  templates: DocumentTemplate[];
}

export default function TemplatesPageContent({
  allowed,
  templates,
}: TemplatesPageContentProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const [publishTarget, setPublishTarget] = useState<DocumentTemplate | null>(
    null
  );
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      router.refresh();
    } catch {
      toast.error(t("templates.error", "오류가 발생했습니다."));
    }
  };

  // Upsell view for non-Pro users
  if (!allowed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <ProjectBreadcrumb />
          <h1 className="text-2xl font-bold mb-6">{t("templates.title")}</h1>
          <Card>
            <CardContent className="flex flex-col items-center text-center gap-4 py-12">
              <div className="rounded-full bg-primary/10 p-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">
                {t("templates.upgrade.title")}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {t("templates.upgrade.description")}
              </p>
              <Link href="/pricing">
                <Button className="mt-2">{t("templates.upgrade.cta")}</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <ProjectBreadcrumb />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{t("templates.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("templates.description")}
            </p>
          </div>
        </div>

        {templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center gap-3 py-12">
              <FileStack className="h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">
                {t("templates.empty.title")}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {t("templates.empty.description")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardContent className="flex flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">
                        {template.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {template.file_type.toUpperCase()} ·{" "}
                        {t("templates.pageCount", {
                          count: template.page_count,
                        })}
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
      </div>

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
    </div>
  );
}
