import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 좌표 변환 유틸리티 함수들

/**
 * 절대 픽셀 값을 상대 퍼센트로 변환
 */
export function pixelsToPercent(pixelValue: number, containerSize: number): number {
  if (containerSize === 0) return 0;
  return (pixelValue / containerSize) * 100;
}

/**
 * 상대 퍼센트를 절대 픽셀 값으로 변환
 */
export function percentToPixels(percentValue: number, containerSize: number): number {
  return (percentValue / 100) * containerSize;
}

/**
 * 이미지 컨테이너의 실제 크기를 가져오기 (deprecated - 화면 크기에 따라 변함)
 */
export function getImageContainerDimensions(containerElement: HTMLElement): {
  width: number;
  height: number;
} {
  const img = containerElement.querySelector('img') as HTMLImageElement;
  if (!img) {
    throw new Error('Image not found in container');
  }

  return {
    width: img.clientWidth,
    height: img.clientHeight,
  };
}

/**
 * 이미지의 원본 크기를 가져오기 (진짜 상대 좌표를 위해 사용)
 */
export function getImageNaturalDimensions(containerElement: HTMLElement): {
  width: number;
  height: number;
} {
  const img = containerElement.querySelector('img') as HTMLImageElement;
  if (!img) {
    throw new Error('Image not found in container');
  }

  // 이미지가 로드되지 않은 경우 대기
  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
    throw new Error('Image not loaded yet');
  }

  return {
    width: img.naturalWidth,   // 원본 이미지 크기
    height: img.naturalHeight, // 원본 이미지 크기
  };
}

/**
 * SignatureArea 타입 정의 (상대 좌표용)
 */
export interface RelativeSignatureArea {
  x: number;      // 0-100% (원본 이미지 기준)
  y: number;      // 0-100% (원본 이미지 기준)
  width: number;  // 0-100% (원본 이미지 기준)
  height: number; // 0-100% (원본 이미지 기준)
}

/**
 * SignatureArea 타입 정의 (절대 좌표용)
 */
export interface AbsoluteSignatureArea {
  x: number;      // 절대 픽셀
  y: number;      // 절대 픽셀
  width: number;  // 절대 픽셀
  height: number; // 절대 픽셀
}

/**
 * 절대 픽셀 좌표의 SignatureArea를 상대 퍼센트로 변환 (원본 이미지 크기 기준)
 */
export function convertSignatureAreaToPercent(
  area: AbsoluteSignatureArea,
  originalImageWidth: number,
  originalImageHeight: number
): RelativeSignatureArea {
  return {
    x: pixelsToPercent(area.x, originalImageWidth),
    y: pixelsToPercent(area.y, originalImageHeight),
    width: pixelsToPercent(area.width, originalImageWidth),
    height: pixelsToPercent(area.height, originalImageHeight),
  };
}

/**
 * 상대 퍼센트의 SignatureArea를 절대 픽셀로 변환 (원본 이미지 크기 기준)
 */
export function convertSignatureAreaToPixels(
  area: RelativeSignatureArea,
  originalImageWidth: number,
  originalImageHeight: number
): AbsoluteSignatureArea {
  return {
    x: percentToPixels(area.x, originalImageWidth),
    y: percentToPixels(area.y, originalImageHeight),
    width: percentToPixels(area.width, originalImageWidth),
    height: percentToPixels(area.height, originalImageHeight),
  };
}

/**
 * 기존 절대 좌표 데이터가 상대 좌표인지 확인하는 함수
 * (하위 호환성을 위해, 모든 값이 100 이하면 상대 좌표로 가정)
 */
export function isRelativeCoordinate(area: { x: number; y: number; width: number; height: number }): boolean {
  return area.x <= 100 && area.y <= 100 && area.width <= 100 && area.height <= 100;
}

/**
 * 기존 데이터를 자동으로 상대 좌표로 변환 (필요시) - 원본 이미지 크기 기준
 */
export function ensureRelativeCoordinate(
  area: { x: number; y: number; width: number; height: number },
  originalImageWidth: number,
  originalImageHeight: number
): RelativeSignatureArea {
  if (isRelativeCoordinate(area)) {
    // 이미 상대 좌표
    return area as RelativeSignatureArea;
  } else {
    // 절대 좌표를 상대 좌표로 변환 (원본 이미지 크기 기준)
    return convertSignatureAreaToPercent(area, originalImageWidth, originalImageHeight);
  }
}
