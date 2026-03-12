"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";

interface TextInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (textImageData: string) => void;
  existingText?: string;
  areaAspectRatio?: number; // width / height of the signature area
}

export default function TextInputModal({
  isOpen,
  onClose,
  onComplete,
  existingText,
  areaAspectRatio = 4,
}: TextInputModalProps) {
  const { t } = useLanguage();
  const [text, setText] = useState(existingText ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText(existingText ?? "");
    }
  }, [isOpen, existingText]);

  const clearText = () => {
    setText("");
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const lines: string[] = [];
    let currentLine = "";
    for (const char of text) {
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  const renderTextToCanvas = (inputText: string): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const scale = 3;
    const fontFamily = '-apple-system, "Noto Sans KR", sans-serif';
    const padding = 10;

    // Canvas logical size based on area aspect ratio
    const canvasWidth = 800;
    const canvasHeight = Math.round(canvasWidth / areaAspectRatio);
    const maxWidth = canvasWidth - padding * 2;
    const maxHeight = canvasHeight - padding * 2;

    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    ctx.scale(scale, scale);

    // Find optimal font size that fills the area
    let fontSize = maxHeight; // start large
    ctx.font = `${fontSize}px ${fontFamily}`;

    // Try to fit as single line first, shrink until it fits or hits limit
    while (fontSize > 12 && ctx.measureText(inputText).width > maxWidth) {
      fontSize -= 2;
      ctx.font = `${fontSize}px ${fontFamily}`;
    }

    // If single line fits, use it
    if (ctx.measureText(inputText).width <= maxWidth) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.fillStyle = "#000000";
      ctx.textBaseline = "middle";
      const textWidth = ctx.measureText(inputText).width;
      const x = (canvasWidth - textWidth) / 2;
      const y = canvasHeight / 2;
      ctx.fillText(inputText, x, y);
      return canvas.toDataURL("image/png");
    }

    // Text too long for single line — find font size that fills area with wrapping
    fontSize = maxHeight;
    while (fontSize > 12) {
      ctx.font = `${fontSize}px ${fontFamily}`;
      const lineHeight = fontSize * 1.3;
      const lines = wrapText(ctx, inputText, maxWidth);
      const totalHeight = lines.length * lineHeight;
      if (totalHeight <= maxHeight) break;
      fontSize -= 2;
    }

    const lineHeight = fontSize * 1.3;
    const lines = wrapText(ctx, inputText, maxWidth);
    const totalHeight = lines.length * lineHeight;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";

    const startY = (canvasHeight - totalHeight) / 2 + lineHeight / 2;
    for (let i = 0; i < lines.length; i++) {
      const tw = ctx.measureText(lines[i]).width;
      const x = (canvasWidth - tw) / 2;
      ctx.fillText(lines[i], x, startY + i * lineHeight);
    }

    return canvas.toDataURL("image/png");
  };

  const handleComplete = async () => {
    if (!text.trim()) return;
    setIsSubmitting(true);
    try {
      const imageData = renderTextToCanvas(text);
      await onComplete(imageData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("textModal.title")}</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("textModal.placeholder")}
          />
        </div>

        {/* Hidden canvas used for text-to-image conversion */}
        <canvas
          ref={canvasRef}
          width={2400}
          height={1200}
          className="hidden"
        />

        <DialogFooter className="flex justify-between sm:justify-between gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={clearText}
            disabled={isSubmitting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("textModal.clear")}
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={!text.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t("textModal.complete")}
              </>
            ) : (
              t("textModal.complete")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
