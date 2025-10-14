import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getUserProfile } from "@/app/actions/account-actions";
import { getCurrentSubscription, getCurrentMonthUsage, getBasicPlan } from "@/app/actions/subscription-actions";
import { MyPageContent } from "./components/mypage-content";

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

export default async function MyPage() {
  // Fetch all data in parallel
  const [
    { user, profile, error: profileError },
    { subscription },
    { usage },
    { plan: basicPlan },
  ] = await Promise.all([
    getUserProfile(),
    getCurrentSubscription(),
    getCurrentMonthUsage(),
    getBasicPlan(),
  ]);

  // Redirect if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Show error if profile loading failed
  if (profileError) {
    return (
      <div className="container max-w-5xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>프로필을 불러오는데 실패했습니다</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <MyPageContent
      user={user}
      profile={profile}
      subscription={subscription}
      usage={usage}
      basicPlan={basicPlan}
    />
  );
}
