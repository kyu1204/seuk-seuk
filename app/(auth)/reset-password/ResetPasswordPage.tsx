"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";
import { resetPassword } from "./actions";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/ui/submit-button";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [state, dispatch] = useFormState(resetPassword, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [state?.success, router]);

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="w-full max-w-md">
          <div className="bg-background rounded-lg shadow-lg p-8 border text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-green-600">
                {t("resetPassword.successTitle")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("resetPassword.successMessage")}
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full">
                {t("resetPassword.backToLogin")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-background rounded-lg shadow-lg p-8 border">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {t("resetPassword.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("resetPassword.subtitle")}
            </p>
          </div>

          {/* Password Reset Form */}
          <form action={dispatch} className="space-y-6">
            <div className="space-y-4">
              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("resetPassword.newPassword")}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {state?.fieldErrors?.password && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.password[0]}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("resetPassword.confirmPassword")}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    className="pl-10 pr-10"
                    minLength={6}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {state?.fieldErrors?.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>
            </div>

            {state?.error && (
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <SubmitButton
              label={t("resetPassword.updatePassword")}
              pendingLabel={t("resetPassword.updating")}
              className="w-full"
            />
          </form>

          {/* Back to login */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("resetPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}