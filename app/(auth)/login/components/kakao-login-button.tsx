"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { createClientSupabase } from "@/lib/supabase/client";

export default function KakaoLoginButton() {
  const { t } = useLanguage();

  const signInWithKakao = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
  };

  return (
    <Button
      variant="outline"
      type="button"
      className="w-full"
      onClick={signInWithKakao}
    >
      <svg
        className="mr-2 h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="24" height="24" rx="12" fill="#FEE500" />
        <path
          d="M12 5.5C8.41 5.5 5.5 7.865 5.5 10.8C5.5 12.7 6.62 14.3875 8.32 15.3375C8.15 15.9125 7.64 17.8 7.59 18.0375C7.53 18.35 7.75 18.35 7.89 18.25C8 18.175 10.21 16.6625 10.83 16.2375C11.21 16.3 11.6 16.325 12 16.325C15.59 16.325 18.5 13.96 18.5 11.025C18.5 8.09 15.59 5.5 12 5.5Z"
          fill="#392020"
        />
      </svg>
      {t("login.kakaoTalk")}
    </Button>
  );
}
