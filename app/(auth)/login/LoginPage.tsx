"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/ui/submit-button";
import { useLanguage } from "@/contexts/language-context";
import { Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import { login } from "./actions";
import { AuthShell } from "../components/auth-shell";
import GoogleLoginButton from "../components/google-login-button";
import KakaoLoginButton from "../components/kakao-login-button";

export default function LoginPage() {
  const { t } = useLanguage();
  const [state, dispatch] = useFormState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AuthShell
      title={t("login.title")}
      description={
        <>
          {t("login.noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("login.register")}
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <KakaoLoginButton />
        <GoogleLoginButton />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("login.orEmail")}
          </span>
        </div>
      </div>

      <form action={dispatch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("login.email")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              name="email"
              errors={state?.fieldErrors?.email}
              placeholder="name@example.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.password")}</Label>
            <Link
              href="/forgot-password"
              className="text-sm py-2 hover:underline"
            >
              {t("login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              errors={state?.fieldErrors?.password}
              placeholder="••••••••"
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              aria-label={t("login.togglePassword")}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-3 text-muted-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {(state as { error?: string } | null)?.error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
            {(state as { error?: string }).error}
          </div>
        )}

        <SubmitButton
          label={t("login.logIn")}
          pendingLabel={t("login.loggingIn")}
          className="w-full bg-primary hover:bg-primary/90"
        />
      </form>
    </AuthShell>
  );
}
