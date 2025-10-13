"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import DeleteAccountForm from "./_components/delete-account-form";
import { AlertTriangle } from "lucide-react";

type UserProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type SubscriptionData = {
  id: string;
  plan_id: string;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  plan: {
    name: string;
    monthly_document_limit: number;
    active_document_limit: number;
  };
};

type UsageData = {
  documents_created: number;
  published_completed_count: number;
};

export default function MyPage() {
  const { t } = useLanguage();
  const supabase = createClientSupabase();

  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          setError(t("mypage.error.loadProfile"));
          setLoading(false);
          return;
        }

        setUser(authUser);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("id, name, avatar_url, created_at")
          .eq("id", authUser.id)
          .single();

        if (profileError) {
          console.error("Error loading profile:", profileError);
        } else {
          setUserProfile(profileData);
        }

        // Get subscription with plan details
        const { data: subData, error: subError } = await supabase
          .from("subscriptions")
          .select(`
            id,
            plan_id,
            status,
            starts_at,
            ends_at,
            plan:subscription_plans (
              name,
              monthly_document_limit,
              active_document_limit
            )
          `)
          .eq("user_id", authUser.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (subError) {
          console.error("Error loading subscription:", subError);
        } else if (subData) {
          setSubscription({
            ...subData,
            plan: Array.isArray(subData.plan) ? subData.plan[0] : subData.plan,
          });
        }

        // Get current month usage
        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        const { data: usageData, error: usageError } = await supabase
          .from("monthly_usage")
          .select("documents_created, published_completed_count")
          .eq("user_id", authUser.id)
          .eq("year_month", yearMonth)
          .single();

        if (usageError) {
          console.error("Error loading usage:", usageError);
          // Set default values if no usage data exists
          setUsage({ documents_created: 0, published_completed_count: 0 });
        } else {
          setUsage(usageData);
        }

      } catch (err) {
        console.error("Unexpected error:", err);
        setError(t("mypage.error.loadProfile"));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase, t]);

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error || t("mypage.error.loadProfile")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const displayName = userProfile?.name || user.user_metadata?.full_name || user.email;
  const fallbackText = user.email?.charAt(0).toUpperCase() || "U";
  const avatarUrl = userProfile?.avatar_url || user.user_metadata?.avatar_url;
  const joinedDate = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString()
    : "N/A";

  // Usage calculations
  const monthlyLimit = subscription?.plan?.monthly_document_limit || 3;
  const activeLimit = subscription?.plan?.active_document_limit || 3;
  const documentsCreated = usage?.documents_created || 0;
  const activeDocuments = usage?.published_completed_count || 0;
  const monthlyProgress = monthlyLimit === -1 ? 0 : (documentsCreated / monthlyLimit) * 100;
  const activeProgress = activeLimit === -1 ? 0 : (activeDocuments / activeLimit) * 100;

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
                  {new Date(subscription.starts_at).toLocaleDateString()}
                </span>
              </div>
            )}
            {subscription?.ends_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("mypage.subscription.endsAt")}</span>
                <span className="font-medium">
                  {new Date(subscription.ends_at).toLocaleDateString()}
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
                {activeDocuments} / {activeLimit === -1 ? "∞" : activeLimit}
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
