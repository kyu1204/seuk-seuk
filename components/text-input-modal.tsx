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

    const fontSize = 32;
    const lineHeight = fontSize * 1.5;
    const padding = 24;
    const maxWidth = logicalWidth - padding * 2;

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.font = `bold ${fontSize}px -apple-system, "Noto Sans KR", sans-serif`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "top";

    // Word wrap (supports Korean characters without spaces)
    const paragraphs = inputText.split("\n");
    const lines: string[] = [];

    for (const paragraph of paragraphs) {
      if (paragraph === "") {
        lines.push("");
        continue;
      }
      let currentLine = "";

      for (const char of paragraph) {
        const testLine = currentLine + char;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }
    }

    let y = padding;
    for (const line of lines) {
      ctx.fillText(line, padding, y);
      y += lineHeight;
      if (y + lineHeight > logicalHeight - padding) break;
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
