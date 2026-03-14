"use client";

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Use local worker file from public/ to avoid CDN issues and iOS Safari compatibility problems
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export interface PdfPageDimensions {
  width: number;
  height: number;
}

export interface PdfPageRendererRef {
  getPageDimensions: () => PdfPageDimensions | null;
}

interface PdfPageRendererProps {
  pdfUrl: string;
  currentPage: number;
  zoomLevel: number;
  onTotalPagesChange?: (totalPages: number) => void;
  onPageDimensionsChange?: (dimensions: PdfPageDimensions) => void;
  onLoadError?: (error: string) => void;
  className?: string;
}

const PdfPageRenderer = forwardRef<PdfPageRendererRef, PdfPageRendererProps>(
  (
    {
      pdfUrl,
      currentPage,
      zoomLevel,
      onTotalPagesChange,
      onPageDimensionsChange,
      onLoadError,
      className = "",
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageDimensions, setPageDimensions] = useState<PdfPageDimensions | null>(null);
    const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
    const loadingTaskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);

    useImperativeHandle(ref, () => ({
      getPageDimensions: () => pageDimensions,
    }));

    // Load PDF document
    useEffect(() => {
      if (!pdfUrl) return;

      let cancelled = false;

      const loadPdf = async () => {
        try {
          setIsLoading(true);

          // Cancel any existing render task
          if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
          }

          // Destroy previous PDF document and loading task
          if (loadingTaskRef.current) {
            await loadingTaskRef.current.destroy().catch(() => {});
            loadingTaskRef.current = null;
          }

          // Handle data URLs by converting to binary data
          let loadingTask;
          if (pdfUrl.startsWith("data:")) {
            const base64 = pdfUrl.split(",")[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            loadingTask = pdfjsLib.getDocument({
              data: bytes,
              cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            });
          } else {
            loadingTask = pdfjsLib.getDocument({
              url: pdfUrl,
              cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
              cMapPacked: true,
            });
          }

          loadingTaskRef.current = loadingTask;
          const pdf = await loadingTask.promise;

          if (cancelled) return;

          setPdfDoc(pdf);
          onTotalPagesChange?.(pdf.numPages);
        } catch (err) {
          if (cancelled) return;
          console.error("PDF load error:", err);
          setIsLoading(false);
          setPdfDoc(null);
          onLoadError?.("PDF 파일을 불러올 수 없습니다.");
        }
      };

      loadPdf();

      return () => {
        cancelled = true;
        // Destroy loading task and PDF resources on cleanup
        if (loadingTaskRef.current) {
          loadingTaskRef.current.destroy().catch(() => {});
          loadingTaskRef.current = null;
        }
      };
    }, [pdfUrl]);

    // Render current page
    useEffect(() => {
      if (!pdfDoc || !canvasRef.current) return;

      let cancelled = false;

      const renderPage = async () => {
        try {
          // Cancel previous render
          if (renderTaskRef.current) {
            renderTaskRef.current.cancel();
            renderTaskRef.current = null;
          }

          const page = await pdfDoc.getPage(currentPage); // pdf.js pages are 1-indexed

          if (cancelled) return;

          // Dynamically adjust scale based on device canvas pixel limits
          // iOS Safari has stricter limits: ~8MP on older devices, ~16MP on newer
          const defaultScale = 2;
          const originalViewportForCalc = page.getViewport({ scale: defaultScale });
          const totalPixels = originalViewportForCalc.width * originalViewportForCalc.height;

          // iOS devices have lower canvas pixel limits
          const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          const maxPixels = isIOS ? 8_000_000 : 16_000_000;

          const baseScale = totalPixels > maxPixels
            ? defaultScale * Math.sqrt(maxPixels / totalPixels)
            : defaultScale;

          const viewport = page.getViewport({ scale: baseScale });

          const canvas = canvasRef.current;
          if (!canvas) return;

          const context = canvas.getContext("2d");
          if (!context) {
            console.error("Failed to get canvas 2d context - device may have insufficient memory");
            onLoadError?.("이 기기에서 PDF를 표시할 수 없습니다. 메모리가 부족합니다.");
            setIsLoading(false);
            return;
          }

          // Set canvas dimensions to the viewport size
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // Store original page dimensions (at scale 1) for coordinate calculations
          const originalViewport = page.getViewport({ scale: 1 });
          const dims: PdfPageDimensions = {
            width: originalViewport.width,
            height: originalViewport.height,
          };
          setPageDimensions(dims);
          onPageDimensionsChange?.(dims);

          setIsLoading(true);

          const renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
          });
          renderTaskRef.current = renderTask;

          await renderTask.promise;

          if (!cancelled) {
            setIsLoading(false);
          }
        } catch (err: any) {
          if (cancelled || err?.name === "RenderingCancelledException") return;
          console.error("PDF render error:", err);
          setIsLoading(false);
          onLoadError?.("PDF 페이지를 렌더링할 수 없습니다.");
        }
      };

      renderPage();

      return () => {
        cancelled = true;
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
      };
    }, [pdfDoc, currentPage]);

    return (
      <div className={`relative inline-block ${className}`} style={{ width: `${100 * zoomLevel}%` }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          style={{ imageRendering: "auto" }}
        />
      </div>
    );
  }
);

PdfPageRenderer.displayName = "PdfPageRenderer";

export default PdfPageRenderer;
