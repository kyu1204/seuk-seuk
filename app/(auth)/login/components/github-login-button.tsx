"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { createClientSupabase } from "@/lib/supabase/client";
import { Github } from "lucide-react";

export default function GithubLoginButton() {
  const { t } = useLanguage();

  const signInWithGithub = async () => {
    const supabase = createClientSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "github",
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
      onClick={signInWithGithub}
    >
      <Github className="mr-2 h-4 w-4" />
      Github
    </Button>
  );
}
