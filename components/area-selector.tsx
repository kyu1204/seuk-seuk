"use client";

import type React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

// Import the useLanguage hook at the top of the file
import { useLanguage } from "@/contexts/language-context";
import { calculateImageLayout } from "@/lib/coordinate-utils";

interface AreaSelectorProps {
  image: string;
  onAreaSelected: (area: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  onCancel: () => void;
  existingAreas?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export default function AreaSelector({
  image,
  onAreaSelected,
  onCancel,
  existingAreas = [],
}: AreaSelectorProps) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  // 스크롤 관련 변수들 제거 (페이지 스크롤로 통합)

  // Add the useLanguage hook inside the component
  const { t } = useLanguage();

  // Note: 페이지 스크롤로 통합하여 별도 초기화 불필요

  const getCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageRef.current) return { x: 0, y: 0 };

    const containerRect = containerRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();

    // Calculate coordinates relative to the image element directly
    let x = clientX - imageRect.left;
    let y = clientY - imageRect.top;

    // object-fit: contain을 고려한 실제 이미지 영역 계산
    if (imageRef.current.complete) {
      const {
        imageOffsetX,
        imageOffsetY,
        actualDisplayWidth,
        actualDisplayHeight,
      } = calculateImageLayout(
        imageRect.width,
        imageRect.height,
        imageRef.current.naturalWidth,
        imageRef.current.naturalHeight
      );

      // 이미지 실제 영역 내 좌표로 변환
      x = x - imageOffsetX;
      y = y - imageOffsetY;

      // 이미지 영역 내로 제한
      x = Math.max(0, Math.min(actualDisplayWidth, x));
      y = Math.max(0, Math.min(actualDisplayHeight, y));
    }

    console.log("🎯 좌표 계산:", {
      clientX,
      clientY,
      imageRect: {
        left: imageRect.left,
        top: imageRect.top,
        width: imageRect.width,
        height: imageRect.height,
      },
      calculatedX: x,
      calculatedY: y,
    });
    return { x, y };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("🖱️ 마우스 다운 이벤트:", {
      clientX: e.clientX,
      clientY: e.clientY,
    });

    const { x, y } = getCoordinates(e.clientX, e.clientY);
    console.log("🎯 시작 좌표:", { x, y });
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isSelecting) return;

    const { x, y } = getCoordinates(e.clientX, e.clientY);
    setCurrentPos({ x, y });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();

    console.log("🖱️ 마우스 업 이벤트:", { isSelecting, startPos, currentPos });

    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      console.log("📏 영역 크기:", { x, y, width, height });

      if (width > 10 && height > 10) {
        console.log("✅ 영역 선택 완료!");
        onAreaSelected({ x, y, width, height });
      } else {
        console.log("❌ 영역이 너무 작습니다");
      }
    }

    setIsSelecting(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch.clientX, touch.clientY);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
    setIsSelecting(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (!isSelecting) return;

    const touch = e.touches[0];
    const { x, y } = getCoordinates(touch.clientX, touch.clientY);
    setCurrentPos({ x, y });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();

    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      if (width > 10 && height > 10) {
        onAreaSelected({ x, y, width, height });
      }
    }

    setIsSelecting(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Global mouse event handlers for outside container
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isSelecting || !containerRef.current) return;

      const { x, y } = getCoordinates(e.clientX, e.clientY);
      setCurrentPos({ x, y });
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!isSelecting) return;

      console.log("🖱️ 전역 마우스 업 이벤트:", {
        isSelecting,
        startPos,
        currentPos,
      });

      if (startPos && currentPos) {
        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        console.log("📏 전역 영역 크기:", { x, y, width, height });

        if (width > 10 && height > 10) {
          console.log("✅ 전역 영역 선택 완료!");
          onAreaSelected({ x, y, width, height });
        } else {
          console.log("❌ 전역 영역이 너무 작습니다");
        }
      }

      setIsSelecting(false);
      setStartPos(null);
      setCurrentPos(null);
    };

    if (isSelecting) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isSelecting, startPos, currentPos, onAreaSelected, getCoordinates]);

  useEffect(() => {
    // Disable body scrolling when selecting an area
    if (isSelecting) {
      // Save the current body overflow style
      const originalBodyStyle = window.getComputedStyle(document.body).overflow;
      // Prevent scrolling on the entire body
      document.body.style.overflow = "hidden";

      // Re-enable scrolling when done
      return () => {
        document.body.style.overflow = originalBodyStyle;
      };
    }
  }, [isSelecting]);

  // Cleanup effect to ensure body scrolling is re-enabled if component unmounts during selection
  useEffect(() => {
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isSelecting]);

  // ESC key handler to cancel area selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        console.log("🔑 [AreaSelector] ESC key pressed, canceling selection");

        // Reset selection state
        if (isSelecting) {
          setIsSelecting(false);
          setStartPos(null);
          setCurrentPos(null);
          document.body.style.overflow = "auto";
        }

        // Call onCancel to exit area selection mode
        onCancel();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, isSelecting]);

  // Handle cancel button click
  const handleCancel = () => {
    console.log("❌ [AreaSelector] Cancel button clicked");

    // Reset selection state
    if (isSelecting) {
      setIsSelecting(false);
      setStartPos(null);
      setCurrentPos(null);
      document.body.style.overflow = "auto";
    }

    // Call onCancel to exit area selection mode
    onCancel();
  };

  return (
    <div className="relative">
      {/* Cancel button and instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            {t("upload.areaSelectorInstructions")}
          </p>
          <p className="text-xs text-gray-500">
            {t("upload.areaSelectorEscHint")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="w-full"
          >
            {t("upload.cancel")}
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: "none",
        }}
      >
        <img
          ref={imageRef}
          src={image || "/placeholder.svg"}
          alt="Document"
          className="w-full h-auto object-contain"
          draggable="false"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        />

        {/* Show existing areas */}
        {existingAreas.map((area, index) => {
          // object-fit: contain을 고려한 정확한 위치 계산
          let adjustedX = area.x;
          let adjustedY = area.y;

          if (imageRef.current && imageRef.current.complete) {
            const containerRect = imageRef.current.getBoundingClientRect();
            const { imageOffsetX, imageOffsetY } = calculateImageLayout(
              containerRect.width,
              containerRect.height,
              imageRef.current.naturalWidth,
              imageRef.current.naturalHeight
            );
            adjustedX = area.x + imageOffsetX;
            adjustedY = area.y + imageOffsetY;
          }

          return (
            <div
              key={index}
              className="absolute border-2 border-green-500 bg-green-500/10 flex items-center justify-center pointer-events-none"
              style={{
                left: `${adjustedX}px`,
                top: `${adjustedY}px`,
                width: `${area.width}px`,
                height: `${area.height}px`,
              }}
            >
              <span className="text-xs font-medium text-green-600">
                {t("upload.signature")} {index + 1}
              </span>
            </div>
          );
        })}

        {/* Show current selection */}
        {isSelecting && startPos && currentPos && (
          <div
            className="absolute border-2 border-red-500 bg-red-500/10"
            style={{
              left: `${Math.min(startPos.x, currentPos.x)}px`,
              top: `${Math.min(startPos.y, currentPos.y)}px`,
              width: `${Math.abs(currentPos.x - startPos.x)}px`,
              height: `${Math.abs(currentPos.y - startPos.y)}px`,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
