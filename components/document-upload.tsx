"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileImage, FileText, Trash2, ZoomIn, ZoomOut, RotateCcw, Type, ChevronLeft, ChevronRight, AlertTriangle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import AreaSelector from "@/components/area-selector";
import {
  uploadDocument,
  createSignatureAreas,
} from "@/app/actions/document-actions";
import { canUploadPdf } from "@/app/actions/subscription-actions";
import { useLanguage } from "@/contexts/language-context";
import type { SignatureArea } from "@/lib/supabase/database.types";
import {
  getImageNaturalDimensions,
  convertSignatureAreaToPixels,
  ensureRelativeCoordinate,
  type RelativeSignatureArea,
} from "@/lib/utils";
import dynamic from "next/dynamic";
import type { PdfPageDimensions } from "@/components/pdf-page-renderer";

// Lazy load PDF renderer to avoid bundle bloat
const PdfPageRenderer = dynamic(() => import("@/components/pdf-page-renderer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-muted/50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ),
});

interface UploadFileData {
  file: File;
  dataUrl: string;
  fileName: string;
  isPdf: boolean;
  pdfTotalPages?: number;
}

export default function DocumentUpload() {
  const { t } = useLanguage();
  const router = useRouter();

  // Multi-image state
  const [images, setImages] = useState<UploadFileData[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Per-image aliases: index -> alias
  const [aliasMap, setAliasMap] = useState<Map<number, string>>(new Map());

  // Per-image signature areas: index -> areas
  const [signatureAreasMap, setSignatureAreasMap] = useState<Map<number, RelativeSignatureArea[]>>(new Map());

  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savingProgress, setSavingProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [currentAreaType, setCurrentAreaType] = useState<'signature' | 'text'>('signature');

  // Upload mode: 'image' or 'pdf'
  const [uploadMode, setUploadMode] = useState<'image' | 'pdf'>('image');

  // PDF-related state
  const [canUsePdf, setCanUsePdf] = useState<boolean>(false);
  const [pdfCheckDone, setPdfCheckDone] = useState<boolean>(false);
  const [currentPdfPage, setCurrentPdfPage] = useState<number>(1); // 1-indexed for pdfjs
  const [pdfPageDimensions, setPdfPageDimensions] = useState<PdfPageDimensions | null>(null);
  const [pdfPageImageForSelector, setPdfPageImageForSelector] = useState<string | null>(null);

  // Carousel API
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Validation modal
  const [showValidationModal, setShowValidationModal] = useState<boolean>(false);
  const [missingAreaIndices, setMissingAreaIndices] = useState<number[]>([]);

  // Sync carousel index with state
  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  // Check PDF permission on mount
  useEffect(() => {
    const checkPdfPermission = async () => {
      const result = await canUploadPdf();
      console.log("[PDF Permission Check]", result);
      setCanUsePdf(result.canUpload);
      setPdfCheckDone(true);
    };
    checkPdfPermission();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Capture file array before resetting input (FileList is a live reference)
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;

    // Reset file input immediately so the same files can be selected again
    e.target.value = "";

    setError(null);
    const newImages: UploadFileData[] = [];
    let loaded = 0;

    fileArray.forEach((file) => {
      const isPdf = file.type === "application/pdf";

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;

        if (isPdf) {
          // For PDF, dynamically import pdfjs to count pages
          import("pdfjs-dist").then(async (pdfjsLib) => {
            try {
              if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
              }
              const arrayBuffer = await file.arrayBuffer();
              const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
              newImages.push({
                file,
                dataUrl,
                fileName: file.name,
                isPdf: true,
                pdfTotalPages: pdf.numPages,
              });
            } catch (err) {
              console.error("Failed to read PDF:", err);
              newImages.push({
                file,
                dataUrl,
                fileName: file.name,
                isPdf: true,
                pdfTotalPages: 1,
              });
            }
            loaded++;
            if (loaded === totalFiles) {
              newImages.sort((a, b) => fileArray.indexOf(a.file) - fileArray.indexOf(b.file));
              setImages((prev) => [...prev, ...newImages]);
            }
          }).catch((err) => {
            console.error("Failed to import pdfjs-dist:", err);
            // Fallback: add PDF without page count
            newImages.push({
              file,
              dataUrl,
              fileName: file.name,
              isPdf: true,
              pdfTotalPages: 1,
            });
            loaded++;
            if (loaded === totalFiles) {
              newImages.sort((a, b) => fileArray.indexOf(a.file) - fileArray.indexOf(b.file));
              setImages((prev) => [...prev, ...newImages]);
            }
          });
        } else {
          newImages.push({
            file,
            dataUrl,
            fileName: file.name,
            isPdf: false,
          });
          loaded++;
          if (loaded === totalFiles) {
            newImages.sort((a, b) => fileArray.indexOf(a.file) - fileArray.indexOf(b.file));
            setImages((prev) => [...prev, ...newImages]);
          }
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const currentAreas = signatureAreasMap.get(currentIndex) || [];

  const getPdfPageAsImage = async (): Promise<string | null> => {
    const container = documentContainerRef.current;
    if (!container) return null;
    const canvas = container.querySelector("canvas");
    if (!canvas) return null;
    return canvas.toDataURL("image/png");
  };

  const handleAddSignatureArea = async () => {
    if (documentContainerRef.current) {
      scrollPositionRef.current = {
        top: documentContainerRef.current.scrollTop,
        left: documentContainerRef.current.scrollLeft,
      };
    }

    // For PDF, capture current page as image for AreaSelector
    const currentFile = images[currentIndex];
    if (currentFile?.isPdf) {
      const pageImage = await getPdfPageAsImage();
      if (pageImage) {
        setPdfPageImageForSelector(pageImage);
      }
    }

    setIsSelecting(true);
  };

  const handleAreaSelected = (area: RelativeSignatureArea, scrollPosition: { top: number; left: number }) => {
    const currentFile = images[currentIndex];
    const areaWithPage: RelativeSignatureArea = {
      ...area,
      pageNumber: currentFile?.isPdf ? currentPdfPage - 1 : 0, // 0-indexed page number
    };

    setSignatureAreasMap((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentIndex) || [];
      newMap.set(currentIndex, [...existing, areaWithPage]);
      return newMap;
    });
    setIsSelecting(false);
    setPdfPageImageForSelector(null);

    requestAnimationFrame(() => {
      if (documentContainerRef.current) {
        documentContainerRef.current.scrollTop = scrollPosition.top;
        documentContainerRef.current.scrollLeft = scrollPosition.left;
      }
    });
  };

  const handleRemoveArea = (areaIndex: number) => {
    setSignatureAreasMap((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(currentIndex) || [];
      const updated = [...existing];
      updated.splice(areaIndex, 1);
      newMap.set(currentIndex, updated);
      return newMap;
    });
  };

  const handleClearDocument = () => {
    setImages([]);
    setAliasMap(new Map());
    setSignatureAreasMap(new Map());
    setError(null);
    setZoomLevel(1);
    setCurrentIndex(0);
    setCurrentPdfPage(1);
    setUploadMode('image');
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

    if (canScroll && !isSelecting) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && documentContainerRef.current) {
      e.preventDefault();
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

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsDragging(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setDragStart({ x: centerX, y: centerY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isDragging && documentContainerRef.current) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;

      const deltaX = centerX - dragStart.x;
      const deltaY = centerY - dragStart.y;

      documentContainerRef.current.scrollLeft -= deltaX;
      documentContainerRef.current.scrollTop -= deltaY;

      setDragStart({ x: centerX, y: centerY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      setIsDragging(false);
    } else if (e.touches.length === 1 && isDragging) {
      setIsDragging(false);
    }
  };

  const goToImage = useCallback((index: number) => {
    setCurrentIndex(index);
    setCurrentPdfPage(1); // Reset PDF page when switching documents
    carouselApi?.scrollTo(index);
  }, [carouselApi]);

  const handleSaveDocument = async () => {
    if (images.length === 0) {
      setError("Please upload at least one document");
      return;
    }

    // Validation: check every image has at least one signature area
    const missing: number[] = [];
    for (let i = 0; i < images.length; i++) {
      const areas = signatureAreasMap.get(i) || [];
      if (areas.length === 0) {
        missing.push(i);
      }
    }

    if (missing.length > 0) {
      setMissingAreaIndices(missing);
      setShowValidationModal(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let lastDocumentId = "";
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const areas = signatureAreasMap.get(i) || [];

        setSavingProgress(
          t("upload.savingProgress")
            .replace("{current}", String(i + 1))
            .replace("{total}", String(images.length))
        );

        // Step 1: Upload document
        const formData = new FormData();
        formData.append("file", img.file);
        formData.append("filename", img.fileName);
        const imgAlias = aliasMap.get(i);
        if (imgAlias && imgAlias.trim()) {
          formData.append("alias", imgAlias.trim());
        }

        const uploadResult = await uploadDocument(formData);

        if (uploadResult.error) {
          setError(uploadResult.error);
          return;
        }

        if (!uploadResult.success || !uploadResult.document) {
          setError("Failed to upload document");
          return;
        }

        lastDocumentId = uploadResult.document.id;

        // Step 2: Create signature areas
        const relativeAreas: SignatureArea[] = areas.map(area => ({
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
          type: area.type || 'signature',
          pageNumber: area.pageNumber ?? 0,
        }));

        const areasResult = await createSignatureAreas(
          uploadResult.document.id,
          relativeAreas
        );

        if (areasResult.error) {
          setError(areasResult.error);
          return;
        }
      }

      // Success: single image → document detail, multiple → dashboard
      if (images.length === 1 && lastDocumentId) {
        router.push(`/document/${lastDocumentId}`);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      setError("An unexpected error occurred while uploading the documents");
    } finally {
      setIsLoading(false);
      setSavingProgress("");
    }
  };

  const handleGoToMissingImage = (index: number) => {
    setShowValidationModal(false);
    goToImage(index);
  };

  const totalAreasCount = Array.from(signatureAreasMap.values()).reduce(
    (sum, areas) => sum + areas.length, 0
  );

  return (
    <div className="space-y-8">
      {error && images.length === 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}
      {images.length === 0 ? (
        <div className="space-y-4">
          {/* Upload Mode Selector */}
          <div className="flex gap-3">
            <button
              onClick={() => setUploadMode('image')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                uploadMode === 'image'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              }`}
            >
              <FileImage className={`h-6 w-6 ${uploadMode === 'image' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${uploadMode === 'image' ? 'text-primary' : 'text-muted-foreground'}`}>
                {t("upload.title")}
              </span>
            </button>
            <button
              onClick={() => canUsePdf && setUploadMode('pdf')}
              className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all relative ${
                !canUsePdf
                  ? 'border-muted opacity-60 cursor-not-allowed'
                  : uploadMode === 'pdf'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30 cursor-pointer'
              }`}
            >
              <FileText className={`h-6 w-6 ${uploadMode === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${uploadMode === 'pdf' ? 'text-primary' : 'text-muted-foreground'}`}>
                {t("pdf_document")}
              </span>
              {!canUsePdf ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {t("pdf_pro_badge")}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {t("pdf_pro_badge")}
                </span>
              )}
            </button>
          </div>

          {/* Upload Card */}
          <Card className="border-dashed border-2">
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="rounded-full bg-primary/10 p-4">
                  {uploadMode === 'pdf' ? (
                    <FileText className="h-10 w-10 text-primary" />
                  ) : (
                    <FileImage className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-lg">
                    {uploadMode === 'pdf' ? t("pdf_document") : t("upload.title")}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {t("upload.description")}
                  </p>
                  {uploadMode === 'image' && (
                    <p className="text-muted-foreground text-xs">
                      {t("upload.multipleFiles")}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t("upload.button")}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={uploadMode === 'pdf' ? ".pdf,application/pdf" : "image/*"}
                  multiple={uploadMode === 'image'}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. Clear / Save buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleClearDocument}
              className="text-destructive border-destructive/30 hover:text-destructive hover:bg-destructive/5"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              {t("upload.clear")}
            </Button>
            <Button
              onClick={handleSaveDocument}
              disabled={
                totalAreasCount === 0 || isLoading || images.length === 0
              }
            >
              {isLoading ? (savingProgress || t("upload.saving")) : t("upload.save")}
            </Button>
          </div>

          {/* 2. File Information - per image */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground">
                  {t("upload.filename")}
                  {images.length > 1 && (
                    <span className="ml-1">
                      ({t("upload.imageIndex")
                        .replace("{current}", String(currentIndex + 1))
                        .replace("{total}", String(images.length))})
                    </span>
                  )}
                </Label>
                <p className="text-sm mt-0.5 truncate">
                  {images[currentIndex]?.fileName}
                </p>
              </div>
              <div>
                <Label htmlFor="document-alias" className="text-xs font-medium text-muted-foreground">
                  {t("upload.alias")}
                  <span className="ml-1">({t("upload.aliasOptional")})</span>
                </Label>
                <Input
                  id="document-alias"
                  name="document-alias"
                  type="text"
                  placeholder={t("upload.aliasPlaceholder")}
                  value={aliasMap.get(currentIndex) || ""}
                  onChange={(e) => {
                    setAliasMap((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(currentIndex, e.target.value);
                      return newMap;
                    });
                  }}
                  className="mt-1 h-9"
                  maxLength={100}
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. Area Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setCurrentAreaType('signature'); handleAddSignatureArea(); }}
              disabled={isSelecting}
              className="flex-1 sm:flex-none"
            >
              {t("upload.addSignatureArea")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setCurrentAreaType('text'); handleAddSignatureArea(); }}
              disabled={isSelecting}
              className="flex-1 sm:flex-none"
            >
              <Type className="mr-1 h-4 w-4" />
              {t("upload.addTextArea")}
            </Button>
          </div>

          {/* 4. PDF Page Navigation */}
          {images[currentIndex]?.isPdf && images[currentIndex]?.pdfTotalPages && (
            <div className="flex items-center justify-center gap-3 py-2 bg-muted/30 rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPdfPage(prev => Math.max(1, prev - 1))}
                disabled={currentPdfPage <= 1 || isSelecting}
              >
                {t("pdf_prev_page")}
              </Button>
              <span className="text-sm font-medium tabular-nums">
                {t("pdf_current_page")
                  .replace("{current}", String(currentPdfPage))
                  .replace("{total}", String(images[currentIndex].pdfTotalPages))}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPdfPage(prev => Math.min(images[currentIndex].pdfTotalPages || 1, prev + 1))}
                disabled={currentPdfPage >= (images[currentIndex].pdfTotalPages || 1) || isSelecting}
              >
                {t("pdf_next_page")}
              </Button>
            </div>
          )}

          {/* 5. Carousel Navigation */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-3 py-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => goToImage(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0 || isSelecting}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                {images.map((_, idx) => {
                  const hasAreas = (signatureAreasMap.get(idx) || []).length > 0;
                  return (
                    <button
                      key={idx}
                      onClick={() => !isSelecting && goToImage(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${
                        idx === currentIndex
                          ? "bg-primary scale-125"
                          : hasAreas
                            ? "bg-green-400"
                            : "bg-muted-foreground/30"
                      }`}
                      disabled={isSelecting}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {t("upload.imageIndex")
                  .replace("{current}", String(currentIndex + 1))
                  .replace("{total}", String(images.length))}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => goToImage(Math.min(images.length - 1, currentIndex + 1))}
                disabled={currentIndex === images.length - 1 || isSelecting}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* 6. Document Viewer with Carousel */}
          <div className="relative border rounded-lg overflow-hidden">
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3 || isSelecting}
                className="p-2 h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5 || isSelecting}
                className="p-2 h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleZoomReset}
                disabled={zoomLevel === 1 || isSelecting}
                className="p-2 h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <div className="text-xs text-center font-medium px-1 py-0.5 bg-gray-100 rounded">
                {Math.round(zoomLevel * 100)}%
              </div>
            </div>

            {isSelecting ? (
              <AreaSelector
                image={images[currentIndex]?.isPdf ? (pdfPageImageForSelector || "") : images[currentIndex].dataUrl}
                onAreaSelected={handleAreaSelected}
                onCancel={() => { setIsSelecting(false); setPdfPageImageForSelector(null); }}
                existingAreas={images[currentIndex]?.isPdf
                  ? currentAreas.filter(a => (a.pageNumber ?? 0) === currentPdfPage - 1)
                  : currentAreas}
                initialScrollPosition={scrollPositionRef.current}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
                areaType={currentAreaType}
              />
            ) : images.length === 1 ? (
              // Single file: no carousel needed
              <div
                ref={documentContainerRef}
                className="relative overflow-auto max-h-[70vh]"
                style={{
                  cursor: (() => {
                    const container = documentContainerRef.current;
                    const canScroll = container && (
                      container.scrollWidth > container.clientWidth ||
                      container.scrollHeight > container.clientHeight
                    );
                    return canScroll ? (isDragging ? 'grabbing' : 'grab') : 'default';
                  })(),
                  touchAction: 'none'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div
                  className="relative inline-block"
                  style={{
                    width: `${100 * zoomLevel}%`,
                    height: 'auto'
                  }}
                >
                  {images[currentIndex]?.isPdf ? (
                    <>
                      <PdfPageRenderer
                        pdfUrl={images[currentIndex].dataUrl}
                        currentPage={currentPdfPage}
                        zoomLevel={1}
                        onTotalPagesChange={(total) => {
                          setImages(prev => {
                            const updated = [...prev];
                            if (updated[currentIndex]) {
                              updated[currentIndex] = { ...updated[currentIndex], pdfTotalPages: total };
                            }
                            return updated;
                          });
                        }}
                        onPageDimensionsChange={setPdfPageDimensions}
                      />
                      {currentAreas
                        .filter(area => (area.pageNumber ?? 0) === currentPdfPage - 1)
                        .map((area) => {
                          const actualIndex = currentAreas.findIndex(a => a === area);
                          return (
                            <div
                              key={actualIndex}
                              className={`absolute border-2 flex items-center justify-center ${area.type === 'text' ? 'border-blue-500 bg-blue-500/10' : 'border-red-500 bg-red-500/10'}`}
                              style={{
                                position: "absolute",
                                left: `${area.x}%`,
                                top: `${area.y}%`,
                                width: `${area.width}%`,
                                height: `${area.height}%`,
                                pointerEvents: "auto",
                                cursor: "pointer",
                              }}
                              onClick={() => handleRemoveArea(actualIndex)}
                            >
                              <span className={`text-xs font-medium ${area.type === 'text' ? 'text-blue-600' : 'text-red-600'}`}>
                                {area.type === 'text' ? `${t("upload.textArea")} ${actualIndex + 1}` : `${t("upload.signature")} ${actualIndex + 1}`}
                              </span>
                            </div>
                          );
                        })}
                    </>
                  ) : (
                    <>
                      <img
                        src={images[currentIndex]?.dataUrl || images[0]?.dataUrl}
                        alt="Document"
                        className="w-full h-auto object-contain block"
                        draggable="false"
                        style={{ userSelect: "none", WebkitUserSelect: "none" }}
                      />
                      {currentAreas.map((area, index) => (
                        <div
                          key={index}
                          className={`absolute border-2 flex items-center justify-center ${area.type === 'text' ? 'border-blue-500 bg-blue-500/10' : 'border-red-500 bg-red-500/10'}`}
                          style={{
                            position: "absolute",
                            left: `${area.x}%`,
                            top: `${area.y}%`,
                            width: `${area.width}%`,
                            height: `${area.height}%`,
                            pointerEvents: "auto",
                            cursor: "pointer",
                          }}
                          onClick={() => handleRemoveArea(index)}
                        >
                          <span className={`text-xs font-medium ${area.type === 'text' ? 'text-blue-600' : 'text-red-600'}`}>
                            {area.type === 'text' ? `${t("upload.textArea")} ${index + 1}` : `${t("upload.signature")} ${index + 1}`}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Multiple files: use Carousel
              <Carousel
                setApi={setCarouselApi}
                opts={{ watchDrag: false, startIndex: currentIndex }}
                className="w-full"
              >
                <CarouselContent>
                  {images.map((img, imgIdx) => (
                    <CarouselItem key={imgIdx}>
                      <div
                        ref={imgIdx === currentIndex ? documentContainerRef : undefined}
                        className="relative overflow-auto max-h-[70vh]"
                        style={{
                          cursor: (() => {
                            if (imgIdx !== currentIndex) return 'default';
                            const container = documentContainerRef.current;
                            const canScroll = container && (
                              container.scrollWidth > container.clientWidth ||
                              container.scrollHeight > container.clientHeight
                            );
                            return canScroll ? (isDragging ? 'grabbing' : 'grab') : 'default';
                          })(),
                          touchAction: 'none'
                        }}
                        onMouseDown={imgIdx === currentIndex ? handleMouseDown : undefined}
                        onMouseMove={imgIdx === currentIndex ? handleMouseMove : undefined}
                        onMouseUp={imgIdx === currentIndex ? handleMouseUp : undefined}
                        onMouseLeave={imgIdx === currentIndex ? handleMouseUp : undefined}
                        onTouchStart={imgIdx === currentIndex ? handleTouchStart : undefined}
                        onTouchMove={imgIdx === currentIndex ? handleTouchMove : undefined}
                        onTouchEnd={imgIdx === currentIndex ? handleTouchEnd : undefined}
                      >
                        <div
                          className="relative inline-block"
                          style={{
                            width: `${100 * zoomLevel}%`,
                            height: 'auto'
                          }}
                        >
                          {img.isPdf ? (
                            <>
                              <PdfPageRenderer
                                pdfUrl={img.dataUrl}
                                currentPage={imgIdx === currentIndex ? currentPdfPage : 1}
                                zoomLevel={1}
                                onTotalPagesChange={imgIdx === currentIndex ? (total) => {
                                  setImages(prev => {
                                    const updated = [...prev];
                                    if (updated[imgIdx]) {
                                      updated[imgIdx] = { ...updated[imgIdx], pdfTotalPages: total };
                                    }
                                    return updated;
                                  });
                                } : undefined}
                                onPageDimensionsChange={imgIdx === currentIndex ? setPdfPageDimensions : undefined}
                              />
                              {(signatureAreasMap.get(imgIdx) || [])
                                .filter(area => imgIdx === currentIndex
                                  ? (area.pageNumber ?? 0) === currentPdfPage - 1
                                  : true)
                                .map((area) => {
                                  const allAreas = signatureAreasMap.get(imgIdx) || [];
                                  const areaIdx = allAreas.findIndex(a => a === area);
                                  return (
                                    <div
                                      key={areaIdx}
                                      className={`absolute border-2 flex items-center justify-center ${area.type === 'text' ? 'border-blue-500 bg-blue-500/10' : 'border-red-500 bg-red-500/10'}`}
                                      style={{
                                        position: "absolute",
                                        left: `${area.x}%`,
                                        top: `${area.y}%`,
                                        width: `${area.width}%`,
                                        height: `${area.height}%`,
                                        pointerEvents: "auto",
                                        cursor: imgIdx === currentIndex ? "pointer" : "default",
                                      }}
                                      onClick={() => imgIdx === currentIndex && handleRemoveArea(areaIdx)}
                                    >
                                      <span className={`text-xs font-medium ${area.type === 'text' ? 'text-blue-600' : 'text-red-600'}`}>
                                        {area.type === 'text' ? `${t("upload.textArea")} ${areaIdx + 1}` : `${t("upload.signature")} ${areaIdx + 1}`}
                                      </span>
                                    </div>
                                  );
                                })}
                            </>
                          ) : (
                            <>
                              <img
                                src={img.dataUrl}
                                alt={`Document ${imgIdx + 1}`}
                                className="w-full h-auto object-contain block"
                                draggable="false"
                                style={{ userSelect: "none", WebkitUserSelect: "none" }}
                              />
                              {(signatureAreasMap.get(imgIdx) || []).map((area, areaIdx) => (
                                <div
                                  key={areaIdx}
                                  className={`absolute border-2 flex items-center justify-center ${area.type === 'text' ? 'border-blue-500 bg-blue-500/10' : 'border-red-500 bg-red-500/10'}`}
                                  style={{
                                    position: "absolute",
                                    left: `${area.x}%`,
                                    top: `${area.y}%`,
                                    width: `${area.width}%`,
                                    height: `${area.height}%`,
                                    pointerEvents: "auto",
                                    cursor: imgIdx === currentIndex ? "pointer" : "default",
                                  }}
                                  onClick={() => imgIdx === currentIndex && handleRemoveArea(areaIdx)}
                                >
                                  <span className={`text-xs font-medium ${area.type === 'text' ? 'text-blue-600' : 'text-red-600'}`}>
                                    {area.type === 'text' ? `${t("upload.textArea")} ${areaIdx + 1}` : `${t("upload.signature")} ${areaIdx + 1}`}
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Validation Modal */}
      <Dialog open={showValidationModal} onOpenChange={setShowValidationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t("upload.noSignatureAreaWarningTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("upload.noSignatureAreaWarningDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {missingAreaIndices.map((idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <span className="text-sm text-yellow-800">
                  {t("upload.noSignatureAreaWarningItem").replace("{index}", String(idx + 1))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGoToMissingImage(idx)}
                >
                  {t("upload.goToImage")}
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationModal(false)}>
              {t("upload.clear") === "지우기" ? "닫기" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
