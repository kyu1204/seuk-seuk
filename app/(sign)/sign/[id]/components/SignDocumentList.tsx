"use client";

import { verifyPublicationPassword } from "@/app/actions/publication-actions";
import LanguageSelector from "@/components/language-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import type { PublicationWithDocuments } from "@/lib/supabase/database.types";
import {
  CheckCircle,
  ChevronRight,
  Clock,
  FileSignature,
  FileText,
  Lock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SignDocumentListProps {
  publicationData: PublicationWithDocuments;
  requiresPassword: boolean;
  isPasswordVerified: boolean;
  onPasswordVerified: () => void;
  onSelectDocument: (documentId: string) => void;
}

export default function SignDocumentList({
  publicationData,
  requiresPassword,
  isPasswordVerified,
  onPasswordVerified,
  onSelectDocument,
}: SignDocumentListProps) {
  const { t } = useLanguage();
  const [password, setPassword] = useState<string>("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if publication is expired or completed
  const isExpired = publicationData.expires_at
    ? new Date(publicationData.expires_at) < new Date()
    : false;
  const isCompleted = publicationData.status === "completed";

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
        setError(result.error);
        return;
      }

      if (result.isValid) {
        onPasswordVerified();
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

  // Show completed document screen if publication is completed
  if (isCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header with logo */}
        <header className="w-full">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2">
                <FileSignature className="h-8 w-8 text-primary" />
                <span className="font-bold text-xl">{t("app.title")}</span>
              </Link>
              <LanguageSelector />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="container mx-auto px-4 py-8 flex-1">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <CardTitle className="text-xl text-green-600">
                  {t("sign.completed.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-gray-600">{t("sign.completed.message")}</p>
                  <p className="text-sm text-gray-500">
                    {t("sign.completed.noEdit")}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-700 text-center font-medium">
                    {publicationData.name}
                  </p>
                  <p className="text-xs text-green-600 text-center mt-1">
                    {t("sign.completed.status")}
                  </p>
                </div>
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">{t("app.title")}</span>
          </Link>
          <LanguageSelector />
        </div>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Clock className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <CardTitle className="text-xl text-red-600">
                {t("sign.expired.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-gray-600">{t("sign.expired.message")}</p>
                <p className="text-sm text-gray-500">
                  {t("sign.expired.instruction")}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700 text-center font-medium">
                  {publicationData.name}
                </p>
                {publicationData.expires_at && (
                  <p className="text-xs text-red-600 text-center mt-1">
                    {t("sign.expired.date")}{" "}
                    {new Date(publicationData.expires_at).toLocaleDateString(
                      "ko-KR"
                    )}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show password verification screen if password is required and not verified
  if (!isPasswordVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
          <Link href="/" className="flex items-center gap-2">
            <FileSignature className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">{t("app.title")}</span>
          </Link>
          <LanguageSelector />
        </div>
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <CardTitle className="text-xl">
                {t("sign.password.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                {t("sign.password.description")}
                <br />
                {t("sign.password.instruction")}
              </p>
              <div className="space-y-2">
                <Label htmlFor="document-password">
                  {t("register.password")}
                </Label>
                <Input
                  id="document-password"
                  name="document-password"
                  errors={[]}
                  type="password"
                  placeholder={t("sign.password.placeholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handlePasswordSubmit();
                    }
                  }}
                />
              </div>
              <Button
                className="w-full"
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm text-center">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show document list
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="flex items-center gap-2">
          <FileSignature className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">{t("app.title")}</span>
        </Link>
        <LanguageSelector />
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {publicationData.name}
          </h1>
          <p className="text-muted-foreground">
            {t("sign.documentList.description")}
          </p>
        </div>

        {/* Document List */}
        <div className="space-y-4">
          {publicationData.documents?.map((document) => {
            const { completed, total } = getDocumentSignatureStatus(
              document.id
            );
            const isDocumentComplete = total > 0 && completed === total;
            // Check if document status is completed (submitted and finalized)
            const isDocumentSubmitted = document.status === "completed";

            return (
              <Card
                key={document.id}
                className={`transition-shadow ${
                  isDocumentSubmitted
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:shadow-md cursor-pointer"
                }`}
                onClick={() => {
                  if (!isDocumentSubmitted) {
                    onSelectDocument(document.id);
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg mb-1 truncate">
                          {document.alias || document.filename}
                        </h3>
                        <div className="flex items-center gap-2">
                          {isDocumentSubmitted ? (
                            <Badge
                              variant="default"
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("sign.documentList.submitted")}
                            </Badge>
                          ) : isDocumentComplete ? (
                            <Badge
                              variant="default"
                              className="bg-amber-500 hover:bg-amber-600"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("sign.documentList.readyToSubmit")}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              {t("sign.documentList.signaturesCompleted")
                                .replace("{{completed}}", completed.toString())
                                .replace("{{total}}", total.toString())}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!isDocumentSubmitted && (
                      <div className="flex items-center justify-end sm:justify-start">
                        <Button variant="outline" size="sm">
                          {isDocumentComplete
                            ? t("sign.documentList.submitDocument")
                            : completed > 0
                              ? t("sign.documentList.continueSign")
                              : t("sign.documentList.startSigning")}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
