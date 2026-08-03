"use client";

import {
  saveSignature,
  generateSignedPdf,
  generateSignedPdfFromPdf,
  getDocumentFileSignedUrl,
  markDocumentCompleted,
  createSignedDocumentUploadUrl,
} from "@/app/actions/document-actions";
import LanguageSelector from "@/components/language-selector";
import SignedDocumentDownloadButton from "./SignedDocumentDownloadButton";
import SignatureModal from "@/components/signature-modal";
import TextInputModal from "@/components/text-input-modal";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/language-context";
import type { ClientDocument, Signature, PublicationWithDocuments } from "@/lib/supabase/database.types";
import {
  getImageNaturalDimensions,
  ensureRelativeCoordinate,
  convertSignatureAreaToPixels,
  documentDisplayLabel,
  type RelativeSignatureArea,
} from "@/lib/utils";
import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileSignature,
  MapPin,
  PenLine,
  RefreshCw,
  Stamp,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { PdfPageDimensions } from "@/components/pdf-page-renderer";

const PdfPageRenderer = dynamic(() => import("@/components/pdf-page-renderer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-muted/50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
});

interface SignSingleDocumentProps {
  publicationData: PublicationWithDocuments;
  documentData: ClientDocument & { signatures: Signature[] };
  requiresPassword: boolean;
  isPasswordVerified: boolean;
  verifiedPassword?: string | null;
  onBack: () => void;
  onComplete: (documentName: string, documentId: string) => void;
}

export default function SignSingleDocument({
  publicationData,
  documentData,
  requiresPassword,
  isPasswordVerified,
  verifiedPassword,
  onBack,
  onComplete,
}: SignSingleDocumentProps) {
  const { t } = useLanguage();

  // Map a server action result to a localized message. Prefer the stable
  // `errorCode` (mapped via i18n); fall back to the legacy human-readable
  // `error` string for callers that don't yet emit a code.
  const resolveActionError = (result: {
    error?: string;
    errorCode?: string;
  }): string =>
    result.errorCode
      ? t(`sign.gateError.${result.errorCode}`)
      : result.error ?? t("sign.gateError.NOT_FOUND");

  // Get signatures for this document
  const documentSignatures = documentData.signatures || [];

  // Human-friendly document title: alias → publication name → filename w/o ext.
  const documentLabel = documentDisplayLabel(
    documentData.alias,
    documentData.filename,
    publicationData.name
  );

  const [localSignatures, setLocalSignatures] =
    useState<Signature[]>(documentSignatures);

  // Check if publication is expired or completed
  const isExpired = publicationData.expires_at
    ? new Date(publicationData.expires_at) < new Date()
    : false;
  const isPublicationCompleted = publicationData.status === "completed";
  // Check if THIS specific document is completed
  const isDocumentCompleted = documentData.status === "completed";
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedAreaType, setSelectedAreaType] = useState<'signature' | 'text'>('signature');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingProgress, setGeneratingProgress] = useState<string>("");
  const [progressValue, setProgressValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [documentSignedUrl, setDocumentSignedUrl] = useState<string | null>(null);
  // Last drawn signature, kept locally so remaining areas can be batch-signed
  const [lastSignatureData, setLastSignatureData] = useState<string | null>(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState<boolean>(false);
  // Area to visually highlight after "go to next unsigned" navigation
  const [highlightAreaIndex, setHighlightAreaIndex] = useState<number | null>(null);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState<boolean>(false);

  const isPdf = (documentData as any).file_type === 'pdf';
  const totalPages = (documentData as any).page_count || 1;
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1);
  const [pdfPageDimensions, setPdfPageDimensions] = useState<PdfPageDimensions | null>(null);

  const handleAreaClick = (areaIndex: number) => {
    setSelectedArea(areaIndex);
    const clickedSignature = localSignatures.find(s => s.area_index === areaIndex);
    setSelectedAreaType((clickedSignature as any)?.area_type === 'text' ? 'text' : 'signature');
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
        setError(resolveActionError(result));
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
          area_type: 'signature',
          page_number: 0,
          status: "pending",
          signer_name: null,
          signed_at: null,
        };
        setLocalSignatures([...localSignatures, newSignature]);
      }

      if (selectedAreaType === "signature") {
        setLastSignatureData(signatureData);
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
    setProgressValue(0);
    setGeneratingProgress(t("sign.progress.preparing"));

    try {
      if (isPdf) {
        // === PDF Document: Server-side PDF signing ===
        setProgressValue(30);
        setGeneratingProgress(t("sign.progress.compositingPdf"));

        const pdfResult = await generateSignedPdfFromPdf(documentData.id);

        if (!pdfResult || pdfResult.error) {
          setError(pdfResult ? resolveActionError(pdfResult) : "Failed to generate signed PDF");
          setIsGenerating(false);
          setGeneratingProgress("");
          setProgressValue(0);
          return;
        }

        setProgressValue(90);
        setGeneratingProgress(t("sign.progress.finalizing"));

        const markResult = await markDocumentCompleted(documentData.id);

        if (!markResult || markResult.error) {
          setError(markResult ? resolveActionError(markResult) : "Failed to mark document as completed");
          setIsGenerating(false);
          setGeneratingProgress("");
          setProgressValue(0);
          return;
        }

        setProgressValue(100);
        setIsGenerating(false);
        setGeneratingProgress("");
        setProgressValue(0);
        onComplete(documentLabel, documentData.id);
      } else {
        // === Image Document: Existing client-side canvas compositing ===
        setProgressValue(10);
        if (!documentContainerRef.current) {
          throw new Error("Document container not found");
        }

        const docImage = documentContainerRef.current.querySelector("img");
        if (!docImage) {
          throw new Error("Document image not found");
        }

        const naturalWidth = (docImage as HTMLImageElement).naturalWidth;
        const naturalHeight = (docImage as HTMLImageElement).naturalHeight;

        const displayedWidth = docImage.clientWidth;
        const displayedHeight = docImage.clientHeight;

        const scaleX = naturalWidth / displayedWidth;
        const scaleY = naturalHeight / displayedHeight;

        const MAX_DIMENSION = 2000;
        let canvasWidth = naturalWidth;
        let canvasHeight = naturalHeight;
        let downscaleRatio = 1;

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

        setProgressValue(30);
        setGeneratingProgress(t("sign.progress.loadingOriginal"));
        const originalImage = new Image();
        originalImage.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error(t("sign.progress.imageTimeout"))), 30000);
          originalImage.onload = () => { clearTimeout(timeout); resolve(undefined); };
          originalImage.onerror = () => { clearTimeout(timeout); reject(new Error(t("sign.progress.imageLoadFailed"))); };
          originalImage.src = documentSignedUrl || documentData.file_url;
        });

        setProgressValue(50);
        setGeneratingProgress(t("sign.progress.processingSignatures"));

        const signatureImages = await Promise.all(
          localSignatures
            .filter(sig => sig.signature_data)
            .map((signature, index) => {
              return new Promise<{ signature: typeof signature; image: HTMLImageElement }>((resolve, reject) => {
                const signatureImage = new Image();
                signatureImage.crossOrigin = "anonymous";
                signatureImage.onload = () => resolve({ signature, image: signatureImage });
                signatureImage.onerror = (err) => reject(err);
                signatureImage.src = signature.signature_data!;
              });
            })
        );

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: false });

        if (!ctx) throw new Error("Could not get canvas context");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        setProgressValue(60);
        setGeneratingProgress(t("sign.progress.compositing"));
        ctx.drawImage(originalImage, 0, 0, canvasWidth, canvasHeight);

        for (const { signature, image: signatureImage } of signatureImages) {
          let pixelCoords;
          try {
            if (signature.x == null || signature.y == null || signature.width == null || signature.height == null) continue;
            const relativeArea = ensureRelativeCoordinate({
              x: signature.x,
              y: signature.y,
              width: signature.width,
              height: signature.height,
              type: signature.area_type as 'signature' | 'text',
              pageNumber: signature.page_number,
            }, naturalWidth, naturalHeight);
            pixelCoords = convertSignatureAreaToPixels(relativeArea, naturalWidth, naturalHeight);
          } catch (error) {
            pixelCoords = {
              x: Number(signature.x),
              y: Number(signature.y),
              width: Number(signature.width),
              height: Number(signature.height),
            };
          }

          const actualX = pixelCoords.x * downscaleRatio;
          const actualY = pixelCoords.y * downscaleRatio;
          const actualWidth = pixelCoords.width * downscaleRatio;
          const actualHeight = pixelCoords.height * downscaleRatio;

          const signatureAspectRatio = signatureImage.width / signatureImage.height;
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

          ctx.drawImage(signatureImage, actualX + offsetX, actualY + offsetY, drawWidth, drawHeight);
        }

        setProgressValue(70);
        setGeneratingProgress(t("sign.progress.compressing"));
        let blob: Blob;
        if ('toBlob' in canvas) {
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((result) => {
              if (result) resolve(result);
              else reject(new Error('Failed to create blob'));
            }, 'image/png');
          });
        } else {
          const dataUrl = (canvas as HTMLCanvasElement).toDataURL("image/png");
          const response = await fetch(dataUrl);
          blob = await response.blob();
        }

        setProgressValue(80);
        setGeneratingProgress(t("sign.progress.uploading"));

        const uploadUrlResult = await createSignedDocumentUploadUrl(documentData.id);

        if (uploadUrlResult.error || !uploadUrlResult.uploadUrl) {
          setError(uploadUrlResult.error ? resolveActionError(uploadUrlResult) : "Failed to get upload URL");
          setIsGenerating(false);
          setGeneratingProgress("");
          return;
        }

        const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/png' },
        });

        if (!uploadResponse.ok) {
          setError("Failed to upload signed document");
          setIsGenerating(false);
          setGeneratingProgress("");
          return;
        }

        const filePath = uploadUrlResult.filePath!;

        setProgressValue(90);
        setGeneratingProgress(t("sign.progress.generatingPdf"));
        const pdfResult = await generateSignedPdf(documentData.id, filePath);

        if (!pdfResult || pdfResult.error) {
          setError(pdfResult ? resolveActionError(pdfResult) : "Failed to generate PDF");
          setIsGenerating(false);
          setGeneratingProgress("");
          return;
        }

        setProgressValue(95);
        setGeneratingProgress(t("sign.progress.finalizing"));
        const markResult = await markDocumentCompleted(documentData.id);

        if (!markResult || markResult.error) {
          setError(markResult ? resolveActionError(markResult) : "Failed to mark document as completed");
          setIsGenerating(false);
          setGeneratingProgress("");
          return;
        }

        setProgressValue(100);
        setIsGenerating(false);
        setGeneratingProgress("");
        setProgressValue(0);
        onComplete(documentLabel, documentData.id);
      }
    } catch (err) {
      console.error("Error generating signed document:", err);
      setError(err instanceof Error ? err.message : "Failed to generate signed document");
      setIsGenerating(false);
      setGeneratingProgress("");
      setProgressValue(0);
    }
  };

  // Unsigned signature-type areas on the current page (text areas excluded)
  const batchSignTargets = localSignatures.filter(
    (s) =>
      s.signature_data === null &&
      (s as any).area_type !== "text" &&
      (!isPdf || ((s as any).page_number ?? 0) === currentPdfPage - 1)
  );
  const canBatchSign = lastSignatureData !== null && batchSignTargets.length > 0;

  const handleBatchSign = async () => {
    if (!lastSignatureData || batchSignTargets.length === 0 || isSaving) return;

    setIsBatchConfirmOpen(false);
    setIsSaving(true);
    setError(null);

    const signedIndexes: number[] = [];
    try {
      for (const target of batchSignTargets) {
        const result = await saveSignature(
          documentData.id,
          target.area_index,
          lastSignatureData
        );
        if (result.error) {
          setError(resolveActionError(result));
          break;
        }
        signedIndexes.push(target.area_index);
      }
    } catch (error) {
      console.error("Error batch signing:", error);
      setError("Failed to save signature");
    } finally {
      // Reflect areas already persisted server-side even if a later save threw
      if (signedIndexes.length > 0) {
        setLocalSignatures((prev) =>
          prev.map((s) =>
            signedIndexes.includes(s.area_index)
              ? { ...s, signature_data: lastSignatureData }
              : s
          )
        );
      }
      setIsSaving(false);
    }
  };

  // Per-page signature counts for the page status chips (PDF only)
  const pageStatuses = isPdf
    ? Array.from({ length: totalPages }, (_, i) => {
        const areas = localSignatures.filter(
          (s) => ((s as any).page_number ?? 0) === i
        );
        return {
          page: i + 1,
          total: areas.length,
          signed: areas.filter((s) => s.signature_data !== null).length,
        };
      })
    : [];

  const scrollToArea = (areaIndex: number) => {
    setHighlightAreaIndex(areaIndex);
    // Wait for a potential page change to render before scrolling
    setTimeout(() => {
      const el = documentContainerRef.current?.querySelector(
        `[data-area-index="${areaIndex}"]`
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
    setTimeout(() => setHighlightAreaIndex(null), 2500);
  };

  const handleGoToNextUnsigned = () => {
    const unsigned = localSignatures
      .filter((s) => s.signature_data === null)
      .sort(
        (a, b) =>
          (((a as any).page_number ?? 0) - ((b as any).page_number ?? 0)) ||
          a.area_index - b.area_index
      );
    if (unsigned.length === 0) return;

    // Prefer the first unsigned area on or after the current page, wrap around otherwise
    const target =
      unsigned.find(
        (s) => !isPdf || ((s as any).page_number ?? 0) >= currentPdfPage - 1
      ) ?? unsigned[0];

    if (isPdf) {
      setCurrentPdfPage(((target as any).page_number ?? 0) + 1);
    }
    scrollToArea(target.area_index);
  };

  const totalAreas = localSignatures.length;
  const signedAreaCount = localSignatures.filter(
    (s) => s.signature_data !== null
  ).length;
  const allAreasSigned = totalAreas > 0 && signedAreaCount === totalAreas;

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
      const distance = getTouchDistance(e.touches as unknown as TouchList);
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
      const distance = getTouchDistance(e.touches as unknown as TouchList);
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
        setError(resolveActionError(result));
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


  // Load signed URL on component mount when password is verified or not required
  useEffect(() => {
    if (isPasswordVerified && !documentSignedUrl) {
      loadDocumentSignedUrl();
    }
  }, [isPasswordVerified, documentSignedUrl]);

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

  // Show completed document screen if publication is completed OR this specific document is completed
  if (isPublicationCompleted || isDocumentCompleted) {
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
                    {documentLabel}
                  </p>
                  <p className="text-xs text-green-600 text-center mt-1">
                    {t("sign.completed.status")}
                  </p>
                </div>
                {isDocumentCompleted && (
                  <SignedDocumentDownloadButton
                    shortUrl={publicationData.short_url}
                    documentId={documentData.id}
                    password={verifiedPassword}
                  />
                )}
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
        {/* Hide back button if publication or document is already completed */}
        {!isPublicationCompleted && !isDocumentCompleted && (
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("sign.documentList.title")}
          </Button>
        )}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{documentLabel}</h1>
            <p className="text-muted-foreground">{t("sign.clickAreas")}</p>
            {totalAreas > 0 &&
              (allAreasSigned ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle className="h-4 w-4" />
                  {t("sign.allSignedPrompt")}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2.5">
                    <Progress
                      value={(signedAreaCount / totalAreas) * 100}
                      className="h-2 w-36 sm:w-48"
                    />
                    <span className="text-sm font-medium text-primary tabular-nums whitespace-nowrap">
                      {t("sign.signProgress")
                        .replace("{{completed}}", String(signedAreaCount))
                        .replace("{{total}}", String(totalAreas))}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGoToNextUnsigned}
                    className="h-7 gap-1.5 px-2.5 text-xs"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {t("sign.goToNextUnsigned")}
                  </Button>
                </div>
              ))}
          </div>
          <div className="flex gap-2 shrink-0 self-end sm:self-auto">
            {lastSignatureData && (
              <Button
                variant="outline"
                onClick={() => setIsBatchConfirmOpen(true)}
                disabled={!canBatchSign || isSaving}
                size="lg"
              >
                <Stamp className="mr-2 h-4 w-4" />
                {t("sign.batchSign")}
              </Button>
            )}
            <Button
              onClick={handleGenerateDocument}
              disabled={!allAreasSigned || isGenerating}
              size="lg"
            >
              {t("sign.saveDocument")}
            </Button>
          </div>
        </div>

        {/* PDF Page Navigation */}
        {isPdf && totalPages > 1 && (
          <div className="mb-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-center gap-3 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPdfPage(prev => Math.max(1, prev - 1))}
              disabled={currentPdfPage <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("pdf_prev_page")}
            </Button>
            <span className="text-sm font-medium tabular-nums">
              {t("pdf_current_page")
                .replace("{current}", String(currentPdfPage))
                .replace("{total}", String(totalPages))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPdfPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPdfPage >= totalPages}
            >
              {t("pdf_next_page")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Per-page signature status chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 pb-2.5">
            {pageStatuses.map((ps) => {
              const isCurrent = ps.page === currentPdfPage;
              const isComplete = ps.total > 0 && ps.signed === ps.total;
              const hasRemaining = ps.total > 0 && ps.signed < ps.total;
              const stateClass = isComplete
                ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                : hasRemaining
                ? "border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200"
                : "border-transparent bg-muted text-muted-foreground hover:bg-muted/70";
              return (
                <button
                  key={ps.page}
                  type="button"
                  onClick={() => setCurrentPdfPage(ps.page)}
                  title={
                    ps.total > 0
                      ? t("sign.pageChipStatus")
                          .replace("{{signed}}", String(ps.signed))
                          .replace("{{total}}", String(ps.total))
                      : t("sign.pageChipNoAreas")
                  }
                  className={`relative flex h-8 min-w-8 items-center justify-center rounded-md border px-1.5 text-xs font-medium tabular-nums transition-colors ${stateClass} ${
                    isCurrent ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                  }`}
                >
                  {ps.page}
                  {isComplete && (
                    <Check className="ml-0.5 h-3 w-3" strokeWidth={3} />
                  )}
                  {hasRemaining && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[10px] font-semibold text-white shadow-sm">
                      {ps.total - ps.signed}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          </div>
        )}

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
              {isPdf ? (
                <PdfPageRenderer
                  pdfUrl={documentSignedUrl || documentData.file_url}
                  currentPage={currentPdfPage}
                  zoomLevel={1}
                  onPageDimensionsChange={setPdfPageDimensions}
                  onLoadError={(error) => setError(error)}
                />
              ) : (
                <img
                  src={documentSignedUrl || documentData.file_url}
                  alt="Document"
                  // CORS mode must match the canvas-compositing Image() load:
                  // without it Chrome caches the response sans ACAO header and
                  // the later crossOrigin re-request fails (R2 unlike Supabase
                  // only emits CORS headers when Origin is sent).
                  crossOrigin="anonymous"
                  className="w-full h-auto object-contain block"
                  draggable="false"
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(false)}
                />
              )}

            {(() => {
              const filteredSignatures = isPdf
                ? localSignatures.filter(sig => ((sig as any).page_number ?? 0) === currentPdfPage - 1)
                : localSignatures;

              return filteredSignatures.map((signature, index) => {
                const isSigned = signature.signature_data !== null;

                return (
                  <div
                    key={signature.area_index}
                    data-area-index={signature.area_index}
                    className={`absolute cursor-pointer rounded-sm border-2 ${
                      isSigned
                        ? "border-emerald-500 bg-emerald-500/15"
                        : "border-primary bg-primary/10 animate-pulse"
                    } ${
                      highlightAreaIndex === signature.area_index
                        ? "z-10 ring-4 ring-primary/60 ring-offset-2"
                        : ""
                    }`}
                    style={(() => {
                      try {
                        if (isPdf && pdfPageDimensions) {
                          return {
                            left: `${signature.x}%`,
                            top: `${signature.y}%`,
                            width: `${signature.width}%`,
                            height: `${signature.height}%`,
                          };
                        }

                        if (!documentContainerRef.current) {
                          return {
                            left: `${signature.x}px`,
                            top: `${signature.y}px`,
                            width: `${signature.width}px`,
                            height: `${signature.height}px`,
                          };
                        }

                        const imgElement = documentContainerRef.current.querySelector('img') as HTMLImageElement;
                        if (!imgElement || imgElement.naturalWidth === 0 || imgElement.naturalHeight === 0) {
                          return {
                            left: `${signature.x}px`,
                            top: `${signature.y}px`,
                            width: `${signature.width}px`,
                            height: `${signature.height}px`,
                          };
                        }

                        const { width: originalWidth, height: originalHeight } = getImageNaturalDimensions(documentContainerRef.current);
                        if (signature.x == null || signature.y == null || signature.width == null || signature.height == null) {
                          return { left: '0px', top: '0px', width: '0px', height: '0px' };
                        }
                        const relativeArea = ensureRelativeCoordinate({
                          x: signature.x,
                          y: signature.y,
                          width: signature.width,
                          height: signature.height,
                          type: signature.area_type as 'signature' | 'text',
                          pageNumber: signature.page_number,
                        }, originalWidth, originalHeight);
                        return {
                          left: `${relativeArea.x}%`,
                          top: `${relativeArea.y}%`,
                          width: `${relativeArea.width}%`,
                          height: `${relativeArea.height}%`,
                        };
                      } catch (error) {
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
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-background">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      </div>
                    ) : (
                      <div className="signature-area-label w-full h-full flex items-center justify-center gap-1 px-1 overflow-hidden text-primary">
                        {(signature as any).area_type === 'text' ? (
                          <Type className="h-3.5 w-3.5 shrink-0" />
                        ) : (
                          <PenLine className="h-3.5 w-3.5 shrink-0" />
                        )}
                        <span className="signature-area-label-text text-xs font-medium truncate min-w-0">
                          {(signature as any).area_type === 'text'
                            ? t("sign.clickToType")
                            : t("sign.clickToSign")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">
            {error}
          </div>
        )}
      </div>

      {isModalOpen && selectedArea !== null && (
        selectedAreaType === 'text' ? (
          <TextInputModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onComplete={handleSignatureComplete}
            areaAspectRatio={(() => {
              const area = localSignatures.find(s => s.area_index === selectedArea);
              return area && area.width != null && area.height != null && area.height > 0
                ? area.width / area.height
                : 4;
            })()}
          />
        ) : (
          <SignatureModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onComplete={handleSignatureComplete}
            existingSignature={
              localSignatures.find((s) => s.area_index === selectedArea)?.signature_data!
            }
          />
        )
      )}

      {/* Batch sign confirmation */}
      <AlertDialog open={isBatchConfirmOpen} onOpenChange={setIsBatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sign.batchSign")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sign.batchSignConfirm").replace(
                "{{count}}",
                String(batchSignTargets.length)
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {lastSignatureData && (
            <div className="flex justify-center rounded-md border bg-muted/30 p-3">
              <img
                src={lastSignatureData}
                alt="Signature preview"
                className="h-16 object-contain"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>{t("sign.batchSignCancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchSign}>
              {t("sign.batchSignAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      {/* Full-screen loading modal for document generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-6">
              {/* Circular Progress Bar */}
              <AnimatedCircularProgressBar
                max={100}
                min={0}
                value={progressValue}
                gaugePrimaryColor="rgb(59 130 246)"
                gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
                className="w-40 h-40"
              />

              {/* Progress Text */}
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  {t("sign.progress.title")}
                </h3>
                <p className="text-sm text-gray-600">
                  {generatingProgress}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  {t("sign.progress.warning")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
