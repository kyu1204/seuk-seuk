"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Coins } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import DeleteAccountForm from "./delete-account-form";
import type { User } from "@supabase/supabase-js";
import type { CreditBalance } from "@/app/actions/credit-actions";

interface MyPageContentProps {
  user: User;
  profile: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;
  subscription: {
    status: string;
    plan: {
      name: string;
      monthly_document_limit: number;
      active_document_limit: number;
    };
    starts_at: string | null;
    ends_at: string | null;
  } | null;
  usage: {
    documents_created: number;
    published_completed_count: number;
  } | null;
  basicPlan: {
    monthly_document_limit: number;
    active_document_limit: number;
  } | null;
  credits?: CreditBalance;
}

export function MyPageContent({ user, profile, subscription, usage, basicPlan, credits }: MyPageContentProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Display name and avatar
  const displayName = profile?.name || user.user_metadata?.full_name || user.email;
  const fallbackText = user.email?.charAt(0).toUpperCase() || "U";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  // Format date with explicit locale to prevent hydration mismatch
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale)
    : "N/A";

  // Usage calculations - use actual Basic plan from DB as fallback
  const monthlyLimit = subscription?.plan?.monthly_document_limit || basicPlan?.monthly_document_limit || 0;
  const activeLimit = subscription?.plan?.active_document_limit || basicPlan?.active_document_limit || 0;
  const documentsCreated = usage?.documents_created || 0;
  const publishedCompleted = usage?.published_completed_count || 0;
  const monthlyProgress = monthlyLimit === -1 ? 0 : (documentsCreated / monthlyLimit) * 100;
  const activeProgress = activeLimit === -1 ? 0 : (publishedCompleted / activeLimit) * 100;

  return (
    <div className="container max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("mypage.title")}</h1>
      </div>

      {/* Profile and Subscription Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("mypage.profile.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={displayName || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {fallbackText}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("mypage.profile.joinedAt")}</span>
                <span className="font-medium">{joinedDate}</span>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors underline"
              >
                {t("mypage.dangerZone.deleteAccount")}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("mypage.subscription.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("mypage.subscription.plan")}</span>
              <span className="font-medium">
                {subscription?.plan?.name ? t(`plan.${subscription.plan.name}`) : t("plan.Basic")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("mypage.subscription.status")}</span>
              <span className="font-medium">{t(`status.${subscription?.status || "active"}`)}</span>
            </div>
            {subscription?.starts_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("mypage.subscription.startsAt")}</span>
                <span className="font-medium">
                  {new Date(subscription.starts_at).toLocaleDateString(locale)}
                </span>
              </div>
            )}
            {subscription?.ends_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("mypage.subscription.endsAt")}</span>
                <span className="font-medium">
                  {new Date(subscription.ends_at).toLocaleDateString(locale)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">{t("mypage.subscription.documentsLimit")}</span>
              <span className="font-medium">
                {monthlyLimit === -1 ? t("mypage.subscription.unlimited") : monthlyLimit}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("mypage.usage.title")}</CardTitle>
          <CardDescription>{t("mypage.usage.thisMonth")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monthly Documents */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t("mypage.usage.documents")}</span>
              <span className="text-muted-foreground">
                {documentsCreated} / {monthlyLimit === -1 ? "∞" : monthlyLimit}
              </span>
            </div>
            {monthlyLimit !== -1 && (
              <Progress value={monthlyProgress} className="h-2" />
            )}
          </div>

          {/* Active Documents */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{t("mypage.usage.activeDocuments")}</span>
              <span className="text-muted-foreground">
                {publishedCompleted} / {activeLimit === -1 ? "∞" : activeLimit}
              </span>
            </div>
            {activeLimit !== -1 && (
              <Progress value={activeProgress} className="h-2" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credit Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{t("mypage.creditTitle", "보유 크레딧")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("mypage.createAvailable", "생성 가능")}</span>
              <span className="text-2xl font-bold">{credits?.create_credits || 0}개</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("mypage.publishAvailable", "발행 가능")}</span>
              <span className="text-2xl font-bold">{credits?.publish_credits || 0}개</span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push("/pricing")}
          >
            <Coins className="mr-2 h-4 w-4" />
            {t("mypage.rechargeButton", "크레딧 충전")}
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {t("mypage.dangerZone.title")}
            </DialogTitle>
            <DialogDescription>
              {t("mypage.dangerZone.deleteWarning")}
            </DialogDescription>
          </DialogHeader>
          <DeleteAccountForm userEmail={user.email || ""} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
