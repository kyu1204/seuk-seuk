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
}

export default function AreaSelector({
  image,
  onAreaSelected,
  onCancel,
  existingAreas = [],
  initialScrollPosition = { top: 0, left: 0 },
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
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number>(0);
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [touchStartZoom, setTouchStartZoom] = useState<number>(1);
  const [isPinching, setIsPinching] = useState<boolean>(false);

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
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
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

  // Enhanced touch event handlers
  const handleEnhancedTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - check for double tap or start selection
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

      // Start dragging for panning if zoomed
      if (zoomLevel > 1 && !isSelecting) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        return;
      }

      // Otherwise, handle as area selection
      handleTouchStart(e);
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      e.preventDefault();
      setIsPinching(true);
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
      setTouchStartZoom(zoomLevel);
      setIsDragging(false);
      setIsSelecting(false);
    }
  };

  const handleEnhancedTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging && containerRef.current) {
      // Single touch panning
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;

      containerRef.current.scrollLeft -= deltaX;
      containerRef.current.scrollTop -= deltaY;

      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2 && isPinching) {
      // Pinch zoom
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const newZoom = Math.min(Math.max(touchStartZoom * scale, 0.5), 3);
        setZoomLevel(newZoom);
      }
    } else if (!isPinching) {
      // Handle normal area selection touch move
      handleTouchMove(e);
    }
  };

  const handleEnhancedTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      if (isPinching) {
        e.preventDefault();
        setIsPinching(false);
        setLastTouchDistance(0);
        return;
      }
      if (isDragging) {
        e.preventDefault();
        setIsDragging(false);
        return;
      }
      // Handle normal area selection touch end
      handleTouchEnd(e);
    } else if (e.touches.length === 1) {
      // Switch from pinch to pan
      setIsPinching(false);
      setLastTouchDistance(0);
      setTouchStartZoom(zoomLevel);
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
          cursor: zoomLevel > 1 && !isSelecting ? (isDragging ? 'grabbing' : 'grab') : 'crosshair'
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
