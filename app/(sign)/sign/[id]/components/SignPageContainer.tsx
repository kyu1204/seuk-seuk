"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicationWithDocuments } from "@/lib/supabase/database.types";
import SignDocumentList from "./SignDocumentList";
import SignSingleDocument from "./SignSingleDocument";
import SignedDocumentDownloadButton from "./SignedDocumentDownloadButton";
import SignHeader from "./SignHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

interface SignPageContainerProps {
  publicationData: PublicationWithDocuments;
  requiresPassword: boolean;
  senderName: string;
}

type View = "list" | "document" | "completed";

export default function SignPageContainer({
  publicationData,
  requiresPassword,
  senderName,
}: SignPageContainerProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [completedDocumentName, setCompletedDocumentName] = useState<string>("");
  const [completedDocumentId, setCompletedDocumentId] = useState<string | null>(null);
  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(!requiresPassword);
  const [verifiedPassword, setVerifiedPassword] = useState<string | null>(null);

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocumentId(documentId);
    setCurrentView("document");
  };

  const handleBackToList = () => {
    // Refresh server data to get updated signature counts
    router.refresh();
    setCurrentView("list");
    setSelectedDocumentId(null);
  };

  const handlePasswordVerified = (password: string) => {
    setIsPasswordVerified(true);
    setVerifiedPassword(password);
  };

  const handleDocumentComplete = (documentName: string, documentId: string) => {
    setCompletedDocumentName(documentName);
    setCompletedDocumentId(documentId);
    setCurrentView("completed");
    // Refresh data immediately to get updated publication status
    router.refresh();
  };

  // Show document list view
  if (currentView === "list") {
    return (
      <SignDocumentList
        publicationData={publicationData}
        requiresPassword={requiresPassword}
        senderName={senderName}
        isPasswordVerified={isPasswordVerified}
        verifiedPassword={verifiedPassword}
        onPasswordVerified={handlePasswordVerified}
        onSelectDocument={handleDocumentSelect}
      />
    );
  }

  // Show single document view
  if (currentView === "document" && selectedDocumentId) {
    const selectedDocument = publicationData.documents?.find(
      (doc) => doc.id === selectedDocumentId
    );

    if (!selectedDocument) {
      // Document not found, go back to list
      setCurrentView("list");
      return null;
    }

    return (
      <SignSingleDocument
        publicationData={publicationData}
        documentData={selectedDocument}
        requiresPassword={requiresPassword}
        isPasswordVerified={isPasswordVerified}
        verifiedPassword={verifiedPassword}
        onBack={handleBackToList}
        onComplete={handleDocumentComplete}
      />
    );
  }

  // Show document completion view
  if (currentView === "completed") {
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
                  {t("sign.complete.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">{t("sign.complete.description")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("sign.completed.noEdit")}
                  </p>
                </div>
                <div className="bg-seal-soft border rounded-md p-3">
                  <p className="text-sm text-seal text-center font-medium">
                    {completedDocumentName}
                  </p>
                  <p className="text-xs text-seal text-center mt-1">
                    {t("sign.completed.status")}
                  </p>
                </div>
                {completedDocumentId && (
                  <SignedDocumentDownloadButton
                    shortUrl={publicationData.short_url}
                    documentId={completedDocumentId}
                    password={verifiedPassword}
                  />
                )}
                {/* Hide back button if publication is already completed */}
                {publicationData.status !== "completed" && (
                  <Button
                    variant="outline"
                    onClick={handleBackToList}
                    className="w-full"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("sign.documentList.backToList")}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Fallback (shouldn't happen)
  return null;
}
