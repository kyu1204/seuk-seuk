"use client";

import { useEffect, useState, useTransition } from "react";
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
import { AuthShell } from "../components/auth-shell";

const RESEND_COOLDOWN_SECONDS = 30;

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [state, dispatch] = useFormState(forgotPassword, null);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isResending, startTransition] = useTransition();

  useEffect(() => {
    if (state?.success) {
      setEmailSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    }
  }, [state?.success]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = () => {
    if (cooldown > 0 || !email) return;
    const formData = new FormData();
    formData.set("email", email);
    startTransition(async () => {
      await forgotPassword(null, formData);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    });
  };

  return (
    <AuthShell
      title={emailSent ? t("forgotPassword.checkEmail") : t("forgotPassword.title")}
      description={
        emailSent
          ? t("forgotPassword.emailSentMessage")
          : t("forgotPassword.subtitle")
      }
    >
      {emailSent ? (
        <div className="space-y-6">
          <Alert>
            <SendHorizontal className="h-4 w-4" />
            <AlertDescription>{t("forgotPassword.checkInbox")}</AlertDescription>
          </Alert>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("forgotPassword.didntReceive")}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="w-full"
            >
              {cooldown > 0
                ? t("forgotPassword.resendIn", { seconds: cooldown })
                : t("forgotPassword.sendAnother")}
            </Button>
          </div>
        </div>
      ) : (
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t("forgotPassword.emailLabel")}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("forgotPassword.backToLogin")}
        </Link>
      </div>
    </AuthShell>
  );
}
