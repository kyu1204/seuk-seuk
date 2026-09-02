"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/ui/submit-button";
import { useLanguage } from "@/contexts/language-context";
import { Eye, EyeOff, KeyRound, Mail, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useFormState } from "react-dom";
import GoogleLoginButton from "../components/google-login-button";
import KakaoLoginButton from "../components/kakao-login-button";
import { AuthShell } from "../components/auth-shell";
import { register } from "./actions";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showAgreeRequired, setShowAgreeRequired] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [state, dispatch] = useFormState(register, null);

  const agreeText = t("register.agreeText");
  const [beforeTerms, betweenTermsAndPrivacy, afterPrivacy] = agreeText.split(
    /\{\{terms\}\}|\{\{privacy\}\}/
  );

  return (
    <AuthShell
      title={t("register.title")}
      description={
        <>
          {t("register.alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t("register.login")}
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
            {t("register.orContinueWith")}
          </span>
        </div>
      </div>

      <form
        action={dispatch}
        onSubmit={(event) => {
          if (!privacyAccepted) {
            event.preventDefault();
            setShowAgreeRequired(true);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="name">{t("register.name")}</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              name="name"
              errors={state?.fieldErrors?.name}
              placeholder="John Doe"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("register.email")}</Label>
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
          <Label htmlFor="password">{t("register.password")}</Label>
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
          <p className="text-xs text-muted-foreground">
            {t("register.passwordHint")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            {t("register.confirmPassword")}
          </Label>
          <div className="relative">
            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              errors={state?.fieldErrors?.confirmPassword}
              placeholder="••••••••"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => {
                setPrivacyAccepted(checked as boolean);
                if (checked) setShowAgreeRequired(false);
              }}
            />
            <label
              htmlFor="privacy"
              className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {beforeTerms}
              <Link
                href="/term"
                target="_blank"
                className="text-primary hover:underline"
              >
                {t("register.termsOfService")}
              </Link>
              {betweenTermsAndPrivacy}
              <Link
                href="/privacy"
                target="_blank"
                className="text-primary hover:underline"
              >
                {t("register.privacyPolicy")}
              </Link>
              {afterPrivacy}
            </label>
          </div>
          {showAgreeRequired && (
            <p className="text-xs text-destructive">
              {t("register.agreeRequired")}
            </p>
          )}
        </div>

        <SubmitButton
          label={t("register.createAccount")}
          pendingLabel={t("register.registering")}
          className="w-full bg-primary hover:bg-primary/90"
        />
      </form>
    </AuthShell>
  );
}
