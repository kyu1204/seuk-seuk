"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getSignedDocumentUrlForSigner } from "@/app/actions/document-actions";

interface SignedDocumentDownloadButtonProps {
  shortUrl: string;
  documentId: string;
  password?: string | null;
}

export default function SignedDocumentDownloadButton({
  shortUrl,
  documentId,
  password,
}: SignedDocumentDownloadButtonProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSignedDocumentUrlForSigner(
        shortUrl,
        documentId,
        password
      );

      if (result.error || !result.downloadUrl) {
        setError(t("sign.completed.downloadError"));
        return;
      }

      // The signed URL already carries a download content-disposition.
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError(t("sign.completed.downloadError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleDownload} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("sign.completed.downloadLoading")}
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {t("sign.completed.download")}
          </>
        )}
      </Button>
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
