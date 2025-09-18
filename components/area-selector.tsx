"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"

// Import the useLanguage hook at the top of the file
import { useLanguage } from "@/contexts/language-context"

interface AreaSelectorProps {
  image: string
  onAreaSelected: (area: { x: number; y: number; width: number; height: number }) => void
  onCancel: () => void
  existingAreas?: Array<{ x: number; y: number; width: number; height: number }>
  initialScrollPosition?: { top: number; left: number }
}

export default function AreaSelector({
  image,
  onAreaSelected,
  onCancel,
  existingAreas = [],
  initialScrollPosition = { top: 0, left: 0 },
}: AreaSelectorProps) {
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [originalOverflow, setOriginalOverflow] = useState<string>("")
  const [scrollPositionApplied, setScrollPositionApplied] = useState(false)

  // Add the useLanguage hook inside the component
  const { t } = useLanguage()

  // Apply initial scroll position when component mounts
  useEffect(() => {
    if (containerRef.current && !scrollPositionApplied) {
      containerRef.current.scrollTop = initialScrollPosition.top
      containerRef.current.scrollLeft = initialScrollPosition.left
      setScrollPositionApplied(true)
    }
  }, [initialScrollPosition, scrollPositionApplied])

  const getCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    // Account for scroll position
    const scrollLeft = containerRef.current.scrollLeft
    const scrollTop = containerRef.current.scrollTop

    // Calculate coordinates relative to the container, accounting for scroll
    const x = clientX - rect.left + scrollLeft
    const y = clientY - rect.top + scrollTop

    return { x, y }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()

    // Disable container scrolling when starting selection
    if (containerRef.current) {
      setOriginalOverflow(containerRef.current.style.overflow || "auto")
      containerRef.current.style.overflow = "hidden"
    }

    const { x, y } = getCoordinates(e.clientX, e.clientY)
    setStartPos({ x, y })
    setCurrentPos({ x, y })
    setIsSelecting(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault()

    if (!isSelecting) return

    const { x, y } = getCoordinates(e.clientX, e.clientY)
    setCurrentPos({ x, y })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()

    // Re-enable container scrolling
    if (containerRef.current) {
      containerRef.current.style.overflow = originalOverflow
    }

    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      const width = Math.abs(currentPos.x - startPos.x)
      const height = Math.abs(currentPos.y - startPos.y)

      if (width > 10 && height > 10) {
        onAreaSelected({ x, y, width, height })
      }
    }

    setIsSelecting(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()

    // Disable container scrolling when starting selection
    if (containerRef.current) {
      setOriginalOverflow(containerRef.current.style.overflow || "auto")
      containerRef.current.style.overflow = "hidden"
    }

    const touch = e.touches[0]
    const { x, y } = getCoordinates(touch.clientX, touch.clientY)
    setStartPos({ x, y })
    setCurrentPos({ x, y })
    setIsSelecting(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault()

    if (!isSelecting) return

    const touch = e.touches[0]
    const { x, y } = getCoordinates(touch.clientX, touch.clientY)
    setCurrentPos({ x, y })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()

    // Re-enable container scrolling
    if (containerRef.current) {
      containerRef.current.style.overflow = originalOverflow
    }

    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      const width = Math.abs(currentPos.x - startPos.x)
      const height = Math.abs(currentPos.y - startPos.y)

      if (width > 10 && height > 10) {
        onAreaSelected({ x, y, width, height })
      }
    }

    setIsSelecting(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  useEffect(() => {
    const handleMouseUpOutside = () => {
      if (isSelecting) {
        // Re-enable container scrolling if mouse up happens outside
        if (containerRef.current) {
          containerRef.current.style.overflow = originalOverflow
        }

        setIsSelecting(false)
        setStartPos(null)
        setCurrentPos(null)
      }
    }

    window.addEventListener("mouseup", handleMouseUpOutside)
    return () => {
      window.removeEventListener("mouseup", handleMouseUpOutside)
    }
  }, [isSelecting, originalOverflow])

  useEffect(() => {
    // Disable body scrolling when selecting an area
    if (isSelecting) {
      // Save the current body overflow style
      const originalBodyStyle = window.getComputedStyle(document.body).overflow
      // Prevent scrolling on the entire body
      document.body.style.overflow = "hidden"

      // Re-enable scrolling when done
      return () => {
        document.body.style.overflow = originalBodyStyle
      }
    }
  }, [isSelecting])

  // Cleanup effect to ensure scrolling is re-enabled if component unmounts during selection
  useEffect(() => {
    return () => {
      if (isSelecting && containerRef.current) {
        containerRef.current.style.overflow = "auto"
      }
      document.body.style.overflow = "auto"
    }
  }, [isSelecting])

  return (
    <div className="relative">
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
          src={image || "/placeholder.svg"}
          alt="Document"
          className="w-full h-auto object-contain"
          draggable="false"
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        />

        {/* Show existing areas */}
        {existingAreas.map((area, index) => (
          <div
            key={index}
            className="absolute border-2 border-green-500 bg-green-500/10 flex items-center justify-center pointer-events-none"
            style={{
              left: `${area.x}px`,
              top: `${area.y}px`,
              width: `${area.width}px`,
              height: `${area.height}px`,
            }}
          >
            <span className="text-xs font-medium text-green-600">
              {t("upload.signature")} {index + 1}
            </span>
          </div>
        ))}

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
  )
}

