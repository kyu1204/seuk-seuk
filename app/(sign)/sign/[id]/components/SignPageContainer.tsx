"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicationWithDocuments } from "@/lib/supabase/database.types";
import SignDocumentList from "./SignDocumentList";
import SignSingleDocument from "./SignSingleDocument";
import SignedDocumentDownloadButton from "./SignedDocumentDownloadButton";
import SignComplete from "./SignComplete";
import SignHeader from "./SignHeader";
import { documentDisplayLabel } from "@/lib/utils";

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
    const completedDocument = publicationData.documents?.find(
      (doc) => doc.id === completedDocumentId
    );
    const signedCount = (completedDocument?.signatures || []).filter(
      (s) => s.signature_data !== null
    ).length;
    const isPublicationCompleted = publicationData.status === "completed";
    const remainingDocuments = (publicationData.documents || [])
      .filter((doc) => doc.id !== completedDocumentId && doc.status !== "completed")
      .map((doc) => {
        const signatures = doc.signatures || [];
        return {
          id: doc.id,
          name: documentDisplayLabel(doc.alias, doc.filename, publicationData.name),
          completed: signatures.filter((s) => s.signature_data !== null).length,
          total: signatures.length,
        };
      });

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SignHeader />
        <SignComplete
          documentName={completedDocumentName}
          signedCount={signedCount}
          downloadButton={
            completedDocumentId ? (
              <SignedDocumentDownloadButton
                shortUrl={publicationData.short_url}
                documentId={completedDocumentId}
                password={verifiedPassword}
              />
            ) : null
          }
          remainingDocuments={remainingDocuments}
          onContinue={handleDocumentSelect}
          onBackToList={handleBackToList}
          ownerNotified={isPublicationCompleted}
        />
      </div>
    );
  }

  // Fallback (shouldn't happen)
  return null;
}
