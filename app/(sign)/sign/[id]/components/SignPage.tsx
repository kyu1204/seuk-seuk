"use client";

import {
  saveSignature,
  uploadSignedDocument,
  getDocumentFileSignedUrl,
} from "@/app/actions/document-actions";
import {
  verifyPublicationPassword,
} from "@/app/actions/publication-actions";
import LanguageSelector from "@/components/language-selector";
import SignatureModal from "@/components/signature-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import type { ClientDocument, Signature, PublicationWithDocuments } from "@/lib/supabase/database.types";
import {
  getImageNaturalDimensions,
  ensureRelativeCoordinate,
  convertSignatureAreaToPixels,
  type RelativeSignatureArea,
} from "@/lib/utils";
import {
  CheckCircle,
  Clock,
  FileSignature,
  Lock,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

interface SignPageComponentProps {
  publicationData: PublicationWithDocuments;
  requiresPassword: boolean;
}

// TODO: In the future, this component should support displaying and signing multiple documents
// For now, we'll use the first document from the publication as MVP

export default function SignPageComponent({
  publicationData,
  requiresPassword,
}: SignPageComponentProps) {
  const { t } = useLanguage();
  const router = useRouter();

  // Extract first document from publication (MVP approach)
  const documentData = publicationData.documents?.[0];
  if (!documentData) {
    throw new Error("Publication has no documents");
  }

  // Get signatures for this document
  const documentSignatures = publicationData.documents
    .find(doc => doc.id === documentData.id)
    ?.signatures || [];

  const [localSignatures, setLocalSignatures] =
    useState<Signature[]>(documentSignatures);

  // Check if publication is expired or completed
  const isExpired = publicationData.expires_at
    ? new Date(publicationData.expires_at) < new Date()
    : false;
  const isCompleted = publicationData.status === "completed";
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingProgress, setGeneratingProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [isPasswordVerified, setIsPasswordVerified] = useState<boolean>(
    !requiresPassword
  );
  const [isVerifyingPassword, setIsVerifyingPassword] =
    useState<boolean>(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [documentSignedUrl, setDocumentSignedUrl] = useState<string | null>(null);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState<boolean>(false);

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
    setGeneratingProgress("문서 처리 준비 중...");

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

      // 🚀 Performance optimization: Set maximum canvas dimensions
      const MAX_DIMENSION = 2000; // Maximum width/height for performance
      let canvasWidth = naturalWidth;
      let canvasHeight = naturalHeight;
      let downscaleRatio = 1;

      // Downscale if image is too large
      if (canvasWidth > MAX_DIMENSION || canvasHeight > MAX_DIMENSION) {
        const aspectRatio = canvasWidth / canvasHeight;
        if (canvasWidth > canvasHeight) {
          canvasWidth = MAX_DIMENSION;
          canvasHeight = MAX_DIMENSION / aspectRatio;
        } else {
          canvasHeight = MAX_DIMENSION;
          canvasWidth = MAX_DIMENSION * aspectRatio;
        }
        downscaleRatio = canvasWidth / naturalWidth;
      }

      // Create a new image element with the original document
      setGeneratingProgress("원본 문서 로딩 중...");
      const originalImage = new Image();
      originalImage.crossOrigin = "anonymous";

      // Wait for the original image to load
      await new Promise((resolve, reject) => {
        originalImage.onload = resolve;
        originalImage.onerror = reject;
        originalImage.src = documentSignedUrl || documentData.file_url;
      });

      // 🚀 Performance optimization: Preload all signature images in parallel
      setGeneratingProgress("서명 이미지 처리 중...");

      const signatureImages = await Promise.all(
        localSignatures
          .filter(sig => sig.signature_data)
          .map((signature, index) => {
            return new Promise<{ signature: typeof signature; image: HTMLImageElement }>((resolve, reject) => {
              const signatureImage = new Image();
              signatureImage.crossOrigin = "anonymous";
              signatureImage.onload = () => {
                resolve({ signature, image: signatureImage });
              };
              signatureImage.onerror = (err) => {
                console.error(`❌ Failed to load signature image ${index}:`, err);
                reject(err);
              };
              signatureImage.src = signature.signature_data!;
            });
          })
      );


      // Create a canvas with optimized dimensions
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext("2d", {
        alpha: false, // Disable alpha for better performance
        willReadFrequently: false
      });

      if (!ctx) {
        throw new Error("Could not get canvas context");
      }

      // 🚀 Performance optimization: Set image smoothing for better quality when downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the original document with downscaling
      setGeneratingProgress("문서 합성 중...");
      ctx.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);

      // Draw each signature at the correct position
      for (const { signature, image: signatureImage } of signatureImages) {
        // Convert signature coordinates to absolute pixels based on original image size
        let pixelCoords;
        try {
          const relativeArea = ensureRelativeCoordinate(signature, naturalWidth, naturalHeight);
          pixelCoords = convertSignatureAreaToPixels(relativeArea, naturalWidth, naturalHeight);
        } catch (error) {
          console.warn('Failed to convert signature coordinates, using as-is:', error);
          pixelCoords = {
            x: Number(signature.x),
            y: Number(signature.y),
            width: Number(signature.width),
            height: Number(signature.height),
          };
        }

        // Calculate the actual position and size with downscaling
        // pixelCoords are already in original image coordinates, only apply downscale ratio
        const actualX = pixelCoords.x * downscaleRatio;
        const actualY = pixelCoords.y * downscaleRatio;
        const actualWidth = pixelCoords.width * downscaleRatio;
        const actualHeight = pixelCoords.height * downscaleRatio;


        // Calculate the signature's aspect ratio
        const signatureAspectRatio = signatureImage.width / signatureImage.height;

        // Calculate dimensions that maintain the signature's aspect ratio
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        const areaAspectRatio = actualWidth / actualHeight;

        if (signatureAspectRatio > areaAspectRatio) {
          drawWidth = actualWidth;
          drawHeight = drawWidth / signatureAspectRatio;
          offsetY = (actualHeight - drawHeight) / 2;
        } else {
          drawHeight = actualHeight;
          drawWidth = drawHeight * signatureAspectRatio;
          offsetX = (actualWidth - drawWidth) / 2;
        }

        // Draw the signature
        ctx.drawImage(
          signatureImage,
          actualX + offsetX,
          actualY + offsetY,
          drawWidth,
          drawHeight
        );
      }

      // 🚀 Performance optimization: Use optimized compression
      setGeneratingProgress("이미지 압축 중...");
      let blob: Blob;
      if ('toBlob' in canvas) {
        // Use toBlob for better performance and memory management
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) resolve(result);
            else reject(new Error('Failed to create blob'));
          }, 'image/png'); // Generate PNG to match storage configuration
        });
      } else {
        // Fallback to toDataURL
        const dataUrl = canvas.toDataURL("image/png");
        const response = await fetch(dataUrl);
        blob = await response.blob();
      }

      // Convert blob to data URL for upload
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Upload signed document to Supabase Storage
      setGeneratingProgress("서명된 문서 업로드 중...");
      const uploadResult = await uploadSignedDocument(documentData.id, dataUrl);

      if (!uploadResult || uploadResult.error) {
        setError(uploadResult?.error ?? "Failed to upload signed document");
        return;
      }

      // TODO: Check if all documents in publication are signed and mark publication as completed
      // For MVP, we're only handling the first document, so we can mark it complete immediately
      setGeneratingProgress("문서 완료 처리 중...");

      // Navigate to completion page using publication short_url
      setIsNavigating(true);
      router.push(`/sign/${publicationData.short_url}/completed`);
    } catch (err) {
      console.error("Error generating signed document:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate signed document"
      );
      setIsGenerating(false);
      setGeneratingProgress("");
    }
  };

  const allAreasSigned =
    localSignatures.length > 0 &&
    localSignatures.every((s) => s.signature_data !== null);

  // Touch gesture helpers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    const x = (touches[0].clientX + touches[1].clientX) / 2;
    const y = (touches[0].clientY + touches[1].clientY) / 2;
    return { x, y };
  };

  // Touch event handlers for document viewing
  const handleDocumentTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - check for double tap
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime;

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected - toggle zoom
        e.preventDefault();
        if (zoomLevel === 1) {
          setZoomLevel(2);
        } else {
          setZoomLevel(1);
        }
        return;
      }
      setLastTapTime(currentTime);

      // Allow dragging when content overflows container
      const container = documentContainerRef.current;
      const canScroll = container && (
        container.scrollWidth > container.clientWidth ||
        container.scrollHeight > container.clientHeight
      );

      if (canScroll) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setTouchStartZoom(zoomLevel);
      setIsDragging(false);
    }
  };

  const handleDocumentTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && documentContainerRef.current) {
      // Single touch panning
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;

      documentContainerRef.current.scrollLeft -= deltaX;
      documentContainerRef.current.scrollTop -= deltaY;

      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.min(Math.max(touchStartZoom * scale, 0.5), 3);
        setZoomLevel(newZoom);
      }
    }
  };

  const handleDocumentTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
      setLastTouchDistance(0);
    } else if (e.touches.length === 1) {
      // Switch from pinch to pan
      setLastTouchDistance(0);
      setTouchStartZoom(zoomLevel);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging when content overflows container
    const container = documentContainerRef.current;
    const canScroll = container && (
      container.scrollWidth > container.clientWidth ||
      container.scrollHeight > container.clientHeight
    );

    if (canScroll) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && documentContainerRef.current) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      documentContainerRef.current.scrollLeft -= deltaX;
      documentContainerRef.current.scrollTop -= deltaY;

      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const loadDocumentSignedUrl = async () => {
    setIsLoadingSignedUrl(true);
    try {
      const result = await getDocumentFileSignedUrl(documentData.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      setDocumentSignedUrl(result.signedUrl);
    } catch (err) {
      console.error("Failed to load signed URL:", err);
      setError("Failed to load document");
    } finally {
      setIsLoadingSignedUrl(false);
    }
  };

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
        setIsPasswordVerified(true);
        // Load signed URL after password verification
        await loadDocumentSignedUrl();
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

  // Load signed URL on component mount for non-password publications
  useEffect(() => {
    if (!requiresPassword && !documentSignedUrl) {
      loadDocumentSignedUrl();
    }
  }, [requiresPassword, documentSignedUrl]);

  // Force re-render when image loads to ensure signature areas display correctly
  useEffect(() => {
    if (imageLoaded && documentContainerRef.current) {
      // Trigger a small state update to force re-render
      const timer = setTimeout(() => {
        setLocalSignatures(prev => [...prev]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);

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
                  <p className="text-gray-600">{t("sign.completed.message")}</p>
                  <p className="text-sm text-gray-500">
                    {t("sign.completed.noEdit")}
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-700 text-center font-medium">
                    {documentData.alias || documentData.filename}
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
                <p className="text-gray-600">{t("sign.expired.message")}</p>
                <p className="text-sm text-gray-500">
                  {t("sign.expired.instruction")}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700 text-center font-medium">
                  {documentData.alias || documentData.filename}
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
          <h1 className="text-3xl font-bold mb-2">{documentData.alias || documentData.filename}</h1>
          <p className="text-muted-foreground">{t("sign.clickAreas")}</p>
        </div>

        <div className="relative border rounded-lg mb-6">
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              className="p-2 h-8 w-8"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="p-2 h-8 w-8"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomReset}
              disabled={zoomLevel === 1}
              className="p-2 h-8 w-8"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="text-xs text-center font-medium px-1 py-0.5 bg-gray-100 rounded">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>
          <div
            ref={documentContainerRef}
            className="relative overflow-auto max-h-[70vh]"
            style={{
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleDocumentTouchStart}
            onTouchMove={handleDocumentTouchMove}
            onTouchEnd={handleDocumentTouchEnd}
          >
            <div
              className="relative inline-block"
              style={{
                width: `${100 * zoomLevel}%`,
                height: 'auto'
              }}
            >
              <img
                src={documentSignedUrl || documentData.file_url}
                alt="Document"
                className="w-full h-auto object-contain block"
                draggable="false"
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(false)}
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
                  style={(() => {
                    // Convert to relative coordinates for display
                    try {
                      if (!documentContainerRef.current) {
                        return {
                          left: `${signature.x}px`,
                          top: `${signature.y}px`,
                          width: `${signature.width}px`,
                          height: `${signature.height}px`,
                        };
                      }

                      // Get the image element and check if it's loaded
                      const imgElement = documentContainerRef.current.querySelector('img') as HTMLImageElement;
                      if (!imgElement || imgElement.naturalWidth === 0 || imgElement.naturalHeight === 0) {
                        // Image not loaded yet, return pixel coordinates as fallback
                        return {
                          left: `${signature.x}px`,
                          top: `${signature.y}px`,
                          width: `${signature.width}px`,
                          height: `${signature.height}px`,
                        };
                      }

                      const { width: originalWidth, height: originalHeight } = getImageNaturalDimensions(documentContainerRef.current);
                      const relativeArea = ensureRelativeCoordinate(signature, originalWidth, originalHeight);
                      return {
                        left: `${relativeArea.x}%`,
                        top: `${relativeArea.y}%`,
                        width: `${relativeArea.width}%`,
                        height: `${relativeArea.height}%`,
                      };
                    } catch (error) {
                      console.warn('Failed to convert signature coordinates:', error);
                      // Fallback to pixel coordinates
                      return {
                        left: `${signature.x}px`,
                        top: `${signature.y}px`,
                        width: `${signature.width}px`,
                        height: `${signature.height}px`,
                      };
                    }
                  })()}
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
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleGenerateDocument}
            disabled={!allAreasSigned || isGenerating || isNavigating}
          >
            {isGenerating || isNavigating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {isNavigating ? "페이지 이동 중..." : (generatingProgress || t("sign.generating"))}
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
