"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Import the useLanguage hook at the top of the file
import { useLanguage } from "@/contexts/language-context";

// Import coordinate conversion utilities
import {
  getImageNaturalDimensions,
  convertSignatureAreaToPercent,
  ensureRelativeCoordinate,
  type RelativeSignatureArea,
} from "@/lib/utils";

interface AreaSelectorProps {
  image: string;
  onAreaSelected: (area: RelativeSignatureArea) => void;
  onCancel: () => void;
  existingAreas?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  initialScrollPosition?: { top: number; left: number };
  // Zoom 상태를 부모로부터 받아옵니다
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
}

export default function AreaSelector({
  image,
  onAreaSelected,
  onCancel,
  existingAreas = [],
  initialScrollPosition = { top: 0, left: 0 },
  zoomLevel: propZoomLevel,
  onZoomChange,
}: AreaSelectorProps) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [originalOverflow, setOriginalOverflow] = useState<string>("");
  const [scrollPositionApplied, setScrollPositionApplied] = useState(false);
  // 부모로부터 전달받은 zoomLevel을 사용하거나, 없으면 기본값 1 사용
  const zoomLevel = propZoomLevel ?? 1;
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Add the useLanguage hook inside the component
  const { t } = useLanguage();

  // Apply initial scroll position when component mounts
  useEffect(() => {
    if (containerRef.current && !scrollPositionApplied) {
      containerRef.current.scrollTop = initialScrollPosition.top;
      containerRef.current.scrollLeft = initialScrollPosition.left;
      setScrollPositionApplied(true);
    }
  }, [initialScrollPosition, scrollPositionApplied]);

  const getCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };

    try {
      const rect = containerRef.current.getBoundingClientRect();
      // Account for scroll position
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // Calculate coordinates relative to the container, accounting for scroll
      const pixelX = (clientX - rect.left + scrollLeft);
      const pixelY = (clientY - rect.top + scrollTop);

      // Get the image element to calculate displayed dimensions
      const imgElement = containerRef.current.querySelector('img') as HTMLImageElement;
      if (!imgElement) {
        console.warn('Image element not found');
        return { x: 0, y: 0 };
      }

      // Get the current displayed dimensions (which are scaled by zoomLevel)
      const displayedWidth = imgElement.clientWidth;
      const displayedHeight = imgElement.clientHeight;

      // Convert to percentage coordinates based on current displayed image size
      const x = (pixelX / displayedWidth) * 100;
      const y = (pixelY / displayedHeight) * 100;

      return { x, y };
    } catch (error) {
      console.warn('Failed to get image container dimensions:', error);
      return { x: 0, y: 0 };
    }
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.25, 3);
    onZoomChange?.(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.25, 0.5);
    onZoomChange?.(newZoom);
  };

  const handleZoomReset = () => {
    onZoomChange?.(1);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && !isSelecting) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      e.preventDefault();
      return;
    }
    handleMouseDown(e);
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      e.preventDefault();
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      containerRef.current.scrollLeft -= deltaX;
      containerRef.current.scrollTop -= deltaY;

      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }
    handleMouseMove(e);
  };

  const handleContainerMouseUp = (e: React.MouseEvent) => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    handleMouseUp(e);
  };


  // Simplified touch event handlers
  const handleEnhancedTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start area selection
      handleTouchStart(e);
    } else if (e.touches.length === 2) {
      // Two finger touch - start document panning
      e.preventDefault();
      setIsDragging(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      setDragStart({ x: centerX, y: centerY });
      
      // Cancel any ongoing area selection
      if (isSelecting) {
        setIsSelecting(false);
        setStartPos(null);
        setCurrentPos(null);
        if (containerRef.current) {
          containerRef.current.style.overflow = originalOverflow;
        }
      }
    }
  };

  const handleEnhancedTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && !isDragging) {
      // Single touch - area selection
      handleTouchMove(e);
    } else if (e.touches.length === 2 && isDragging && containerRef.current) {
      // Two finger touch - document panning
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const deltaX = centerX - dragStart.x;
      const deltaY = centerY - dragStart.y;

      containerRef.current.scrollLeft -= deltaX;
      containerRef.current.scrollTop -= deltaY;

      setDragStart({ x: centerX, y: centerY });
    }
  };

  const handleEnhancedTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All touches ended
      if (isDragging) {
        // End document panning
        setIsDragging(false);
        return;
      }
      // End area selection
      handleTouchEnd(e);
    } else if (e.touches.length === 1 && isDragging) {
      // From two fingers to one finger - stop panning
      setIsDragging(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();

    // Disable container scrolling when starting selection
    if (containerRef.current) {
      setOriginalOverflow(containerRef.current.style.overflow || "auto");
      containerRef.current.style.overflow = "hidden";
    }

    const { x, y } = getCoordinates(e.clientX, e.clientY);
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

    // Re-enable container scrolling
    if (containerRef.current) {
      containerRef.current.style.overflow = originalOverflow;
    }

    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      // Use percentage-based minimum size (1% of container)
      if (width > 1 && height > 1) {
        onAreaSelected({ x, y, width, height });
      }
    }

    setIsSelecting(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();

    // Disable container scrolling when starting selection
    if (containerRef.current) {
      setOriginalOverflow(containerRef.current.style.overflow || "auto");
      containerRef.current.style.overflow = "hidden";
    }

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

    // Re-enable container scrolling
    if (containerRef.current) {
      containerRef.current.style.overflow = originalOverflow;
    }

    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);

      // Use percentage-based minimum size (1% of container)
      if (width > 1 && height > 1) {
        onAreaSelected({ x, y, width, height });
      }
    }

    setIsSelecting(false);
    setStartPos(null);
    setCurrentPos(null);
  };

  useEffect(() => {
    const handleMouseUpOutside = () => {
      if (isSelecting) {
        // Re-enable container scrolling if mouse up happens outside
        if (containerRef.current) {
          containerRef.current.style.overflow = originalOverflow;
        }

        setIsSelecting(false);
        setStartPos(null);
        setCurrentPos(null);
      }
    };

    window.addEventListener("mouseup", handleMouseUpOutside);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpOutside);
    };
  }, [isSelecting, originalOverflow]);

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

  // Cleanup effect to ensure scrolling is re-enabled if component unmounts during selection
  useEffect(() => {
    return () => {
      if (isSelecting && containerRef.current) {
        containerRef.current.style.overflow = "auto";
      }
      document.body.style.overflow = "auto";
    };
  }, [isSelecting]);

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex flex-col gap-1 sm:gap-2 bg-white/90 backdrop-blur-sm rounded-lg p-1 sm:p-2 shadow-lg">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
        >
          <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
        >
          <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomReset}
          disabled={zoomLevel === 1}
          className="p-1 sm:p-2 h-6 w-6 sm:h-8 sm:w-8"
        >
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <div className="text-xs text-center font-medium px-1 py-0.5 bg-gray-100 rounded">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-auto max-h-[50vh] sm:max-h-[70vh]"
        style={{
          touchAction: "none",
          cursor: 'crosshair'
        }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
        }}
        onTouchStart={handleEnhancedTouchStart}
        onTouchMove={handleEnhancedTouchMove}
        onTouchEnd={handleEnhancedTouchEnd}
      >
        <div
          className="relative inline-block"
          style={{
            width: `${100 * zoomLevel}%`,
            height: 'auto'
          }}
        >
          <img
            src={image || "/placeholder.svg"}
            alt="Document"
            className="w-full h-auto object-contain block"
            draggable="false"
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          />

          {/* Show existing areas */}
          {existingAreas.map((area, index) => {
          // Convert existing areas to relative coordinates if needed
          let relativeArea: RelativeSignatureArea;
          try {
            if (!containerRef.current) {
              return null;
            }
            const { width: originalWidth, height: originalHeight } = getImageNaturalDimensions(containerRef.current);
            relativeArea = ensureRelativeCoordinate(area, originalWidth, originalHeight);
          } catch (error) {
            console.warn('Failed to convert area coordinates:', error);
            return null;
          }

            return (
              <div
                key={index}
                className="absolute border-2 border-green-500 bg-green-500/10 flex items-center justify-center pointer-events-none"
                style={{
                  left: `${relativeArea.x}%`,
                  top: `${relativeArea.y}%`,
                  width: `${relativeArea.width}%`,
                  height: `${relativeArea.height}%`,
                }}
              >
                <span className="text-xs font-medium text-green-600">
                  <span className="hidden sm:inline">{t("upload.signature")} {index + 1}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </span>
              </div>
            );
          })}

          {/* Show current selection */}
          {isSelecting && startPos && currentPos && (
            <div
              className="absolute border-2 border-red-500 bg-red-500/10"
              style={{
                left: `${Math.min(startPos.x, currentPos.x)}%`,
                top: `${Math.min(startPos.y, currentPos.y)}%`,
                width: `${Math.abs(currentPos.x - startPos.x)}%`,
                height: `${Math.abs(currentPos.y - startPos.y)}%`,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
