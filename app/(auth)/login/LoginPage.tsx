"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SubmitButton } from "@/components/ui/submit-button";
import { useLanguage } from "@/contexts/language-context";
import { FileSignature, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { login } from "./actions";
import GoogleLoginButton from "../components/google-login-button";
import KakaoLoginButton from "../components/kakao-login-button";

export default function LoginPage() {
  const { t } = useLanguage();

  const [state, dispatch] = useFormState(login, null);

  return (
    <div className="flex min-h-screen">
      {/* Left side - Pattern background */}
      <div className="hidden md:block md:w-1/2 relative bg-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <FileSignature className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4 gradient-text">
              {t("login.welcomeBack")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("login.welcomeMessage")}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex justify-end p-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              {t("login.backToHome")}
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="ghost" size="sm" className="ml-2">
              {t("login.register")}
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight">
                {t("login.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("login.subtitle")}
              </p>
            </div>

            <form action={dispatch} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      errors={state?.fieldErrors.email}
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
                      className="text-xs text-primary hover:underline"
                    >
                      {t("login.forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      name="password"
                      errors={state?.fieldErrors.password}
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <SubmitButton
                label={t("login.logIn")}
                pendingLabel={t("login.loggingIn")}
                className="w-full bg-primary hover:bg-primary/90"
              />
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t("login.orContinueWith")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <GoogleLoginButton />
              <KakaoLoginButton />
            </div>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                {t("login.noAccount")}
              </span>{" "}
              <Link href="/register" className="text-primary hover:underline">
                {t("login.createAccount")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
