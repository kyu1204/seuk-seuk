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

    const scale = 3;
    const fontFamily = '-apple-system, "Noto Sans KR", sans-serif';
    const padding = 10;
    const fontSize = 60;

    ctx.font = `${fontSize}px ${fontFamily}`;

    // Single line — canvas fits text tightly
    const textWidth = ctx.measureText(inputText).width;
    const logicalWidth = Math.ceil(textWidth + padding * 2);
    const logicalHeight = Math.ceil(fontSize * 1.3 + padding * 2);
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;
    ctx.scale(scale, scale);

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = "#000000";
    ctx.textBaseline = "middle";

    const x = (logicalWidth - textWidth) / 2;
    const y = logicalHeight / 2;
    ctx.fillText(inputText, x, y);

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
