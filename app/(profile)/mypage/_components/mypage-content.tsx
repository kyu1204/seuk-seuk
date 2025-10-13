"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import DeleteAccountForm from "./delete-account-form";
import type { User } from "@supabase/supabase-js";

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
}

export function MyPageContent({ user, profile, subscription, usage }: MyPageContentProps) {
  const { t, language } = useLanguage();

  // Display name and avatar
  const displayName = profile?.name || user.user_metadata?.full_name || user.email;
  const fallbackText = user.email?.charAt(0).toUpperCase() || "U";
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;

  // Format date with explicit locale to prevent hydration mismatch
  const locale = language === 'ko' ? 'ko-KR' : 'en-US';
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale)
    : "N/A";

  // Usage calculations
  const monthlyLimit = subscription?.plan?.monthly_document_limit || 3;
  const activeLimit = subscription?.plan?.active_document_limit || 3;
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
              <span className="font-medium">{subscription?.plan?.name || "베이직"}</span>
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

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            {t("mypage.dangerZone.title")}
          </CardTitle>
          <CardDescription>{t("mypage.dangerZone.deleteWarning")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountForm userEmail={user.email || ""} />
        </CardContent>
      </Card>
    </div>
  );
}
