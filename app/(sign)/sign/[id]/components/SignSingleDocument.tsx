"use client";

import {
  saveSignature,
  generateSignedPdf,
  generateSignedPdfFromPdf,
  getDocumentFileSignedUrl,
  markDocumentCompleted,
  createSignedDocumentUploadUrl,
} from "@/app/actions/document-actions";
import SignedDocumentDownloadButton from "./SignedDocumentDownloadButton";
import SignHeader from "./SignHeader";
import SignatureModal from "@/components/signature-modal";
import TextInputModal from "@/components/text-input-modal";
import { Button } from "@/components/ui/button";
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
import { remainingByPage, nextUnsignedArea } from "@/lib/sign/progress";
import {
  getImageNaturalDimensions,
  ensureRelativeCoordinate,
  convertSignatureAreaToPixels,
  documentDisplayLabel,
} from "@/lib/utils";
import {
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  PenLine,
  Stamp,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeft,
} from "lucide-react";
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

  const documentSignatures = documentData.signatures || [];

  const documentLabel = documentDisplayLabel(
    documentData.alias,
    documentData.filename,
    publicationData.name
  );

  const [localSignatures, setLocalSignatures] =
    useState<Signature[]>(documentSignatures);

  const isExpired = publicationData.expires_at
    ? new Date(publicationData.expires_at) < new Date()
    : false;
  const isPublicationCompleted = publicationData.status === "completed";
  const isDocumentCompleted = documentData.status === "completed";
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [selectedAreaType, setSelectedAreaType] = useState<'signature' | 'text'>('signature');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingProgress, setGeneratingProgress] = useState<string>("");
  const [progressValue, setProgressValue] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<(() => void) | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState<boolean>(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const areaRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [documentSignedUrl, setDocumentSignedUrl] = useState<string | null>(null);
  const [lastSignatureData, setLastSignatureData] = useState<string | null>(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState<boolean>(false);
  const [isLoadingSignedUrl, setIsLoadingSignedUrl] = useState<boolean>(false);
  const [pendingScrollAreaIndex, setPendingScrollAreaIndex] = useState<number | null>(null);

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
      const result = await saveSignature(
        documentData.id,
        selectedArea,
        signatureData
      );

      if (result.error) {
        setError(resolveActionError(result));
        return;
      }

      const existingIndex = localSignatures.findIndex(
        (s) => s.area_index === selectedArea
      );
      if (existingIndex >= 0) {
        const updatedSignatures = [...localSignatures];
        updatedSignatures[existingIndex] = {
          ...updatedSignatures[existingIndex],
          signature_data: signatureData,
        };
        setLocalSignatures(updatedSignatures);
      } else {
        const newSignature: Signature = {
          id: `temp-${Date.now()}`,
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
    } catch (err) {
      console.error("Error saving signature:", err);
      setError(t("sign.error.saveSignature"));
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

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    try {
      if (isPdf) {
        setProgressValue(30);
        setGeneratingProgress(t("sign.progress.compositing"));

        const pdfResult = await generateSignedPdfFromPdf(documentData.id);

        if (!pdfResult || pdfResult.error) {
          setError(pdfResult ? resolveActionError(pdfResult) : t("sign.error.upload"));
          setIsGenerating(false);
          setGeneratingProgress("");
          setProgressValue(0);
          return;
        }

        setProgressValue(90);
        setGeneratingProgress(t("sign.progress.finalizing"));

        const markResult = await markDocumentCompleted(documentData.id);

        if (!markResult || markResult.error) {
          setError(markResult ? resolveActionError(markResult) : t("sign.error.upload"));
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
            .map((signature) => {
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
          } catch (err) {
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
              else reject(new Error('Could not create blob'));
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
          setError(uploadUrlResult.error ? resolveActionError(uploadUrlResult) : t("sign.error.upload"));
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
          setError(t("sign.error.upload"));
          setIsGenerating(false);
          setGeneratingProgress("");
          return;
        }

        const filePath = uploadUrlResult.filePath!;

        setProgressValue(90);
        setGeneratingProgress(t("sign.progress.uploading"));
        const pdfResult = await generateSignedPdf(documentData.id, filePath);

        if (!pdfResult || pdfResult.error) {
          setError(pdfResult ? resolveActionError(pdfResult) : t("sign.error.upload"));
          setIsGenerating(false);
          setGeneratingProgress("");
          return;
        }

        setProgressValue(95);
        setGeneratingProgress(t("sign.progress.finalizing"));
        const markResult = await markDocumentCompleted(documentData.id);

        if (!markResult || markResult.error) {
          setError(markResult ? resolveActionError(markResult) : t("sign.error.upload"));
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
      setError(t("sign.error.upload"));
      setLastFailedAction(() => handleGenerateDocument);
      setIsGenerating(false);
      setGeneratingProgress("");
      setProgressValue(0);
    } finally {
      window.removeEventListener("beforeunload", beforeUnload);
    }
  };

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
    let failedCount = 0;
    try {
      for (const target of batchSignTargets) {
        const result = await saveSignature(
          documentData.id,
          target.area_index,
          lastSignatureData
        );
        if (result.error) {
          failedCount += 1;
          continue;
        }
        signedIndexes.push(target.area_index);
      }
    } catch (err) {
      console.error("Error batch signing:", err);
      failedCount = batchSignTargets.length - signedIndexes.length;
    } finally {
      if (signedIndexes.length > 0) {
        setLocalSignatures((prev) =>
          prev.map((s) =>
            signedIndexes.includes(s.area_index)
              ? { ...s, signature_data: lastSignatureData }
              : s
          )
        );
      }
      if (failedCount > 0) {
        setError(
          t("sign.batchSign.partial", {
            done: signedIndexes.length,
            failed: failedCount,
          })
        );
      }
      setIsSaving(false);
    }
  };

  const totalAreas = localSignatures.length;
  const signedAreaCount = localSignatures.filter(
    (s) => s.signature_data !== null
  ).length;
  const allAreasSigned = totalAreas > 0 && signedAreaCount === totalAreas;
  const remainingCount = totalAreas - signedAreaCount;

  const progressAreas = localSignatures.map((s) => ({
    id: String(s.area_index),
    page: isPdf ? ((s as any).page_number ?? 0) + 1 : 1,
    signed: s.signature_data !== null,
  }));
  const remainingByPageMap = remainingByPage(progressAreas);

  const handleNextArea = () => {
    const next = nextUnsignedArea(progressAreas, currentPdfPage);
    if (!next) return;
    const areaIndex = Number(next.id);
    if (next.page !== currentPdfPage) {
      setCurrentPdfPage(next.page);
      setPendingScrollAreaIndex(areaIndex);
      return;
    }
    const el = areaRefs.current.get(areaIndex);
    el?.scrollIntoView({ block: "center" });
  };

  useEffect(() => {
    if (pendingScrollAreaIndex === null) return;
    const el = areaRefs.current.get(pendingScrollAreaIndex);
    if (el) {
      el.scrollIntoView({ block: "center" });
      setPendingScrollAreaIndex(null);
    }
  }, [pendingScrollAreaIndex, currentPdfPage]);

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

  const handleDocumentTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime;

      if (timeDiff < 300 && timeDiff > 0) {
        e.preventDefault();
        if (zoomLevel === 1) {
          setZoomLevel(2);
        } else {
          setZoomLevel(1);
        }
        return;
      }
      setLastTapTime(currentTime);

      const container = documentContainerRef.current;
      const canScroll = container && (
        container.scrollWidth > container.clientWidth ||
        container.scrollHeight > container.clientHeight
      );

      if (canScroll && zoomLevel > 1) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    } else if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches as unknown as TouchList);
      setLastTouchDistance(distance);
      setTouchStartZoom(zoomLevel);
      setIsDragging(false);
    }
  };

  const handleDocumentTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && documentContainerRef.current) {
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;

      documentContainerRef.current.scrollLeft -= deltaX;
      documentContainerRef.current.scrollTop -= deltaY;

      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
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
    const container = documentContainerRef.current;
    const canScroll = container && (
      container.scrollWidth > container.clientWidth ||
      container.scrollHeight > container.clientHeight
    );

    if (canScroll && zoomLevel > 1) {
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
      console.error("Could not load signed URL:", err);
      setError(t("sign.error.loadDocument"));
      setLastFailedAction(() => loadDocumentSignedUrl);
    } finally {
      setIsLoadingSignedUrl(false);
    }
  };

  useEffect(() => {
    if (isPasswordVerified && !documentSignedUrl) {
      loadDocumentSignedUrl();
    }
  }, [isPasswordVerified, documentSignedUrl]);

  useEffect(() => {
    if (imageLoaded && documentContainerRef.current) {
      const timer = setTimeout(() => {
        setLocalSignatures(prev => [...prev]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);

  const handleAreaKeyDown = (e: React.KeyboardEvent, areaIndex: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAreaClick(areaIndex);
    }
  };

  if (isPublicationCompleted || isDocumentCompleted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SignHeader />
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
                    {documentLabel}
                  </p>
                  <p className="text-xs text-seal text-center mt-1">
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

  if (isExpired) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <SignHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
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
                    {documentData.alias || documentData.filename}
                  </p>
                  {publicationData.expires_at && (
                    <p className="text-xs text-amber text-center mt-1">
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
      </div>
    );
  }

  const showBatchSignHint =
    lastSignatureData !== null && batchSignTargets.length > 0 && !canBatchSign === false && signedAreaCount > 0 && !allAreasSigned;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top sticky header */}
      <div className="sticky top-0 z-30 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3 gap-2">
          <Button variant="ghost" size="icon" aria-label={t("common.back")} onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1 text-center">
            <p className="font-semibold text-sm truncate">{documentLabel}</p>
            {totalAreas > 0 && (
              <p className="text-xs text-muted-foreground">
                {isPdf
                  ? t("sign.header.meta", {
                      page: currentPdfPage,
                      pages: totalPages,
                      completed: signedAreaCount,
                      total: totalAreas,
                    })
                  : t("sign.header.metaSingle", {
                      completed: signedAreaCount,
                      total: totalAreas,
                    })}
              </p>
            )}
          </div>
          {totalAreas >= 2 ? (
            <Button
              variant="outline"
              size="sm"
              disabled={!canBatchSign}
              onClick={() => setIsBatchConfirmOpen(true)}
            >
              <Stamp className="mr-1.5 h-4 w-4" />
              {t("sign.batchSign")}
            </Button>
          ) : (
            <div className="w-9" />
          )}
        </div>
        {totalAreas > 0 && (
          <div className="h-1 bg-muted">
            <div
              className="h-1 bg-primary transition-all"
              style={{ width: `${(signedAreaCount / totalAreas) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {generatingProgress}
      </div>

      {/* Guidance row */}
      <div className="px-4 py-2 flex items-center justify-between text-sm gap-2">
        <span className="text-muted-foreground">
          {showBatchSignHint ? t("sign.batchSignHint") : t("sign.clickAreas")}
        </span>
        {remainingCount > 0 && (
          <button
            type="button"
            className="text-primary font-medium shrink-0"
            onClick={handleNextArea}
          >
            {t("sign.nextArea")}
          </button>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm flex items-center justify-between gap-2">
          <span>{error}</span>
          {lastFailedAction && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive shrink-0"
              onClick={() => lastFailedAction()}
            >
              {t("common.retry")}
            </Button>
          )}
        </div>
      )}

      <div className="px-4 pb-4 flex-1">
        {/* PDF Page Navigation */}
        {isPdf && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-2 mb-2 bg-muted/30 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              aria-label={t("pdf_prev_page")}
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
              aria-label={t("pdf_next_page")}
              onClick={() => setCurrentPdfPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPdfPage >= totalPages}
            >
              {t("pdf_next_page")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        <div className="relative border rounded-lg mb-3">
          <div
            ref={documentContainerRef}
            className="relative overflow-auto max-h-[70vh]"
            style={{
              cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
              touchAction: zoomLevel > 1 ? "none" : "pan-y",
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
                  onLoadError={(err) => setError(err)}
                />
              ) : (
                <img
                  src={documentSignedUrl || documentData.file_url}
                  alt={documentLabel}
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
                    ref={(el) => {
                      if (el) areaRefs.current.set(signature.area_index, el);
                      else areaRefs.current.delete(signature.area_index);
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={t("sign.area.label", { index: index + 1 })}
                    className={`absolute cursor-pointer rounded-sm ${
                      isSigned
                        ? "border border-seal bg-seal-soft/60"
                        : "border-2 border-dashed border-primary/60 bg-primary/5"
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
                      } catch (err) {
                        return {
                          left: `${signature.x}px`,
                          top: `${signature.y}px`,
                          width: `${signature.width}px`,
                          height: `${signature.height}px`,
                        };
                      }
                    })()}
                    onClick={() => handleAreaClick(signature.area_index)}
                    onKeyDown={(e) => handleAreaKeyDown(e, signature.area_index)}
                  >
                    {isSigned ? (
                      <div className="w-full h-full relative">
                        <img
                          src={signature.signature_data!}
                          alt={t("sign.area.signedAlt")}
                          className="w-full h-full object-contain"
                        />
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-seal text-primary-foreground shadow-sm ring-2 ring-background">
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

        {/* Zoom toolbar */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Button
            size="sm"
            variant="outline"
            aria-label={t("sign.zoomOut")}
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.5}
            className="p-2 h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium tabular-nums w-10 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            aria-label={t("sign.zoomIn")}
            onClick={handleZoomIn}
            disabled={zoomLevel >= 3}
            className="p-2 h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={t("sign.zoomReset")}
            onClick={handleZoomReset}
            disabled={zoomLevel === 1}
            className="p-2 h-8 w-8"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* PDF page chips */}
        {isPdf && totalPages > 1 && (
          <div className="flex gap-2 justify-center flex-wrap mb-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const remaining = remainingByPageMap[page] ?? 0;
              const isCurrent = page === currentPdfPage;
              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPdfPage(page)}
                  className={`text-xs rounded-full px-3 py-1 border ${
                    isCurrent ? "bg-primary/10 text-primary border-primary/30" : "text-muted-foreground"
                  }`}
                >
                  {t("sign.pageChip", { page })}
                  {remaining > 0 ? ` · ${t("sign.pageChip.remaining", { count: remaining })}` : ""}
                </button>
              );
            })}
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
              {isPdf
                ? t("sign.batchSignConfirmPage", { count: batchSignTargets.length })
                : t("sign.batchSignConfirm", { count: batchSignTargets.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {lastSignatureData && (
            <div className="flex justify-center rounded-md border bg-muted/30 p-3">
              <img
                src={lastSignatureData}
                alt={t("sign.area.signedAlt")}
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

      {/* Submit confirmation */}
      <AlertDialog open={isSubmitConfirmOpen} onOpenChange={setIsSubmitConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sign.submit.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sign.submit.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsSubmitConfirmOpen(false);
                handleGenerateDocument();
              }}
            >
              {t("sign.submit.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom sticky submit bar */}
      <div className="sticky bottom-0 bg-background border-t px-4 pt-3 pb-5 flex flex-col gap-2">
        <Button
          className="h-12"
          disabled={!allAreasSigned || isGenerating}
          onClick={() => setIsSubmitConfirmOpen(true)}
        >
          {allAreasSigned
            ? t("sign.saveDocument")
            : t("sign.submit.remaining", { count: remainingCount })}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          {t("sign.completed.noEdit")}
        </p>
      </div>

      {/* Loading indicator for signature saving */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-40">
          <div className="bg-background rounded-lg p-4 shadow-lg border">
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 animate-spin" />
              <span>{t("sign.savingSignature")}</span>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen loading modal for document generation */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 border">
            <div className="flex flex-col items-center gap-6">
              <AnimatedCircularProgressBar
                max={100}
                min={0}
                value={progressValue}
                gaugePrimaryColor="rgb(59 130 246)"
                gaugeSecondaryColor="rgba(0, 0, 0, 0.1)"
                className="w-40 h-40"
              />
              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  {t("sign.progress.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {generatingProgress}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  {t("sign.progress.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
