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
  const prevMidRef = useRef<Point | null>(null);
  const existingImageRef = useRef<HTMLImageElement | null>(null);
  const isDrawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(!!existingSignature);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const getCanvasHeight = () => (window.innerWidth < 640 ? 200 : 220);

  const applyInkStyle = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const foreground = getComputedStyle(canvas).getPropertyValue("--foreground");
    ctx.strokeStyle = `hsl(${foreground})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([]);
  };

  // 인접 점의 중점을 잇는 2차 베지어. 실시간 그리기와 재그리기가 같은 수식을 쓴다.
  const strokePath = (ctx: CanvasRenderingContext2D, stroke: Point[]) => {
    if (stroke.length === 0) return;
    ctx.beginPath();
    if (stroke.length < 3) {
      ctx.moveTo(stroke[0].x, stroke[0].y);
      const end = stroke[stroke.length - 1];
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      return;
    }
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length - 1; i++) {
      const mid = midpoint(stroke[i], stroke[i + 1]);
      ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    if (existingImageRef.current && strokesRef.current.length === 0) {
      ctx.drawImage(existingImageRef.current, 0, 0, cssWidth, cssHeight);
    }

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

    applyInkStyle(ctx, canvas);
    for (const stroke of strokesRef.current) strokePath(ctx, stroke);
    if (currentStrokeRef.current.length > 0) strokePath(ctx, currentStrokeRef.current);
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cssHeight = getCanvasHeight();
    canvas.style.height = `${cssHeight}px`;
    // 캔버스는 w-full 로 컨테이너 안쪽 폭을 따른다. 레이아웃 전(폭 0)에는 건너뛴다.
    const cssWidth = canvas.clientWidth;
    if (cssWidth === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = scaleForDpr(cssWidth, cssHeight, dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    // width/height 재설정은 변환을 초기화하므로 매번 절대값으로 지정한다(누적 방지).
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    redraw();
  };

  useLayoutEffect(() => {
    if (!isOpen) return;

    strokesRef.current = [];
    currentStrokeRef.current = [];
    setHasSignature(!!existingSignature);
    setStrokeCount(0);

    existingImageRef.current = null;
    if (existingSignature) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        existingImageRef.current = img;
        redraw();
      };
      img.src = existingSignature;
    }

    setupCanvas();

    // 다이얼로그는 포털로 뜨고 진입 애니메이션이 있어 마운트 직후 폭이 0이거나 바뀔 수 있다.
    // 실제 크기가 확정될 때마다 다시 맞춘다.
    const container = containerRef.current;
    const observer =
      typeof ResizeObserver !== "undefined" && container
        ? new ResizeObserver(() => setupCanvas())
        : null;
    if (container && observer) observer.observe(container);
    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSignature, isOpen]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect();
    // rect 는 CSS 변환(진입 애니메이션 등)이 적용된 크기라, 캔버스 CSS 크기 기준으로 보정한다.
    const scaleX = rect.width ? canvas.clientWidth / rect.width : 1;
    const scaleY = rect.height ? canvas.clientHeight / rect.height : 1;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    setHasSignature(true);

    // 새로 그리기 시작하면 기존 서명 이미지는 대체된다.
    if (existingImageRef.current) {
      existingImageRef.current = null;
      redraw();
    }
    const point = getPoint(e, canvas);
    lastPointRef.current = point;
    prevMidRef.current = point;
    currentStrokeRef.current = [point];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawingRef.current) return;

    const ctx = canvas.getContext("2d");
    const point = getPoint(e, canvas);
    const last = lastPointRef.current;
    const prevMid = prevMidRef.current;
    if (ctx && last && prevMid) {
      applyInkStyle(ctx, canvas);
      const mid = midpoint(last, point);
      ctx.beginPath();
      ctx.moveTo(prevMid.x, prevMid.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
      ctx.stroke();
      prevMidRef.current = mid;
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
    prevMidRef.current = null;
    redraw();
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
    // 불러온 기존 서명도 함께 버린다. 그대로 두면 redraw 가 다시 그린다.
    existingImageRef.current = null;
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
