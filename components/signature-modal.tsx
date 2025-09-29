"use client";

import type React from "react";

import { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (signatureData: string) => void;
  existingSignature?: string;
}

export default function SignatureModal({
  isOpen,
  onClose,
  onComplete,
  existingSignature,
}: SignatureModalProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const PEN_WIDTH = 5; // Increased from default

  // Initialize canvas when component mounts or when isOpen changes
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set up the canvas with thicker line
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load existing signature if available
    if (existingSignature) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      };
      img.src = existingSignature;
    }
  }, [existingSignature, isOpen]);

  // Get coordinates for mouse or touch event
  const getCoordinates = (
    e: MouseEvent | TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calculate the actual canvas coordinates considering the scale
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Start drawing
  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Prevent default behavior (scrolling, etc)
    if ("touches" in e) {
      e.preventDefault();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ensure the line width is set correctly
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";

    setIsDrawing(true);
    setHasSignature(true);

    const coords = getCoordinates(e.nativeEvent, canvas);
    setLastX(coords.x);
    setLastY(coords.y);

    // Start a new path
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  // Draw line
  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawing) return;

    // Prevent default behavior (scrolling, etc)
    if ("touches" in e) {
      e.preventDefault();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const coords = getCoordinates(e.nativeEvent, canvas);

    // Draw line from last position to current position without beginPath
    // This creates a continuous line
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Update last position
    setLastX(coords.x);
    setLastY(coords.y);
  };

  // Stop drawing
  const handleEnd = () => {
    setIsDrawing(false);
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Complete signature
  const handleComplete = async () => {
    if (!canvasRef.current || !hasSignature) return;

    setIsSubmitting(true);

    try {
      const signatureData = canvasRef.current.toDataURL("image/png");
      await onComplete(signatureData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("signature.title")}</DialogTitle>
        </DialogHeader>

        <div className="border rounded-md p-1 my-4">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full bg-white cursor-crosshair"
            style={{ touchAction: "none" }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>

        <p className="text-sm text-muted-foreground text-center">
          {t("signature.instruction")}
        </p>

        <DialogFooter className="flex justify-between sm:justify-between gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={clearCanvas}
            disabled={isSubmitting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("signature.clear")}
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={!hasSignature || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("signature.signing")}
              </>
            ) : (
              t("signature.sign")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
