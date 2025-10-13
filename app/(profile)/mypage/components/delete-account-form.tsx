"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { deleteAccount } from "@/app/actions/account-actions";
import { useToast } from "@/hooks/use-toast";

interface DeleteAccountFormProps {
  userEmail: string;
}

export default function DeleteAccountForm({ userEmail }: DeleteAccountFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);

    // Validate email matches
    if (emailInput !== userEmail) {
      setError(t("mypage.dangerZone.emailMismatch"));
      return;
    }

    startTransition(async () => {
      try {
        const result = await deleteAccount(formData);

        if (!result.success) {
          setError(result.error || t("mypage.dangerZone.deleteError"));
          toast({
            title: t("mypage.dangerZone.deleteError"),
            description: result.error,
            variant: "destructive",
          });
        } else {
          // Success - show toast and redirect immediately
          toast({
            title: t("mypage.dangerZone.deleteSuccess"),
          });

          // Redirect to home page immediately
          router.push("/");
        }
      } catch (err) {
        console.error("Delete account error:", err);
        setError(t("mypage.dangerZone.deleteError"));
        toast({
          title: t("mypage.dangerZone.deleteError"),
          description: "",
          variant: "destructive",
        });
      }
    });
  };

  if (!showForm) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t("mypage.dangerZone.deleteDescription")}
        </p>
        <Button
          variant="destructive"
          onClick={() => setShowForm(true)}
          disabled={isPending}
        >
          {t("mypage.dangerZone.deleteAccount")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{t("mypage.dangerZone.deleteDescription")}</AlertDescription>
      </Alert>

      <form
        action={handleSubmit}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">{t("mypage.dangerZone.confirmEmail")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("mypage.dangerZone.emailPlaceholder")}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={isPending}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t("mypage.profile.email")}: <span className="font-medium">{userEmail}</span>
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setEmailInput("");
              setError(null);
            }}
            disabled={isPending}
          >
            {t("bills.cancel.keep")}
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={isPending || emailInput !== userEmail}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending
              ? t("mypage.dangerZone.deleting")
              : t("mypage.dangerZone.confirmDelete")}
          </Button>
        </div>
      </form>
    </div>
  );
}
