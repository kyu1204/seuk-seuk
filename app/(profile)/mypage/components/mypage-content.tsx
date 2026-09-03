"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfileName } from "@/app/actions/account-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import DeleteAccountForm from "./delete-account-form";
import { UsageWidget, type UsageWidgetData } from "@/components/dashboard/usage-widget";
import type { User } from "@supabase/supabase-js";

interface MyPageContentProps {
  user: User;
  profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  usageData: UsageWidgetData;
}

export function MyPageContent({ user, profile, usageData }: MyPageContentProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const displayName = profile?.name || user.user_metadata?.full_name || user.email || "";
  const [name, setName] = useState(profile?.name || user.user_metadata?.full_name || "");
  const [isSavingName, startSaveName] = useTransition();
  const nameDirty = name.trim() !== (profile?.name || user.user_metadata?.full_name || "").trim();

  const saveName = () => {
    startSaveName(async () => {
      const result = await updateProfileName(name);
      if (result.error) {
        toast.error(
          result.error === "NAME_REQUIRED"
            ? t("mypage.profile.nameRequired")
            : t("mypage.profile.saveError")
        );
        return;
      }
      toast.success(t("mypage.profile.saved"));
      router.refresh();
    });
  };
  const fallbackText = user.email?.charAt(0).toUpperCase() || "U";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  const locale = language === "ko" ? "ko-KR" : "en-US";
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale)
    : "";

  const subscription = usageData.subscription;
  const planSummary = subscription
    ? t("mypage.plan.summary")
        .replace("{{plan}}", t(`plan.${subscription.plan.name}`))
        .replace(
          "{{date}}",
          subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString(locale) : ""
        )
    : t("mypage.plan.free");

  return (
    <div className="container max-w-3xl mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("mypage.title")}</h1>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mypage.profile.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {fallbackText}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="mypage-name">{t("mypage.profile.name")}</Label>
                <Input
                  id="mypage-name"
                  value={name}
                  maxLength={40}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && nameDirty && !isSavingName) saveName();
                  }}
                />
                <p className="text-xs text-muted-foreground">{t("mypage.profile.nameHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mypage-email">{t("mypage.profile.email")}</Label>
                <Input id="mypage-email" value={user.email || ""} disabled />
                <p className="text-xs text-muted-foreground">{t("mypage.profile.emailHint")}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 text-sm pt-2 border-t">
            <span className="text-muted-foreground">
              {t("mypage.profile.joinedAt")} <span className="font-medium text-foreground">{joinedDate}</span>
            </span>
            <Button size="sm" onClick={saveName} disabled={!nameDirty || isSavingName}>
              {isSavingName ? t("mypage.profile.saving") : t("mypage.profile.save")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan and usage card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>{t("mypage.plan.title")}</CardTitle>
            <CardDescription>{planSummary}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/bills")}>
            {t("mypage.plan.manage")}
          </Button>
        </CardHeader>
        <CardContent>
          <UsageWidget data={usageData} />
        </CardContent>
      </Card>

      {/* Danger zone card */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>{t("mypage.dangerZone.title")}</CardTitle>
          <CardDescription>{t("mypage.dangerZone.deleteWarning")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            {t("mypage.dangerZone.deleteAccount")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("mypage.dangerZone.title")}
            </DialogTitle>
            <DialogDescription>{t("mypage.dangerZone.deleteWarning")}</DialogDescription>
          </DialogHeader>
          <DeleteAccountForm userEmail={user.email || ""} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
