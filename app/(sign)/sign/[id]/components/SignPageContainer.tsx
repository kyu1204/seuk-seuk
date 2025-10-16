"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicationWithDocuments } from "@/lib/supabase/database.types";
import SignDocumentList from "./SignDocumentList";
import SignSingleDocument from "./SignSingleDocument";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileSignature, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";
import Link from "next/link";

interface SignPageContainerProps {
  publicationData: PublicationWithDocuments;
  requiresPassword: boolean;
}

type View = "list" | "document" | "completed";

export default function SignPageContainer({
  publicationData,
  requiresPassword,
}: SignPageContainerProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<View>("list");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [completedDocumentName, setCompletedDocumentName] = useState<string>("");
  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(!requiresPassword);

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

  const handlePasswordVerified = () => {
    setIsPasswordVerified(true);
  };

  const handleDocumentComplete = (documentName: string) => {
    setCompletedDocumentName(documentName);
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
        isPasswordVerified={isPasswordVerified}
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
        onBack={handleBackToList}
        onComplete={handleDocumentComplete}
      />
    );
  }

  // Show document completion view
  if (currentView === "completed") {
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
                    {completedDocumentName}
                  </p>
                  <p className="text-xs text-green-600 text-center mt-1">
                    {t("sign.completed.status")}
                  </p>
                </div>
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
