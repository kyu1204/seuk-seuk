"use client";

import { verifyPublicationPassword } from "@/app/actions/publication-actions";
import SignedDocumentBundleButton from "./SignedDocumentBundleButton";
import SignHeader from "./SignHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/contexts/language-context";
import type { PublicationWithDocuments } from "@/lib/supabase/database.types";
import { documentDisplayLabel } from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  Eye,
  Check,
  EyeOff,
  FileText,
  Lock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SignDocumentListProps {
  publicationData: PublicationWithDocuments;
  requiresPassword: boolean;
  senderName: string;
  isPasswordVerified: boolean;
  verifiedPassword?: string | null;
  onPasswordVerified: (password: string) => void;
  onSelectDocument: (documentId: string) => void;
}

// "M월 D일" in Korean, "MMM D" in English.
const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
function formatExpiryDate(iso: string, language: "ko" | "en"): string {
  const date = new Date(iso);
  return language === "ko"
    ? `${date.getMonth() + 1}월 ${date.getDate()}일`
    : `${EN_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export default function SignDocumentList({
  publicationData,
  requiresPassword,
  senderName,
  isPasswordVerified,
  verifiedPassword,
  onPasswordVerified,
  onSelectDocument,
}: SignDocumentListProps) {
  const { t, language } = useLanguage();

  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if publication is expired or completed
  const isExpired = publicationData.expires_at
    ? new Date(publicationData.expires_at) < new Date()
    : false;
  const isCompleted = publicationData.status === "completed";

  const documentCount = publicationData.documents?.length ?? 0;
  const areaCount = (publicationData.documents ?? []).reduce(
    (sum, doc) => sum + (doc.signatures?.length ?? 0),
    0
  );

  const sentByLine = senderName
    ? t("sign.gate.sentBy", { sender: senderName })
    : t("sign.gate.sentByUnknown");

  const summaryLine = publicationData.expires_at
    ? t("sign.gate.summary", {
        docs: documentCount,
        areas: areaCount,
        date: formatExpiryDate(publicationData.expires_at, language),
      })
    : t("sign.gate.summaryNoExpiry", { docs: documentCount, areas: areaCount });

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError(t("sign.password.required"));
      return;
    }

    setIsVerifyingPassword(true);
    setError(null);

    try {
      const result = await verifyPublicationPassword(
        publicationData.short_url,
        password
      );

      if (result.error) {
        // Map the raw server error to a localized message for the signer.
        setError(t("sign.password.error"));
        return;
      }

      if (result.isValid) {
        onPasswordVerified(password);
      } else {
        setError(t("sign.password.incorrect"));
      }
    } catch (err) {
      console.error("Password verification error:", err);
      setError(t("sign.password.error"));
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  // Calculate signature completion for a document
  const getDocumentSignatureStatus = (documentId: string) => {
    const document = publicationData.documents?.find(
      (doc) => doc.id === documentId
    );
    if (!document) return { completed: 0, total: 0 };

    const signatures = document.signatures || [];
    const total = signatures.length;
    const completed = signatures.filter(
      (sig) => sig.signature_data !== null
    ).length;

    return { completed, total };
  };

  // Show completed document screen if publication is completed.
  // For password-protected publications, defer to the password gate below first
  // so the entered password is available for signed-document downloads.
  if (isCompleted && (!requiresPassword || isPasswordVerified)) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SignHeader />

        {/* Main content */}
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-seal mb-4" />
                <CardTitle className="text-xl text-seal">
                  {t("sign.completed.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">{t("sign.completed.message")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("sign.completed.noEdit")}
                  </p>
                </div>
                <div className="bg-seal-soft border rounded-md p-3">
                  <p className="text-sm text-seal text-center font-medium">
                    {publicationData.name}
                  </p>
                  <p className="text-xs text-seal text-center mt-1">
                    {t("sign.completed.status")}
                  </p>
                </div>
                {publicationData.documents?.some(
                  (doc) => doc.status === "completed"
                ) && (
                  <SignedDocumentBundleButton
                    shortUrl={publicationData.short_url}
                    password={verifiedPassword ?? password}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Show expired document screen if publication is expired
  if (isExpired) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SignHeader />
        <div className="max-w-md mx-auto px-5 py-8 flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <Clock className="mx-auto h-12 w-12 text-amber mb-4" />
              <CardTitle className="text-xl text-amber">
                {t("sign.expired.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-muted-foreground">{t("sign.expired.message")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("sign.expired.instruction")}
                </p>
              </div>
              <div className="bg-amber-soft border rounded-md p-3">
                <p className="text-sm text-amber text-center font-medium">
                  {publicationData.name}
                </p>
                {publicationData.expires_at && (
                  <p className="text-xs text-amber text-center mt-1">
                    {t("sign.expired.date")}{" "}
                    {formatExpiryDate(publicationData.expires_at, language)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show password verification screen (gate) if password is required and not verified
  if (!isPasswordVerified) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SignHeader />
        <div className="max-w-md mx-auto px-5 py-8 flex flex-col gap-6">
          <p className="text-xs text-muted-foreground">{sentByLine}</p>
          <h1 className="text-2xl font-bold -mt-4">{publicationData.name}</h1>
          <p className="text-sm text-muted-foreground -mt-4">{summaryLine}</p>

          <Card>
            <CardHeader className="text-center">
              <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="text-xl">
                {t("sign.password.title")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("sign.password.description")}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-password">
                  {t("register.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="document-password"
                    name="document-password"
                    errors={[]}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={t("sign.password.placeholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handlePasswordSubmit();
                      }
                    }}
                    className="h-12 pr-10"
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
              <Button
                className="w-full h-12"
                size="lg"
                onClick={handlePasswordSubmit}
                disabled={isVerifyingPassword || !password.trim()}
              >
                {isVerifyingPassword ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    {t("sign.password.verifying")}
                  </>
                ) : (
                  t("sign.password.verify")
                )}
              </Button>
              {error && (
                <p className="text-destructive text-sm text-center">{error}</p>
              )}
              <p className="text-xs text-muted-foreground text-center">
                {t("sign.password.help")}
              </p>
            </CardContent>
          </Card>

          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("sign.password.trustNote")}
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href="/term" className="underline hover:text-foreground">
                {t("sign.password.terms")}
              </Link>
              <span className="mx-1.5">·</span>
              <Link href="/privacy" className="underline hover:text-foreground">
                {t("sign.password.privacy")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show document list
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SignHeader />
      <div className="max-w-lg mx-auto px-5 py-8 flex flex-col gap-6 w-full">
        {/* 보낸 사람 · 요청 요약 */}
        <div className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{sentByLine}</p>
            <h1 className="mt-0.5 text-xl font-bold truncate">{publicationData.name}</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/60 px-2 py-2.5">
              <p className="text-[11px] text-muted-foreground">{t("sign.documentList.stat.documents")}</p>
              <p className="mt-1 text-lg font-bold tabular-nums leading-none">{documentCount}</p>
            </div>
            <div className="rounded-lg bg-muted/60 px-2 py-2.5">
              <p className="text-[11px] text-muted-foreground">{t("sign.documentList.stat.areas")}</p>
              <p className="mt-1 text-lg font-bold tabular-nums leading-none">{areaCount}</p>
            </div>
            <div className="rounded-lg bg-muted/60 px-2 py-2.5">
              <p className="text-[11px] text-muted-foreground">{t("sign.documentList.stat.due")}</p>
              <p className="mt-1 text-lg font-bold tabular-nums leading-none">
                {publicationData.expires_at
                  ? formatExpiryDate(publicationData.expires_at, language)
                  : "—"}
              </p>
            </div>
          </div>
          {(() => {
            const docs = publicationData.documents ?? [];
            const done = docs.filter((d) => d.status === "completed").length;
            const pct = docs.length ? Math.round((done / docs.length) * 100) : 0;
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {done === docs.length && docs.length > 0
                      ? t("sign.documentList.allDone")
                      : t("sign.documentList.description", { count: docs.length - done })}
                  </span>
                  <span className="font-medium tabular-nums">{done}/{docs.length}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })()}
        </div>

        {/* Document List */}
        <div className="flex flex-col gap-3">
          {publicationData.documents?.map((document) => {
            const { completed, total } = getDocumentSignatureStatus(
              document.id
            );
            // Check if document status is completed (submitted and finalized)
            const isDocumentSubmitted = document.status === "completed";
            const pct = total ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={document.id}
                className={`rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 ${
                  isDocumentSubmitted ? "" : "border-primary/30"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                      isDocumentSubmitted ? "bg-seal-soft text-seal" : "bg-primary/10 text-primary"
                    }`}
                  >
                    {isDocumentSubmitted ? <Check className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {documentDisplayLabel(document.alias, document.filename)}
                      </p>
                      {isDocumentSubmitted && <StatusBadge status="completed" />}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 max-w-[220px] rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isDocumentSubmitted ? "bg-seal" : "bg-primary"}`}
                          style={{ width: `${isDocumentSubmitted ? 100 : pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {t("sign.documentList.signaturesCompleted", { completed, total })}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant={isDocumentSubmitted ? "outline" : "default"}
                  className="w-full sm:w-auto"
                  disabled={isDocumentSubmitted}
                  onClick={() => onSelectDocument(document.id)}
                >
                  {isDocumentSubmitted
                    ? t("sign.documentList.view")
                    : t("sign.documentList.sign")}
                </Button>
              </div>
            );
          })}
        </div>

        {publicationData.documents?.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t("publicationDetail.noDocuments")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
