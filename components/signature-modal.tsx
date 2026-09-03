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
    // 실시간 그리기(handlePointerMove)와 같은 수식: 제어점=직전 점, 끝점=직전 점과 현재 점의 중점.
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i++) {
      const previous = stroke[i - 1];
      const mid = midpoint(previous, stroke[i]);
      ctx.quadraticCurveTo(previous.x, previous.y, mid.x, mid.y);
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


    applyInkStyle(ctx, canvas);
    for (const stroke of strokesRef.current) strokePath(ctx, stroke);
    if (currentStrokeRef.current.length > 0) strokePath(ctx, currentStrokeRef.current);
  };

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cssHeight = getCanvasHeight();
    // 컨테이너의 content box 폭을 캔버스 CSS 폭으로 명시한다(패딩·보더 제외). 레이아웃 전(폭 0)에는 건너뛴다.
    const cssWidth = container.clientWidth - (parseFloat(getComputedStyle(container).paddingLeft) || 0) - (parseFloat(getComputedStyle(container).paddingRight) || 0);
    if (cssWidth <= 0) return;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

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
    let active = true; // 이펙트가 정리된 뒤 도착하는 이전 이미지 onload 는 무시한다.
    if (existingSignature) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!active) return;
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
      active = false;
      observer?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSignature, isOpen]);

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement): Point => {
    // 좌표는 CSS 픽셀 그대로 쓴다. 백킹 스토어는 setTransform(dpr) 로 CSS 픽셀 공간에 맞춰져 있다.
    // (진입 애니메이션 중 rect 크기로 보정하던 로직은 iOS 에서 배율이 틀어져 제거)
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;
    // 백킹 스토어가 현재 CSS 크기와 어긋나 있으면(관찰자가 놓친 리사이즈 등) 긋기 전에 다시 맞춘다.
    const dpr = window.devicePixelRatio || 1;
    if (
      canvas.width !== Math.round(canvas.clientWidth * dpr) ||
      canvas.height !== Math.round(canvas.clientHeight * dpr)
    ) {
      setupCanvas();
    }
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
              className="block w-full cursor-crosshair touch-none"
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
