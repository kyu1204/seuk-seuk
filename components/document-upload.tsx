"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileImage, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [alias, setAlias] = useState<string>("");
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [signatureAreas, setSignatureAreas] = useState<RelativeSignatureArea[]>([]);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
      scrollPositionRef.current = {
        top: documentContainerRef.current.scrollTop,
        left: documentContainerRef.current.scrollLeft,
      };
    }
    setIsSelecting(true);
  };

  const handleAreaSelected = (area: RelativeSignatureArea, scrollPosition: { top: number; left: number }) => {
    // Store the area coordinates as relative percentages
    setSignatureAreas([...signatureAreas, area]);
    setIsSelecting(false);

    // Restore scroll position from AreaSelector (not the initial position)
    requestAnimationFrame(() => {
      if (documentContainerRef.current) {
        documentContainerRef.current.scrollTop = scrollPosition.top;
        documentContainerRef.current.scrollLeft = scrollPosition.left;
      }
    });
  };

  const handleRemoveArea = (index: number) => {
    const updatedAreas = [...signatureAreas];
    updatedAreas.splice(index, 1);
    setSignatureAreas(updatedAreas);
  };

  const handleClearDocument = () => {
    setDocument(null);
    setFileName("");
    setAlias("");
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


  // Simplified touch event handlers for document viewing
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two finger touch - start document panning
      e.preventDefault();
      setIsDragging(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setDragStart({ x: centerX, y: centerY });
    }
    // Single touch does nothing in document view mode (no area selection here)
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && isDragging && documentContainerRef.current) {
      // Two finger panning
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
      // All touches ended - stop panning
      setIsDragging(false);
    } else if (e.touches.length === 1 && isDragging) {
      // From two fingers to one finger - stop panning
      setIsDragging(false);
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
      if (alias.trim()) {
        formData.append("alias", alias.trim());
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
          {/* Button Group */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleAddSignatureArea}
                disabled={isSelecting}
              >
                {t("upload.addSignatureArea")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearDocument}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("upload.clear")}
              </Button>
            </div>
            <Button
              onClick={handleSaveDocument}
              disabled={
                signatureAreas.length === 0 || isLoading || !originalFile
              }
            >
              {isLoading ? t("upload.saving") : t("upload.save")}
            </Button>
          </div>

          {/* File Information Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="document-filename" className="text-sm font-medium">
                {t("upload.filename")}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">{fileName}</p>
            </div>

            <div>
              <Label htmlFor="document-alias" className="text-sm font-medium">
                {t("upload.alias")}
                <span className="text-muted-foreground ml-1">({t("upload.aliasOptional")})</span>
              </Label>
              <Input
                id="document-alias"
                type="text"
                placeholder={t("upload.aliasPlaceholder")}
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="mt-2"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("upload.aliasDescription")}
              </p>
            </div>
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
                initialScrollPosition={scrollPositionRef.current}
                zoomLevel={zoomLevel}
                onZoomChange={setZoomLevel}
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
