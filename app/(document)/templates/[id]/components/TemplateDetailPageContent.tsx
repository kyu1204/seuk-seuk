"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Edit,
  RotateCcw,
  Send,
  Trash2,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import AreaSelector from "@/components/area-selector";
import { ProjectBreadcrumb } from "@/components/breadcrumb";
import PdfPageRenderer, {
  type PdfPageDimensions,
} from "@/components/pdf-page-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/language-context";
import type {
  SignatureArea,
  TemplateWithAreas,
} from "@/lib/supabase/database.types";
import type { RelativeSignatureArea } from "@/lib/utils";
import {
  deleteTemplate,
  updateTemplate,
  getOwnedTemplateFileUrl,
} from "@/app/actions/template-actions";

interface TemplateDetailPageContentProps {
  template: TemplateWithAreas;
}

export function TemplateDetailPageContent({
  template,
}: TemplateDetailPageContentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef({ top: 0, left: 0 });

  const [templateName, setTemplateName] = useState(template.name);
  const [areas, setAreas] = useState<RelativeSignatureArea[]>(() =>
    template.template_signature_areas
      .filter(
        (area) =>
          area.x != null &&
          area.y != null &&
          area.width != null &&
          area.height != null
      )
      .sort((a, b) => a.area_index - b.area_index)
      .map((area) => ({
        x: area.x!,
        y: area.y!,
        width: area.width!,
        height: area.height!,
        type: area.area_type === "text" ? "text" : "signature",
        pageNumber: area.page_number ?? 0,
      }))
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentAreaType, setCurrentAreaType] = useState<"signature" | "text">(
    "signature"
  );
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [pdfPageImageForSelector, setPdfPageImageForSelector] = useState<
    string | null
  >(null);
  const [, setPdfPageDimensions] = useState<PdfPageDimensions | null>(null);

  const isPdf = template.file_type === "pdf";
  const totalPages = template.page_count || 1;
  const visibleAreas = areas
    .map((area, originalIndex) => ({ area, originalIndex }))
    .filter(({ area }) =>
      isPdf ? (area.pageNumber ?? 0) === currentPdfPage - 1 : true
    );

  useEffect(() => {
    let objectUrl: string | null = null;
    let active = true;

    const loadTemplateFile = async () => {
      const { url, error: urlError } = await getOwnedTemplateFileUrl(template.id);

      if (!active) return;

      if (urlError || !url) {
        console.error("Failed to load template file:", urlError);
        setError(
          t("templates.detail.loadFileError", "템플릿 파일을 불러오지 못했습니다.")
        );
        return;
      }

      const res = await fetch(url);
      const blob = await res.blob();
      if (!active) return;

      objectUrl = URL.createObjectURL(blob);
      setDocumentUrl(objectUrl);
    };

    loadTemplateFile();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [template.file_url, t]);

  const handleAddArea = async (areaType: "signature" | "text") => {
    if (documentContainerRef.current) {
      scrollPositionRef.current = {
        top: documentContainerRef.current.scrollTop,
        left: documentContainerRef.current.scrollLeft,
      };
    }

    setCurrentAreaType(areaType);

    if (isPdf) {
      const canvas = documentContainerRef.current?.querySelector("canvas");
      if (!canvas) {
        setError(
          t("templates.detail.pdfNotReady", "PDF 페이지가 아직 준비되지 않았습니다.")
        );
        return;
      }
      setPdfPageImageForSelector(canvas.toDataURL("image/png"));
    }

    setIsSelecting(true);
  };

  const handleAreaSelected = (
    area: RelativeSignatureArea,
    scrollPosition: { top: number; left: number }
  ) => {
    setAreas((prev) => [
      ...prev,
      {
        ...area,
        pageNumber: isPdf ? currentPdfPage - 1 : 0,
      },
    ]);
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
    if (!isEditMode) return;
    setAreas((prev) => prev.filter((_, index) => index !== areaIndex));
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError(t("templates.detail.nameRequired", "템플릿 이름을 입력하세요."));
      return;
    }

    setIsSaving(true);
    setError(null);

    const signatureAreas: SignatureArea[] = areas.map((area) => ({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      type: area.type || "signature",
      pageNumber: area.pageNumber ?? 0,
    }));

    try {
      const result = await updateTemplate(template.id, {
        name: templateName.trim(),
        signatureAreas,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success(t("templates.detail.saved", "템플릿이 저장되었습니다."));
      setIsEditMode(false);
      router.refresh();
    } catch (err) {
      console.error("Template update failed:", err);
      setError(t("templates.error", "오류가 발생했습니다."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        t("templates.detail.deleteConfirm", "이 템플릿을 삭제하시겠습니까?")
      )
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await deleteTemplate(template.id);
      if (result.error) {
        setError(result.error);
        return;
      }

      toast.success(t("templates.delete", "삭제"));
      router.push("/dashboard?tab=templates");
      router.refresh();
    } catch (err) {
      console.error("Template delete failed:", err);
      setError(t("templates.error", "오류가 발생했습니다."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  const handleMouseDown = (event: React.MouseEvent) => {
    const container = documentContainerRef.current;
    const canScroll =
      container &&
      (container.scrollWidth > container.clientWidth ||
        container.scrollHeight > container.clientHeight);

    if (canScroll && !isSelecting) {
      event.preventDefault();
      setIsDragging(true);
      setDragStart({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !documentContainerRef.current) return;

    event.preventDefault();
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    documentContainerRef.current.scrollLeft -= deltaX;
    documentContainerRef.current.scrollTop -= deltaY;
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length !== 2 || isSelecting) return;

    event.preventDefault();
    setIsDragging(true);
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    setDragStart({
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    });
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (
      event.touches.length !== 2 ||
      !isDragging ||
      !documentContainerRef.current
    ) {
      return;
    }

    event.preventDefault();
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;

    documentContainerRef.current.scrollLeft -= centerX - dragStart.x;
    documentContainerRef.current.scrollTop -= centerY - dragStart.y;
    setDragStart({ x: centerX, y: centerY });
  };

  return (
    <div className="container mx-auto px-6 py-6 sm:px-4 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <ProjectBreadcrumb />

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            {isEditMode ? (
              <div className="space-y-2">
                <Label htmlFor="template-name">
                  {t("templates.create.name", "템플릿 이름")}
                </Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  maxLength={100}
                  disabled={isSaving}
                />
              </div>
            ) : (
              <>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight break-words">
                  {templateName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {template.file_type.toUpperCase()} · {template.page_count}
                  {t("templates.detail.pageUnit", "페이지")} · {areas.length}
                  {t("templates.detail.areaUnit", "개 영역")}
                </p>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(false)}
                  disabled={isSaving}
                >
                  {t("documentDetail.cancel", "취소")}
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving
                    ? t("documentDetail.saving", "저장 중...")
                    : t("documentDetail.save", "저장")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditMode(true)}
                  disabled={isSaving}
                >
                  <Edit className="mr-1.5 h-4 w-4" />
                  {t("documentDetail.edit", "수정")}
                </Button>
                <Button asChild variant="outline" disabled={isSaving}>
                  <Link href={`/dashboard?tab=templates&publishTemplate=${template.id}`}>
                    <Send className="mr-1.5 h-4 w-4" />
                    {t("templates.publish", "이 템플릿으로 발행")}
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSaving}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  {t("templates.delete", "삭제")}
                </Button>
              </>
            )}
          </div>
        </div>

        {isEditMode && (
          <Card className="mb-4">
            <CardContent className="p-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                {t(
                  "templates.detail.editHelp",
                  "서명/텍스트 영역을 추가하거나 기존 영역을 클릭해서 제거하세요."
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArea("signature")}
                  disabled={isSaving || isSelecting}
                >
                  {t("upload.addSignatureArea", "서명 영역 추가")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddArea("text")}
                  disabled={isSaving || isSelecting}
                >
                  <Type className="mr-1 h-4 w-4" />
                  {t("upload.addTextArea", "텍스트 영역 추가")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {isPdf && totalPages > 1 && (
          <div className="mb-4 flex items-center justify-center gap-3 rounded-lg bg-muted/30 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPdfPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPdfPage <= 1 || isSelecting}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
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
              onClick={() =>
                setCurrentPdfPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPdfPage >= totalPages || isSelecting}
            >
              {t("pdf_next_page")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="relative mb-6 overflow-hidden rounded-lg border">
          <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white/95 p-2 shadow-lg backdrop-blur-sm">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3 || isSelecting}
              className="h-8 w-8 p-2"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5 || isSelecting}
              className="h-8 w-8 p-2"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomReset}
              disabled={zoomLevel === 1 || isSelecting}
              className="h-8 w-8 p-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <div className="rounded bg-gray-100 px-1 py-0.5 text-center text-xs font-medium">
              {Math.round(zoomLevel * 100)}%
            </div>
          </div>

          {isEditMode && isSelecting ? (
            <AreaSelector
              image={isPdf ? pdfPageImageForSelector || "" : documentUrl || ""}
              onAreaSelected={handleAreaSelected}
              onCancel={() => {
                setIsSelecting(false);
                setPdfPageImageForSelector(null);
              }}
              existingAreas={visibleAreas.map(({ area }) => area)}
              initialScrollPosition={scrollPositionRef.current}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              areaType={currentAreaType}
            />
          ) : (
            <div
              ref={documentContainerRef}
              className="relative max-h-[50vh] overflow-auto sm:max-h-[70vh]"
              style={{
                cursor: isDragging ? "grabbing" : "grab",
                touchAction: "none",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
            >
              <div
                className="relative inline-block"
                style={{ width: `${100 * zoomLevel}%`, height: "auto" }}
              >
                {!documentUrl ? (
                  <div className="flex h-96 w-full items-center justify-center bg-gray-100">
                    <p className="text-gray-500">
                      {t("documentDetail.loading", "로딩 중...")}
                    </p>
                  </div>
                ) : isPdf ? (
                  <PdfPageRenderer
                    pdfUrl={documentUrl}
                    currentPage={currentPdfPage}
                    zoomLevel={1}
                    onPageDimensionsChange={setPdfPageDimensions}
                  />
                ) : (
                  <img
                    src={documentUrl}
                    alt={templateName}
                    className="block h-auto w-full object-contain"
                    draggable="false"
                    style={{ userSelect: "none", WebkitUserSelect: "none" }}
                  />
                )}

                {visibleAreas.map(({ area, originalIndex }) => {
                  const isText = area.type === "text";
                  return (
                    <div
                      key={originalIndex}
                      className={`absolute flex items-center justify-center border-2 ${
                        isText
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-blue-500 bg-blue-500/10"
                      } ${isEditMode ? "cursor-pointer" : ""}`}
                      style={{
                        left: `${area.x}%`,
                        top: `${area.y}%`,
                        width: `${area.width}%`,
                        height: `${area.height}%`,
                      }}
                      onClick={() => handleRemoveArea(originalIndex)}
                    >
                      <span
                        className={`text-xs font-medium ${
                          isText ? "text-indigo-600" : "text-blue-600"
                        }`}
                      >
                        <span className="hidden sm:inline">
                          {isText
                            ? `${t("upload.textArea", "텍스트")} ${originalIndex + 1}`
                            : `${t("upload.signature", "서명")} ${originalIndex + 1}`}
                        </span>
                        <span className="sm:hidden">{originalIndex + 1}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
