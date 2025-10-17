"use client";

import { useState } from "react";
import { useFormState } from "react-dom";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/language-context";

import {
  acceptLegalConsent,
  declineLegalConsent,
} from "./actions";

const initialState: { error: string | null } = { error: null };

export function ConsentForm({ nextPath }: { nextPath: string }) {
  const { t } = useLanguage();
  const [accepted, setAccepted] = useState(false);
  const [{ error }, formAction] = useFormState(acceptLegalConsent, initialState);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />

        <div className="flex items-start space-x-3 rounded-md border border-border bg-muted/30 p-4">
          <Checkbox
            id="consent"
            checked={accepted}
            onCheckedChange={(value) => setAccepted(Boolean(value))}
          />
          <label
            htmlFor="consent"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {t("consent.checkbox")}
          </label>
        </div>

        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {t(error)}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={!accepted}
        >
          {t("consent.agreeButton")}
        </Button>
      </form>

      <div className="rounded-md border border-border px-4 py-3 text-sm text-muted-foreground">
        <p>{t("consent.declineNotice")}</p>
      </div>

      <form action={declineLegalConsent}>
        <Button type="submit" variant="outline" className="w-full">
          {t("consent.declineButton")}
        </Button>
      </form>
    </div>
  );
}
