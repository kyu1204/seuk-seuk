"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { getUserUsageLimits, getCurrentSubscription } from "@/app/actions/subscription-actions";
import type { UsageLimits, Subscription } from "@/app/actions/subscription-actions";

export function UsageWidget() {
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsageData() {
      try {
        const [limitsResult, subscriptionResult] = await Promise.all([
          getUserUsageLimits(),
          getCurrentSubscription(),
        ]);

        if (limitsResult.error) {
          setError(limitsResult.error);
          return;
        }

        if (subscriptionResult.error) {
          setError(subscriptionResult.error);
          return;
        }

        setLimits(limitsResult.limits);
        setSubscription(subscriptionResult.subscription);
      } catch (err) {
        setError("Failed to load usage data");
        console.error("Usage widget error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsageData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            사용량 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !limits || !subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            사용량 정보 오류
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || "사용량 정보를 불러올 수 없습니다."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const monthlyProgress = limits.monthlyCreationLimit === -1
    ? 0
    : (limits.currentMonthlyCreated / limits.monthlyCreationLimit) * 100;

  const activeProgress = limits.activeDocumentLimit === -1
    ? 0
    : (limits.currentActiveDocuments / limits.activeDocumentLimit) * 100;

  const isMonthlyNearLimit = monthlyProgress >= 80;
  const isActiveNearLimit = activeProgress >= 80;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>사용량 현황</CardTitle>
          </div>
          <Badge variant={subscription.plan.name === "Free" ? "secondary" : "default"}>
            {subscription.plan.name === "Free" ? "무료" : subscription.plan.name} 플랜
          </Badge>
        </div>
        <CardDescription>
          현재 월 사용량과 활성 문서 현황을 확인하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Monthly Creation Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">이번 달 문서 생성</span>
            <span className={isMonthlyNearLimit ? "text-destructive font-medium" : ""}>
              {limits.currentMonthlyCreated}{" "}
              {limits.monthlyCreationLimit === -1 ? "/ 무제한" : `/ ${limits.monthlyCreationLimit}`}
            </span>
          </div>
          {limits.monthlyCreationLimit !== -1 && (
            <Progress
              value={monthlyProgress}
              className={`h-2 ${isMonthlyNearLimit ? "[&>div]:bg-destructive" : ""}`}
            />
          )}
          {!limits.canCreateNew && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              월별 문서 생성 제한에 도달했습니다
            </div>
          )}
        </div>

        {/* Active Documents Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">활성 문서 (게시됨 + 완료됨)</span>
            <span className={isActiveNearLimit ? "text-destructive font-medium" : ""}>
              {limits.currentActiveDocuments}{" "}
              {limits.activeDocumentLimit === -1 ? "/ 무제한" : `/ ${limits.activeDocumentLimit}`}
            </span>
          </div>
          {limits.activeDocumentLimit !== -1 && (
            <Progress
              value={activeProgress}
              className={`h-2 ${isActiveNearLimit ? "[&>div]:bg-destructive" : ""}`}
            />
          )}
          {!limits.canPublishMore && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              활성 문서 제한에 도달했습니다
            </div>
          )}
        </div>

        {/* Upgrade CTA for Free Plan */}
        {subscription.plan.name === "Free" && (isMonthlyNearLimit || isActiveNearLimit) && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">더 많은 문서가 필요하신가요?</p>
                <p className="text-xs text-muted-foreground">Pro 플랜으로 업그레이드하세요</p>
              </div>
              <Button size="sm" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                업그레이드
              </Button>
            </div>
          </div>
        )}

        {/* Plan Features Summary */}
        {subscription.plan.features && subscription.plan.features.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-2">현재 플랜 혜택</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {subscription.plan.features.slice(0, 2).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-primary rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}