"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getSignedDocumentBundleForSigner } from "@/app/actions/document-actions";

interface SignedDocumentBundleButtonProps {
  shortUrl: string;
  password?: string | null;
}

function triggerDownload(href: string, downloadName?: string) {
  const link = document.createElement("a");
  link.href = href;
  if (downloadName) link.download = downloadName;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function SignedDocumentBundleButton({
  shortUrl,
  password,
}: SignedDocumentBundleButtonProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getSignedDocumentBundleForSigner(shortUrl, password);

      if (result.error) {
        setError(t("sign.completed.downloadError"));
        return;
      }

      // Single document: direct signed URL (carries download disposition)
      if (result.downloadUrl) {
        triggerDownload(result.downloadUrl);
        return;
      }

      // Multiple documents: zip archive delivered as base64
      if (result.zipBase64) {
        const byteString = atob(result.zipBase64);
        const bytes = new Uint8Array(byteString.length);
        for (let i = 0; i < byteString.length; i++) {
          bytes[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/zip" });
        const objectUrl = URL.createObjectURL(blob);
        triggerDownload(objectUrl, result.filename || "서명문서.zip");
        // Defer revoke so the browser can start reading the blob URL.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        return;
      }

      setError(t("sign.completed.downloadError"));
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
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
