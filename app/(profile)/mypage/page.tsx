import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { getUserProfile } from "@/app/actions/account-actions";
import { getUsageWidgetData } from "@/app/actions/subscription-actions";
import { MyPageContent } from "./components/mypage-content";
import ko from "@/locales/ko";
import en from "@/locales/en";

// Force dynamic rendering since this page requires authentication
export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const [{ user, profile, error: profileError }, usageData] = await Promise.all([
    getUserProfile(),
    getUsageWidgetData(),
  ]);

  if (!user) {
    redirect("/login");
  }

  if (profileError) {
    const cookieStore = cookies();
    const language: "ko" | "en" =
      cookieStore.get("seukSeukLanguage")?.value === "en" ? "en" : "ko";
    const errorMessage = (language === "ko" ? ko : en)["mypage.error.loadProfile"];

    return (
      <div className="container max-w-3xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <MyPageContent user={user} profile={profile} usageData={usageData} />;
}
