"use client";

import type React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/language-context";
import { forgotPassword } from "./actions";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/ui/submit-button";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [state, dispatch] = useFormState(forgotPassword, null);
  const [emailSent, setEmailSent] = useState(false);

  // Check if email was sent successfully
  useEffect(() => {
    if (state?.success) {
      setEmailSent(true);
    }
  }, [state?.success]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-md space-y-8">
        <div className="bg-background rounded-lg shadow-lg p-8 border">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">
              {emailSent ? t("forgotPassword.checkEmail") : t("forgotPassword.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {emailSent
                ? t("forgotPassword.emailSentMessage")
                : t("forgotPassword.subtitle")
              }
            </p>
          </div>

          {emailSent ? (
            /* Email sent success state */
            <div className="space-y-6">
              <Alert>
                <SendHorizontal className="h-4 w-4" />
                <AlertDescription>
                  {t("forgotPassword.checkInbox")}
                </AlertDescription>
              </Alert>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("forgotPassword.didntReceive")}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  {t("forgotPassword.sendAnother")}
                </Button>
              </div>
            </div>
          ) : (
            /* Email input form */
            <form action={dispatch} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{t("forgotPassword.emailLabel")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    required
                  />
                </div>
                {state?.fieldErrors?.email && (
                  <p className="text-sm text-destructive">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              {state?.error && (
                <Alert variant="destructive">
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              )}

              <SubmitButton
                label={t("forgotPassword.sendReset")}
                pendingLabel={t("forgotPassword.sending")}
                className="w-full"
              />
            </form>
          )}

          {/* Back to login */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}