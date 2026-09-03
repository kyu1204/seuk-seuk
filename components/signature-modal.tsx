"use client";

import type React from "react";

import { useLayoutEffect, useRef, useState } from "react";
import { Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/language-context";
import { midpoint, popStroke, pushStroke, scaleForDpr, type Point } from "@/lib/sign/stroke";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (signatureData: string) => void;
  existingSignature?: string;
}

const BASELINE_OFFSET = 24;

export default function SignatureModal({
  isOpen,
  onClose,
  onComplete,
  existingSignature,
}: SignatureModalProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Point[][]>([]);
  const currentStrokeRef = useRef<Point[]>([]);
  const lastPointRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const getCanvasHeight = () => (window.innerWidth < 640 ? 200 : 220);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const borderColor = getComputedStyle(canvas).getPropertyValue("--border");
    ctx.save();
    ctx.strokeStyle = `hsl(${borderColor})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cssHeight - BASELINE_OFFSET);
    ctx.lineTo(cssWidth, cssHeight - BASELINE_OFFSET);
    ctx.stroke();
    ctx.restore();

    const foreground = getComputedStyle(canvas).getPropertyValue("--foreground");
    ctx.strokeStyle = `hsl(${foreground})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const mid = midpoint(stroke[i], stroke[i + 1]);
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y);
      }
      ctx.stroke();
    }
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cssWidth = container.clientWidth;
    const cssHeight = getCanvasHeight();
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = scaleForDpr(cssWidth, cssHeight, dpr);

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);

    redraw();
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasSignature(!!existingSignature);
    setStrokeCount(0);

    if (existingSignature) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (ctx && canvas) {
          ctx.drawImage(img, 0, 0, canvas.clientWidth, canvas.clientHeight);
        }
      };
      img.src = existingSignature;
    }

    setupCanvas();

    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSignature, isOpen]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    setHasSignature(true);

    const point = getPoint(e, canvas);
    lastPointRef.current = point;
    currentStrokeRef.current = [point];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawingRef.current) return;

    const ctx = canvas.getContext("2d");
    const point = getPoint(e, canvas);
    const last = lastPointRef.current;
    if (ctx && last) {
      const foreground = getComputedStyle(canvas).getPropertyValue("--foreground");
      ctx.strokeStyle = `hsl(${foreground})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const mid = midpoint(last, point);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
      ctx.stroke();
    }

    currentStrokeRef.current.push(point);
    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentStrokeRef.current.length > 0) {
      strokesRef.current = pushStroke(strokesRef.current, currentStrokeRef.current);
      setStrokeCount(strokesRef.current.length);
    }
    currentStrokeRef.current = [];
    lastPointRef.current = null;
  };

  const undo = () => {
    const { history, removed } = popStroke(strokesRef.current);
    if (!removed) return;
    strokesRef.current = history;
    setStrokeCount(history.length);
    setHasSignature(history.length > 0);
    redraw();
  };

  const clearCanvas = () => {
    strokesRef.current = [];
    currentStrokeRef.current = [];
    setStrokeCount(0);
    setHasSignature(false);
    redraw();
  };

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

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (hasSignature) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("signature.title")}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground text-center">
            {t("signature.instruction")}
          </p>

          <div ref={containerRef} className="relative border rounded-md p-1 my-4">
            <canvas
              ref={canvasRef}
              className="w-full cursor-crosshair touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />
            {!hasSignature && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">
                  {t("signature.placeholder")}
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between gap-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={undo}
                disabled={isSubmitting || strokeCount === 0}
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {t("signature.undo")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearCanvas}
                disabled={isSubmitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("signature.clear")}
              </Button>
            </div>
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

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("signature.discardTitle")}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmDiscard(false);
                onClose();
              }}
            >
              {t("signature.discardConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
