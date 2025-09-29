"use client";

import type React from "react";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileImage, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AreaSelector from "@/components/area-selector";
import {
  uploadDocument,
  createSignatureAreas,
} from "@/app/actions/document-actions";
import { useLanguage } from "@/contexts/language-context";
import type { SignatureArea } from "@/lib/supabase/database.types";
import {
  getImageNaturalDimensions,
  convertSignatureAreaToPixels,
  ensureRelativeCoordinate,
  type RelativeSignatureArea,
} from "@/lib/utils";

export default function DocumentUpload() {
  const { t } = useLanguage();
  const router = useRouter();
  const [document, setDocument] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [signatureAreas, setSignatureAreas] = useState<RelativeSignatureArea[]>([]);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setOriginalFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        setDocument(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSignatureArea = () => {
    // Save current scroll position before switching to selection mode
    if (documentContainerRef.current) {
      const scrollTop = documentContainerRef.current.scrollTop;
      const scrollLeft = documentContainerRef.current.scrollLeft;

      setScrollPosition({
        top: scrollTop,
        left: scrollLeft,
      });
    }
    setIsSelecting(true);
  };

  const handleAreaSelected = (area: RelativeSignatureArea) => {
    // Store the area coordinates as relative percentages
    setSignatureAreas([...signatureAreas, area]);
    setIsSelecting(false);
  };

  const handleRemoveArea = (index: number) => {
    const updatedAreas = [...signatureAreas];
    updatedAreas.splice(index, 1);
    setSignatureAreas(updatedAreas);
  };

  const handleClearDocument = () => {
    setDocument(null);
    setFileName("");
    setOriginalFile(null);
    setSignatureAreas([]);
    setError(null);
    setZoomLevel(1);
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
    // Allow dragging when zoomed or when content overflows container
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

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1) {
      // Single touch - check for double tap
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime;

      if (timeDiff < 300 && timeDiff > 0) {
        // Double tap detected - toggle zoom
        if (zoomLevel === 1) {
          setZoomLevel(2);
        } else {
          setZoomLevel(1);
        }
      }
      setLastTapTime(currentTime);

      // Start dragging for panning - allow at any zoom level if content overflows
      const container = documentContainerRef.current;
      const canScroll = container && (
        container.scrollWidth > container.clientWidth ||
        container.scrollHeight > container.clientHeight
      );

      if (canScroll) {
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setTouchStartZoom(zoomLevel);
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging && documentContainerRef.current) {
      // Single touch panning
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;

      documentContainerRef.current.scrollLeft -= deltaX;
      documentContainerRef.current.scrollTop -= deltaY;

      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.min(Math.max(touchStartZoom * scale, 0.5), 3);
        setZoomLevel(newZoom);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 0) {
      setIsDragging(false);
      setLastTouchDistance(0);
    } else if (e.touches.length === 1) {
      // Switch from pinch to pan
      setLastTouchDistance(0);
      setTouchStartZoom(zoomLevel);
    }
  };

  const handleSaveDocument = async () => {
    if (!originalFile || signatureAreas.length === 0) {
      setError("Please upload a document and add at least one signature area");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Upload document (without signature areas)
      const formData = new FormData();
      formData.append("file", originalFile);
      formData.append("filename", fileName);

      const uploadResult = await uploadDocument(formData);

      if (uploadResult.error) {
        setError(uploadResult.error);
        return;
      }

      if (!uploadResult.success || !uploadResult.document) {
        setError("Failed to upload document");
        return;
      }

      // Step 2: Create signature areas
      // Store relative coordinates directly (no conversion needed)
      const relativeAreas: SignatureArea[] = signatureAreas.map(area => ({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      }));

      const areasResult = await createSignatureAreas(
        uploadResult.document.id,
        relativeAreas
      );

      if (areasResult.error) {
        setError(areasResult.error);
        return;
      }

      // Success: Redirect to document detail page
      router.push(`/document/${uploadResult.document.id}`);
    } catch (error) {
      console.error("Error uploading document:", error);
      setError("An unexpected error occurred while uploading the document");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!document ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="rounded-full bg-primary/10 p-4">
                <FileImage className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-medium text-lg">{t("upload.title")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("upload.description")}
                </p>
              </div>
              <label htmlFor="document-upload">
                <div className="cursor-pointer">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {t("upload.button")}
                  </Button>
                </div>
                <input
                  id="document-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={handleClearDocument}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("upload.clear")}
            </Button>
          </div>

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
                image={document}
                onAreaSelected={handleAreaSelected}
                onCancel={() => setIsSelecting(false)}
                existingAreas={signatureAreas}
                initialScrollPosition={scrollPosition}
              />
            ) : (
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
                  <img
                    src={document || "/placeholder.svg"}
                    alt="Document"
                    className="w-full h-auto object-contain block"
                    draggable="false"
                    style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  />
                  {signatureAreas.map((area, index) => (
                    <div
                      key={index}
                      className="absolute border-2 border-red-500 bg-red-500/10 flex items-center justify-center"
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
                      <span className="text-xs font-medium text-red-600">
                        {t("upload.signature")} {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleAddSignatureArea} disabled={isSelecting}>
              {t("upload.addSignatureArea")}
            </Button>
            <Button
              variant="default"
              onClick={handleSaveDocument}
              disabled={
                signatureAreas.length === 0 || isLoading || !originalFile
              }
              className="ml-auto"
            >
              {isLoading ? "저장 중..." : "저장하기"}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
