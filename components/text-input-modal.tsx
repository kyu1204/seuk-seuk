"use client";

import { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
}

export default function TextInputModal({
  isOpen,
  onClose,
  onComplete,
  existingText,
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
    const paragraphs = text.split("\n");
    const lines: string[] = [];
    for (const paragraph of paragraphs) {
      if (paragraph === "") { lines.push(""); continue; }
      let currentLine = "";
      for (const char of paragraph) {
        const testLine = currentLine + char;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    return lines;
  };

  const renderTextToCanvas = (inputText: string): string => {
    const canvas = canvasRef.current;
    if (!canvas) return "";

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // High-DPI scaling for sharp text
    const scale = 3;
    const logicalWidth = 800;
    const logicalHeight = 400;
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;
    ctx.scale(scale, scale);

    const padding = 16;
    const maxWidth = logicalWidth - padding * 2;
    const maxHeight = logicalHeight - padding * 2;
    const fontFamily = '-apple-system, "Noto Sans KR", sans-serif';

    // Dynamic font sizing: find the largest font that fits the canvas
    let fontSize = 200; // start large
    let lines: string[] = [];
    while (fontSize > 20) {
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      lines = wrapText(ctx, inputText, maxWidth);
      const totalHeight = lines.length * fontSize * 1.3;
      if (totalHeight <= maxHeight) break;
      fontSize -= 4;
    }

    // If single line, also check width and shrink if needed
    if (lines.length === 1) {
      while (fontSize > 20 && ctx.measureText(lines[0]).width > maxWidth) {
        fontSize -= 4;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
      }
    }

    const lineHeight = fontSize * 1.3;
    const totalTextHeight = lines.length * lineHeight;

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    // Center text vertically
    let y = Math.max(padding, (logicalHeight - totalTextHeight) / 2);
    for (const line of lines) {
      // Center text horizontally
      const lineWidth = ctx.measureText(line).width;
      const x = (logicalWidth - lineWidth) / 2;
      ctx.fillText(line, x, y);
      y += lineHeight;
      if (y + lineHeight > logicalHeight) break;
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
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("textModal.placeholder")}
            rows={5}
            className="resize-none"
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
