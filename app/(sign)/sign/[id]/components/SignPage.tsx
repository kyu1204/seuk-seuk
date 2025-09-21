"use client";

import {
  markDocumentCompleted,
  saveSignature,
  uploadSignedDocument,
  verifyDocumentPassword,
} from "@/app/actions/document-actions";
import LanguageSelector from "@/components/language-selector";
import SignatureModal from "@/components/signature-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import type { ClientDocument, Signature } from "@/lib/supabase/database.types";
import {
  CheckCircle,
  Clock,
  FileSignature,
  Lock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface SignPageComponentProps {
  documentData: ClientDocument;
  signatures: Signature[];
  isExpired?: boolean;
  isCompleted?: boolean;
}

export default function SignPageComponent({
  documentData,
  signatures,
  isExpired = false,
  isCompleted = false,
}: SignPageComponentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [localSignatures, setLocalSignatures] =
    useState<Signature[]>(signatures);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(
    !documentData.requiresPassword
  );
  const [isVerifyingPassword, setIsVerifyingPassword] =
    useState<boolean>(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  const handleAreaClick = (index: number) => {
    setSelectedArea(index);
    setIsModalOpen(true);
  };

  const handleSignatureComplete = async (signatureData: string) => {
    if (selectedArea === null) return;

    setIsSaving(true);
    setError(null);

    try {
      // Save signature to database
      const result = await saveSignature(
        documentData.id,
        selectedArea,
        signatureData
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      // Update local state
      const existingIndex = localSignatures.findIndex(
        (s) => s.area_index === selectedArea
      );
      if (existingIndex >= 0) {
        // Update existing signature
        const updatedSignatures = [...localSignatures];
        updatedSignatures[existingIndex] = {
          ...updatedSignatures[existingIndex],
          signature_data: signatureData,
        };
        setLocalSignatures(updatedSignatures);
      } else {
        // Add new signature
        const newSignature: Signature = {
          id: `temp-${Date.now()}`, // Temporary ID
          document_id: documentData.id,
          area_index: selectedArea,
          signature_data: signatureData,
          created_at: new Date().toISOString(),
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          status: "pending",
          signer_name: null,
          signed_at: null,
        };
        setLocalSignatures([...localSignatures, newSignature]);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving signature:", error);
      setError("Failed to save signature");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateDocument = async () => {
    if (!documentData || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Get the current document container dimensions
      if (!documentContainerRef.current) {
        throw new Error("Document container not found");
      }

      const docImage = documentContainerRef.current.querySelector("img");
      if (!docImage) {
        throw new Error("Document image not found");
      }

      // Get the natural dimensions of the document image
      const naturalWidth = (docImage as HTMLImageElement).naturalWidth;
      const naturalHeight = (docImage as HTMLImageElement).naturalHeight;

      // Get the displayed dimensions
      const displayedWidth = docImage.clientWidth;
      const displayedHeight = docImage.clientHeight;

      // Calculate the scale ratio between natural and displayed size
      const scaleX = naturalWidth / displayedWidth;
      const scaleY = naturalHeight / displayedHeight;

      // Create a new image element with the original document
      const originalImage = new Image();
      originalImage.crossOrigin = "anonymous";

      // Wait for the original image to load
      await new Promise((resolve, reject) => {
        originalImage.onload = resolve;
        originalImage.onerror = reject;
        originalImage.src = documentData.file_url;
      });

      // Create a canvas with the original image dimensions
      const canvas = document.createElement("canvas");
      canvas.width = originalImage.naturalWidth;
      canvas.height = originalImage.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // Draw the original document
      ctx.drawImage(originalImage, 0, 0);

      // Draw each signature at the correct position
      for (const signature of localSignatures) {
        if (!signature.signature_data) continue;

        // Create a new image for the signature
        const signatureImage = new Image();
        signatureImage.crossOrigin = "anonymous";

        // Wait for the signature image to load
        await new Promise((resolve, reject) => {
          signatureImage.onload = resolve;
          signatureImage.onerror = reject;
          signatureImage.src = signature.signature_data!;
        });

        // Calculate the actual position and size in the original image
        const actualX = Number(signature.x) * scaleX;
        const actualY = Number(signature.y) * scaleY;
        const actualWidth = Number(signature.width) * scaleX;
        const actualHeight = Number(signature.height) * scaleY;

        // Calculate the signature's aspect ratio
        const signatureAspectRatio =
          signatureImage.width / signatureImage.height;

        // Calculate dimensions that maintain the signature's aspect ratio
        // while fitting within the designated area
        let drawWidth,
          drawHeight,
          offsetX = 0,
          offsetY = 0;

        const areaAspectRatio = actualWidth / actualHeight;

        if (signatureAspectRatio > areaAspectRatio) {
          // Signature is wider than the area (relative to height)
          drawWidth = actualWidth;
          drawHeight = drawWidth / signatureAspectRatio;
          offsetY = (actualHeight - drawHeight) / 2; // Center vertically
        } else {
          // Signature is taller than the area (relative to width)
          drawHeight = actualHeight;
          drawWidth = drawHeight * signatureAspectRatio;
          offsetX = (actualWidth - drawWidth) / 2; // Center horizontally
        }

        // Draw the signature at the correct position and size, maintaining aspect ratio
        ctx.drawImage(
          signatureImage,
          actualX + offsetX,
          actualY + offsetY,
          drawWidth,
          drawHeight
        );
      }

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png");

      // Upload signed document to Supabase Storage
      const uploadResult = await uploadSignedDocument(documentData.id, dataUrl);

      if (uploadResult.error) {
        setError(uploadResult.error);
        return;
      }

      // Mark document as completed
      await markDocumentCompleted(documentData.id);

      // Navigate to completion page
      router.push(`/sign/${documentData.id}/completed`);
    } catch (err) {
      console.error("Error generating signed document:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate signed document"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const allAreasSigned =
    localSignatures.length > 0 &&
    localSignatures.every((s) => s.signature_data !== null);

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError(t("sign.password.required"));
      return;
    }

    setIsVerifyingPassword(true);
    setError(null);

    try {
      const result = await verifyDocumentPassword(
        documentData.short_url,
        password
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.isValid) {
        setIsPasswordVerified(true);
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

  // Show completed document screen if document is completed
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
                  <p className="text-gray-600">
                    {t("sign.completed.message")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("sign.completed.noEdit")}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-700 text-center font-medium">
                    {documentData.filename}
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

  // Show expired document screen if document is expired
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
                <p className="text-gray-600">
                  {t("sign.expired.message")}
                </p>
                <p className="text-sm text-gray-500">
                  {t("sign.expired.instruction")}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700 text-center font-medium">
                  {documentData.filename}
                </p>
                {documentData.expires_at && (
                  <p className="text-xs text-red-600 text-center mt-1">
                    {t("sign.expired.date")}{" "}
                    {new Date(documentData.expires_at).toLocaleDateString(
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
              <CardTitle className="text-xl">{t("sign.password.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                {t("sign.password.description")}
                <br />
                {t("sign.password.instruction")}
              </p>
              <div className="space-y-2">
                <Label htmlFor="document-password">{t("register.password")}</Label>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="flex items-center gap-2">
          <FileSignature className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl">{t("app.title")}</span>
        </Link>
        <LanguageSelector />
      </div>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{documentData.filename}</h1>
          <p className="text-muted-foreground">{t("sign.clickAreas")}</p>
        </div>

        <div className="relative border rounded-lg mb-6">
          <div ref={documentContainerRef} className="relative">
            <img
              src={documentData.file_url}
              alt="Document"
              className="w-full h-auto object-contain"
              draggable="false"
              style={{ userSelect: "none" }}
            />

            {localSignatures.map((signature, index) => {
              const isSigned = signature.signature_data !== null;

              return (
                <div
                  key={index}
                  className={`absolute cursor-pointer ${
                    isSigned
                      ? "border-green-500 bg-green-500/10"
                      : "border-2 border-red-500 bg-red-500/10 animate-pulse"
                  }`}
                  style={{
                    left: `${signature.x}px`,
                    top: `${signature.y}px`,
                    width: `${signature.width}px`,
                    height: `${signature.height}px`,
                  }}
                  onClick={() => handleAreaClick(signature.area_index)}
                >
                  {isSigned ? (
                    <div className="w-full h-full relative">
                      <img
                        src={signature.signature_data!}
                        alt="Signature"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">
                        {t("sign.clickToSign")}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleGenerateDocument}
            disabled={!allAreasSigned || isGenerating}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("sign.generating")}
              </>
            ) : (
              t("sign.saveDocument")
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
      </div>

      {isModalOpen && selectedArea !== null && (
        <SignatureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleSignatureComplete}
          existingSignature={
            localSignatures.find((s) => s.area_index === selectedArea)
              ?.signature_data!
          }
        />
      )}

      {/* Loading indicator for signature saving */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>{t("sign.savingSignature")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
