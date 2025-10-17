"use client";

import {
  updateSignatureAreas,
  getSignedDocumentUrl,
  deleteDocument,
} from "@/app/actions/document-actions";
import AreaSelector from "@/components/area-selector";
import DeleteDocumentModal from "@/components/delete-document-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import { ProjectBreadcrumb } from "@/components/breadcrumb";
import type {
  Document,
  Signature,
  SignatureArea,
} from "@/lib/supabase/database.types";
import {
  getImageNaturalDimensions,
  convertSignatureAreaToPercent,
  ensureRelativeCoordinate,
  convertSignatureAreaToPixels,
  type RelativeSignatureArea,
} from "@/lib/utils";
import { Edit, Download, Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentDetailComponentProps {
  documentData: Document;
  signatures: Signature[];
}

export default function DocumentDetailComponent({
  documentData,
  signatures,
}: DocumentDetailComponentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();

  const [document, setDocument] = useState<Document>(documentData);
  const [signatureAreas, setSignatureAreas] = useState<RelativeSignatureArea[]>([]);
  const [signatureData, setSignatureData] = useState<Signature[]>(signatures);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedAlias, setEditedAlias] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<{ top: number; left: number }>({ top: 0, left: 0 });
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">{t("status.draft")}</Badge>;
      case "published":
        return <Badge variant="default">{t("status.published")}</Badge>;
      case "completed":
        return <Badge variant="success">{t("status.completed")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEditModeToggle = () => {
    if (document.status === "draft") {
      if (!isEditMode) {
        // Entering edit mode - load existing signature areas and alias
        setSignatureAreas(signatures.map((sig) => ({
          x: sig.x,
          y: sig.y,
          width: sig.width,
          height: sig.height,
        })));
        setEditedAlias(document.alias || "");
      } else {
        // Exiting edit mode - clear signature areas and reset alias
        setSignatureAreas([]);
        setEditedAlias("");
      }
      setIsEditMode(!isEditMode);
      setError(null);
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

  const handleAreaSelected = (area: RelativeSignatureArea) => {
    // Store the area coordinates as relative percentages (same as DocumentUpload)
    setSignatureAreas([...signatureAreas, area]);
    setIsSelecting(false);

    // Restore scroll position after state updates
    requestAnimationFrame(() => {
      if (documentContainerRef.current) {
        documentContainerRef.current.scrollTop = scrollPositionRef.current.top;
        documentContainerRef.current.scrollLeft = scrollPositionRef.current.left;
      }
    });
  };

  const handleRemoveArea = (index: number) => {
    const updatedAreas = [...signatureAreas];
    updatedAreas.splice(index, 1);
    setSignatureAreas(updatedAreas);
  };

  const handleSaveChanges = async () => {
    if (document.status !== "draft") return;

    setIsLoading(true);
    setError(null);

    try {
      // Store relative coordinates directly (no conversion needed)
      const relativeAreas: SignatureArea[] = signatureAreas.map(area => ({
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      }));

      // Update signature areas
      const result = await updateSignatureAreas(document.id, relativeAreas);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Update alias if changed
      const trimmedAlias = editedAlias.trim();
      const currentAlias = document.alias || "";

      if (trimmedAlias !== currentAlias) {
        // Import updateDocumentAlias dynamically
        const { updateDocumentAlias } = await import("@/app/actions/document-actions");
        const aliasResult = await updateDocumentAlias(document.id, trimmedAlias || null);

        if (aliasResult.error) {
          setError(aliasResult.error);
          return;
        }

        // Update local document state with new alias for immediate UI update
        setDocument(prev => ({
          ...prev,
          alias: trimmedAlias || null
        }));
      }

      setIsEditMode(false);
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error updating document:", error);
      setError(t("documentDetail.errorUpdateArea"));
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownloadSignedDocument = () => {
    if (!isCompleted || !signedDocumentUrl) return;
    if (typeof window === 'undefined') return;

    try {
      // 새 탭에서 다운로드 URL 열기
      window.open(signedDocumentUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      setError(t("documentDetail.errorDownload"));
    }
  };

  const handleDeleteDocument = async () => {
    // Allow deletion for both draft and completed documents
    if (document.status !== "draft" && document.status !== "completed") {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteDocument(document.id);

      if (result.error) {
        setError(result.error);
        return;
      }

      // 삭제 성공시 대시보드로 강제 새로고침하여 이동
      if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error("❌ Error deleting document:", error);
      setError(t("documentDetail.errorDelete"));
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const canEdit = document.status === "draft";
  const canDelete = document.status === "draft" || document.status === "completed";
  const isCompleted = document.status === "completed";

  // Display alias if exists, otherwise show filename
  const displayName = document.alias || document.filename;

  // Set mounted state on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load original document URL from private storage using authenticated download
  useEffect(() => {
    const loadDocumentUrl = async () => {
      if (document.file_url) {
        const supabase = createClientSupabase();
        const { data, error } = await supabase.storage
          .from('documents')
          .download(document.file_url);

        if (error) {
          console.error('Failed to load document:', error);
          return;
        }

        if (data) {
          // Create blob URL from downloaded data
          const url = URL.createObjectURL(data);
          setDocumentUrl(url);
        }
      }
    };

    loadDocumentUrl();

    // Cleanup: revoke blob URL when component unmounts
    return () => {
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [document.file_url]);

  // 완료된 문서의 경우 signed URL 가져오기
  useEffect(() => {
    if (isCompleted && document.signed_file_url) {
      getSignedDocumentUrl(document.id).then((result) => {
        if (result.signedUrl) {
          setSignedDocumentUrl(result.signedUrl);
        } else {
          console.error('Failed to get signed document URL:', result.error);
        }
      });
    }
  }, [isCompleted, document.id, document.signed_file_url]);

  // Force re-render when image loads to ensure signature areas display correctly
  useEffect(() => {
    if (imageLoaded && documentContainerRef.current) {
      // Trigger a small state update to force re-render
      const timer = setTimeout(() => {
        setSignatureAreas(prev => [...prev]);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [imageLoaded]);

  // Zoom handlers
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

  // Simplified touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && !isSelecting) {
      // Two finger touch - start document panning
      e.preventDefault();
      setIsDragging(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setDragStart({ x: centerX, y: centerY });
    }
    // Single touch does nothing in document view mode (unless in selection mode)
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

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // 상태에 따라 표시할 이미지 결정
  const displayImageUrl = (() => {
    // 완료된 문서이고 서명된 문서 URL이 있으면 서명된 문서 표시
    if (isCompleted && signedDocumentUrl) {
      return signedDocumentUrl;
    }
    // 그 외의 경우 원본 문서 표시 (Blob URL만 사용, 로드 전까지는 빈 문자열)
    return documentUrl || "";
  })();

  return (
    <div className="container mx-auto px-6 py-6 sm:px-4 sm:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        {/* Header */}
        <div className="mb-6 sm:mb-8"></div>

        {/* Document Info */}
        <div className="mb-8 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">
              {displayName}
            </h1>
            <div className="self-start sm:self-center">
              {getStatusBadge(document.status)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8">
            {/* Mobile Layout */}
            <div className="sm:hidden">
              {!isEditMode ? (
                <>
                  {/* Draft State - Edit and Delete Actions */}
                  {canEdit && (
                    <div className="flex justify-between items-center mb-8">
                      {/* Left Group - Edit & Delete */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleEditModeToggle}
                          disabled={isLoading}
                          className="h-9 px-3 text-sm font-medium border-2 hover:bg-gray-50"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          {t("documentDetail.edit")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setIsDeleteModalOpen(true)}
                          disabled={isLoading}
                          className="h-9 px-3 text-sm font-medium"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {t("documentDetail.delete")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Completed State - Download and Delete */}
                  {isCompleted && (
                    <div className="flex justify-between items-center mb-8">
                      <Button
                        variant="outline"
                        onClick={handleDownloadSignedDocument}
                        disabled={isLoading || !signedDocumentUrl}
                        className="h-9 px-3 text-sm font-medium border-2 hover:bg-gray-50"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {t("documentDetail.download")}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="destructive"
                          onClick={() => setIsDeleteModalOpen(true)}
                          disabled={isLoading}
                          className="h-9 px-3 text-sm font-medium"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {t("documentDetail.delete")}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Edit Mode - Actions and Alias Input */}
                  <div className="space-y-4 mb-8">
                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      {/* Left Group - Cancel & Add Area */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={handleEditModeToggle}
                          disabled={isLoading}
                          className="h-9 px-3 text-sm font-medium border-2 hover:bg-gray-50"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          {t("documentDetail.cancel")}
                        </Button>
                        <Button
                          onClick={handleAddSignatureArea}
                          disabled={isLoading}
                          className="h-9 px-3 text-sm font-medium border-2 hover:bg-gray-50"
                          variant="outline"
                        >
                          {t("documentDetail.addArea")}
                        </Button>
                      </div>
                      {/* Right Group - Save */}
                      <Button
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className="h-9 px-3 text-sm font-medium bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? t("documentDetail.saving") : t("documentDetail.save")}
                      </Button>
                    </div>
                    
                    {/* Alias Input Field */}
                    <div className="space-y-2">
                      <Label htmlFor="alias-mobile" className="text-sm font-medium">
                        {t("upload.alias")}
                        <span className="ml-1 text-xs text-gray-500">({t("upload.aliasOptional")})</span>
                      </Label>
                      <Input
                        id="alias-mobile"
                        type="text"
                        value={editedAlias}
                        onChange={(e) => setEditedAlias(e.target.value)}
                        placeholder={t("upload.aliasPlaceholder")}
                        disabled={isLoading}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">{t("upload.aliasDescription")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:block">
              {!isEditMode ? (
                <>
                  {/* Draft State - Edit and Delete Actions */}
                  {canEdit && (
                    <div className="flex justify-between items-center mb-8">
                      {/* Left Group - Edit & Delete */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleEditModeToggle}
                          disabled={isLoading}
                          className="h-10 px-4 text-sm font-medium border-2 hover:bg-gray-50"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t("documentDetail.edit")}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => setIsDeleteModalOpen(true)}
                          disabled={isLoading}
                          className="h-10 px-4 text-sm font-medium"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("documentDetail.delete")}
                        </Button>
                      </div>
                    </div>
                  )}
                  {/* Completed State - Download and Delete */}
                  {isCompleted && (
                    <div className="flex justify-between items-center mb-8">
                      <Button
                        variant="outline"
                        onClick={handleDownloadSignedDocument}
                        disabled={isLoading || !signedDocumentUrl}
                        className="h-10 px-4 text-sm font-medium border-2 hover:bg-gray-50"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t("documentDetail.download")}
                      </Button>
                      {canDelete && (
                        <Button
                          variant="destructive"
                          onClick={() => setIsDeleteModalOpen(true)}
                          disabled={isLoading}
                          className="h-10 px-4 text-sm font-medium"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("documentDetail.delete")}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Edit Mode - Actions and Alias Input */}
                  <div className="space-y-4 mb-8">
                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      {/* Left Group - Cancel & Add Area */}
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleEditModeToggle}
                          disabled={isLoading}
                          className="h-10 px-4 text-sm font-medium border-2 hover:bg-gray-50"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t("documentDetail.cancel")}
                        </Button>
                        <Button
                          onClick={handleAddSignatureArea}
                          disabled={isLoading}
                          className="h-10 px-4 text-sm font-medium border-2 hover:bg-gray-50"
                          variant="outline"
                        >
                          {t("documentDetail.addArea")}
                        </Button>
                      </div>
                      {/* Right Group - Save */}
                      <Button
                        onClick={handleSaveChanges}
                        disabled={isLoading}
                        className="h-10 px-4 text-sm font-medium bg-green-600 hover:bg-green-700"
                      >
                        {isLoading ? t("documentDetail.saving") : t("documentDetail.save")}
                      </Button>
                    </div>

                    {/* Alias Input Field */}
                    <div className="space-y-2">
                      <Label htmlFor="alias-desktop" className="text-sm font-medium">
                        {t("upload.alias")}
                        <span className="ml-1 text-xs text-gray-500">({t("upload.aliasOptional")})</span>
                      </Label>
                      <Input
                        id="alias-desktop"
                        type="text"
                        value={editedAlias}
                        onChange={(e) => setEditedAlias(e.target.value)}
                        placeholder={t("upload.aliasPlaceholder")}
                        disabled={isLoading}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500">{t("upload.aliasDescription")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>


          {error && (
            <div className="mb-6 sm:mb-6 mx-1 sm:mx-0 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm sm:text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="relative border rounded-lg overflow-hidden mx-1 sm:mx-0 mb-6">
          {/* Zoom Controls */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10 flex flex-col gap-2 sm:gap-2 bg-white/95 backdrop-blur-sm rounded-lg p-2 sm:p-2 shadow-lg border border-gray-200">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3 || (isEditMode && isSelecting)}
              className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
            >
              <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5 || (isEditMode && isSelecting)}
              className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
            >
              <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomReset}
              disabled={zoomLevel === 1 || (isEditMode && isSelecting)}
              className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <div className="text-xs text-center font-medium px-1 py-0.5 bg-gray-100 rounded">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>
          {isEditMode && isSelecting ? (
            <AreaSelector
              image={documentUrl || ""}
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
              className="relative overflow-auto max-h-[50vh] sm:max-h-[70vh]"
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
                {!displayImageUrl ? (
                  <div className="w-full h-96 flex items-center justify-center bg-gray-100">
                    <p className="text-gray-500">{t("documentDetail.loading")}</p>
                  </div>
                ) : (
                  <img
                    src={displayImageUrl}
                    alt={displayName}
                    className="w-full h-auto object-contain block"
                    draggable="false"
                    style={{ userSelect: "none", WebkitUserSelect: "none" }}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageLoaded(false)}
                  />
                )}
              {/* Signature Area Overlays - Only show for non-completed documents */}
              {!isCompleted && (isEditMode ? signatureAreas : signatures).map((area, index) => {
                // Find matching signature data
                const signatureInfo = signatureData.find(sig => sig.area_index === index);
                const hasSignature = signatureInfo && signatureInfo.signature_data;

                return (
                  <div
                    key={index}
                    className={`absolute border-2 flex items-center justify-center ${
                      hasSignature
                        ? "border-green-500 bg-green-500/10"
                        : isEditMode
                        ? "border-red-500 bg-red-500/10 cursor-pointer"
                        : "border-blue-500 bg-blue-500/10"
                    }`}
                    style={{
                      position: "absolute",
                      left: `${area.x}%`,
                      top: `${area.y}%`,
                      width: `${area.width}%`,
                      height: `${area.height}%`,
                      pointerEvents: (isCompleted || hasSignature) ? "none" : "auto",
                      cursor: isEditMode ? "pointer" : "default",
                    }}
                    onClick={
                      isEditMode ? () => handleRemoveArea(index) : undefined
                    }
                  >
                    {hasSignature ? (
                      <div className="w-full h-full relative">
                        <img
                          src={signatureInfo.signature_data!}
                          alt="Signature"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-medium ${
                          isEditMode ? "text-red-600" : "text-blue-600"
                        }`}
                      >
                        <span className="hidden sm:inline">{t("documentDetail.signatureArea")} {index + 1}</span>
                        <span className="sm:hidden">{index + 1}</span>
                      </span>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>


        {/* Delete Document Modal */}
        <DeleteDocumentModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteDocument}
          isLoading={isLoading}
          documentName={displayName}
        />
      </div>
    </div>
  );
}
