/**
 * 서명영역 좌표 변환 유틸리티
 * 
 * 핵심 개념:
 * - 절대 좌표: 화면에 표시되는 픽셀 단위 좌표 (브라우저/화면 크기에 따라 변함)
 * - 상대 좌표: 이미지 원본 크기 기준 0-1 사이의 비율 좌표 (항상 일정함)
 */

// 타입 정의
export interface ImageDimensions {
  naturalWidth: number   // 이미지 원본 너비
  naturalHeight: number  // 이미지 원본 높이
  displayWidth: number   // 현재 표시되는 너비
  displayHeight: number  // 현재 표시되는 높이
}

export interface AbsoluteCoordinate {
  x: number      // 절대 x 좌표 (픽셀)
  y: number      // 절대 y 좌표 (픽셀)
  width: number  // 절대 너비 (픽셀)
  height: number // 절대 높이 (픽셀)
}

export interface RelativeCoordinate {
  x: number      // 상대 x 좌표 (0-1)
  y: number      // 상대 y 좌표 (0-1)
  width: number  // 상대 너비 (0-1)
  height: number // 상대 높이 (0-1)
}

// 검증 결과 타입
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 절대 좌표를 상대 좌표로 변환
 * @param absolute - 절대 좌표
 * @param imageDimensions - 이미지 차원 정보
 * @returns 상대 좌표 (0-1 범위)
 */
export function pixelToRelative(
  absolute: AbsoluteCoordinate,
  imageDimensions: ImageDimensions
): RelativeCoordinate {
  // 이미지의 실제 표시 영역 기준으로 변환
  const { displayWidth, displayHeight } = imageDimensions
  
  if (displayWidth <= 0 || displayHeight <= 0) {
    throw new Error('Invalid display dimensions: width and height must be positive')
  }
  
  const relative: RelativeCoordinate = {
    x: absolute.x / displayWidth,
    y: absolute.y / displayHeight,
    width: absolute.width / displayWidth,
    height: absolute.height / displayHeight
  }
  
  // 범위 검증 및 클램핑 (0-1 범위로 제한)
  relative.x = Math.max(0, Math.min(1, relative.x))
  relative.y = Math.max(0, Math.min(1, relative.y))
  relative.width = Math.max(0, Math.min(1 - relative.x, relative.width))
  relative.height = Math.max(0, Math.min(1 - relative.y, relative.height))
  
  return relative
}

/**
 * 상대 좌표를 절대 좌표로 변환
 * @param relative - 상대 좌표 (0-1 범위)
 * @param imageDimensions - 이미지 차원 정보
 * @returns 절대 좌표 (픽셀 단위)
 */
export function relativeToPixel(
  relative: RelativeCoordinate,
  imageDimensions: ImageDimensions
): AbsoluteCoordinate {
  const { displayWidth, displayHeight } = imageDimensions
  
  if (displayWidth <= 0 || displayHeight <= 0) {
    throw new Error('Invalid display dimensions: width and height must be positive')
  }
  
  return {
    x: Math.round(relative.x * displayWidth),
    y: Math.round(relative.y * displayHeight),
    width: Math.round(relative.width * displayWidth),
    height: Math.round(relative.height * displayHeight)
  }
}

/**
 * 이미지 엘리먼트에서 차원 정보 추출
 * @param imageElement - HTML 이미지 엘리먼트
 * @returns 이미지 차원 정보
 */
export function getImageDimensions(imageElement: HTMLImageElement): ImageDimensions {
  if (!imageElement.complete) {
    throw new Error('Image is not loaded yet')
  }
  
  const rect = imageElement.getBoundingClientRect()
  
  return {
    naturalWidth: imageElement.naturalWidth,
    naturalHeight: imageElement.naturalHeight,
    displayWidth: rect.width,
    displayHeight: rect.height
  }
}

/**
 * 이미지 로딩 완료를 기다리는 Promise
 * @param imageElement - HTML 이미지 엘리먼트
 * @returns Promise<ImageDimensions>
 */
export function waitForImageLoad(imageElement: HTMLImageElement): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    if (imageElement.complete) {
      try {
        resolve(getImageDimensions(imageElement))
      } catch (error) {
        reject(error)
      }
      return
    }
    
    const onLoad = () => {
      try {
        const dimensions = getImageDimensions(imageElement)
        resolve(dimensions)
      } catch (error) {
        reject(error)
      } finally {
        cleanup()
      }
    }
    
    const onError = () => {
      reject(new Error('Failed to load image'))
      cleanup()
    }
    
    const cleanup = () => {
      imageElement.removeEventListener('load', onLoad)
      imageElement.removeEventListener('error', onError)
    }
    
    imageElement.addEventListener('load', onLoad)
    imageElement.addEventListener('error', onError)
  })
}

/**
 * 상대 좌표 유효성 검증
 * @param relative - 검증할 상대 좌표
 * @returns 검증 결과
 */
export function validateRelativeCoordinate(relative: RelativeCoordinate): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 기본 범위 검증 (0-1)
  if (relative.x < 0 || relative.x > 1) {
    errors.push(`Invalid x coordinate: ${relative.x} (must be 0-1)`)
  }
  if (relative.y < 0 || relative.y > 1) {
    errors.push(`Invalid y coordinate: ${relative.y} (must be 0-1)`)
  }
  if (relative.width < 0 || relative.width > 1) {
    errors.push(`Invalid width: ${relative.width} (must be 0-1)`)
  }
  if (relative.height < 0 || relative.height > 1) {
    errors.push(`Invalid height: ${relative.height} (must be 0-1)`)
  }
  
  // 경계 검증
  if (relative.x + relative.width > 1) {
    errors.push(`Coordinate exceeds right boundary: x(${relative.x}) + width(${relative.width}) > 1`)
  }
  if (relative.y + relative.height > 1) {
    errors.push(`Coordinate exceeds bottom boundary: y(${relative.y}) + height(${relative.height}) > 1`)
  }
  
  // 최소 크기 경고
  const MIN_SIZE = 0.01 // 1% 최소 크기
  if (relative.width < MIN_SIZE || relative.height < MIN_SIZE) {
    warnings.push(`Very small signature area: ${relative.width}x${relative.height} (recommended: at least ${MIN_SIZE})`)
  }
  
  // 매우 큰 크기 경고
  const MAX_SIZE = 0.5 // 50% 최대 크기 권장
  if (relative.width > MAX_SIZE || relative.height > MAX_SIZE) {
    warnings.push(`Very large signature area: ${relative.width}x${relative.height} (recommended: at most ${MAX_SIZE})`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 절대 좌표 유효성 검증
 * @param absolute - 검증할 절대 좌표
 * @param imageDimensions - 이미지 차원 정보
 * @returns 검증 결과
 */
export function validateAbsoluteCoordinate(
  absolute: AbsoluteCoordinate,
  imageDimensions: ImageDimensions
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // 음수 검증
  if (absolute.x < 0) errors.push(`Negative x coordinate: ${absolute.x}`)
  if (absolute.y < 0) errors.push(`Negative y coordinate: ${absolute.y}`)
  if (absolute.width <= 0) errors.push(`Invalid width: ${absolute.width}`)
  if (absolute.height <= 0) errors.push(`Invalid height: ${absolute.height}`)
  
  // 이미지 경계 검증
  const { displayWidth, displayHeight } = imageDimensions
  if (absolute.x > displayWidth) {
    errors.push(`X coordinate exceeds image width: ${absolute.x} > ${displayWidth}`)
  }
  if (absolute.y > displayHeight) {
    errors.push(`Y coordinate exceeds image height: ${absolute.y} > ${displayHeight}`)
  }
  if (absolute.x + absolute.width > displayWidth) {
    errors.push(`Right edge exceeds image width: ${absolute.x + absolute.width} > ${displayWidth}`)
  }
  if (absolute.y + absolute.height > displayHeight) {
    errors.push(`Bottom edge exceeds image height: ${absolute.y + absolute.height} > ${displayHeight}`)
  }
  
  // 최소 픽셀 크기 경고
  const MIN_PIXELS = 20
  if (absolute.width < MIN_PIXELS || absolute.height < MIN_PIXELS) {
    warnings.push(`Very small signature area: ${absolute.width}x${absolute.height}px (recommended: at least ${MIN_PIXELS}px)`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * 좌표 변환 정확성 테스트
 * @param original - 원본 절대 좌표
 * @param imageDimensions - 이미지 차원 정보
 * @returns 변환 정확성 결과
 */
export function testCoordinateAccuracy(
  original: AbsoluteCoordinate,
  imageDimensions: ImageDimensions
): {
  success: boolean
  originalAbsolute: AbsoluteCoordinate
  relative: RelativeCoordinate
  convertedAbsolute: AbsoluteCoordinate
  pixelDifference: {
    x: number
    y: number
    width: number
    height: number
    maxDiff: number
  }
} {
  try {
    // 절대 → 상대 → 절대 변환 테스트
    const relative = pixelToRelative(original, imageDimensions)
    const convertedAbsolute = relativeToPixel(relative, imageDimensions)
    
    // 픽셀 차이 계산 (반올림으로 인한 오차 허용)
    const pixelDifference = {
      x: Math.abs(original.x - convertedAbsolute.x),
      y: Math.abs(original.y - convertedAbsolute.y),
      width: Math.abs(original.width - convertedAbsolute.width),
      height: Math.abs(original.height - convertedAbsolute.height),
      maxDiff: 0
    }
    
    pixelDifference.maxDiff = Math.max(
      pixelDifference.x,
      pixelDifference.y,
      pixelDifference.width,
      pixelDifference.height
    )
    
    // 1픽셀 이하의 오차는 허용 (반올림 오차)
    const success = pixelDifference.maxDiff <= 1
    
    return {
      success,
      originalAbsolute: original,
      relative,
      convertedAbsolute,
      pixelDifference
    }
  } catch (error) {
    return {
      success: false,
      originalAbsolute: original,
      relative: { x: 0, y: 0, width: 0, height: 0 },
      convertedAbsolute: { x: 0, y: 0, width: 0, height: 0 },
      pixelDifference: { x: 0, y: 0, width: 0, height: 0, maxDiff: 0 }
    }
  }
}

/**
 * object-fit: contain을 고려한 실제 이미지 표시 크기 및 오프셋 계산
 * @param containerWidth - 컨테이너 너비
 * @param containerHeight - 컨테이너 높이 
 * @param imageNaturalWidth - 이미지 원본 너비
 * @param imageNaturalHeight - 이미지 원본 높이
 * @returns 실제 표시 크기와 오프셋 정보
 */
export function calculateImageLayout(
  containerWidth: number,
  containerHeight: number,
  imageNaturalWidth: number,
  imageNaturalHeight: number
): {
  actualDisplayWidth: number
  actualDisplayHeight: number
  imageOffsetX: number
  imageOffsetY: number
} {
  const imageAspectRatio = imageNaturalWidth / imageNaturalHeight
  const containerAspectRatio = containerWidth / containerHeight
  
  let actualDisplayWidth: number
  let actualDisplayHeight: number
  let imageOffsetX = 0
  let imageOffsetY = 0
  
  if (imageAspectRatio > containerAspectRatio) {
    // 이미지가 더 넓음 - 너비 기준으로 맞춤
    actualDisplayWidth = containerWidth
    actualDisplayHeight = containerWidth / imageAspectRatio
    imageOffsetX = 0
    imageOffsetY = (containerHeight - actualDisplayHeight) / 2
  } else {
    // 이미지가 더 높음 - 높이 기준으로 맞춤
    actualDisplayHeight = containerHeight
    actualDisplayWidth = containerHeight * imageAspectRatio
    imageOffsetX = (containerWidth - actualDisplayWidth) / 2
    imageOffsetY = 0
  }
  
  return {
    actualDisplayWidth,
    actualDisplayHeight,
    imageOffsetX,
    imageOffsetY
  }
}

/**
 * 이미지 엘리먼트에서 object-fit: contain을 고려한 정확한 차원 정보 추출
 * @param imageElement - HTML 이미지 엘리먼트
 * @returns 정확한 이미지 차원 정보
 */
export function getAccurateImageDimensions(imageElement: HTMLImageElement): ImageDimensions {
  if (!imageElement.complete) {
    throw new Error('Image is not loaded yet')
  }
  
  const containerRect = imageElement.getBoundingClientRect()
  const { actualDisplayWidth, actualDisplayHeight } = calculateImageLayout(
    containerRect.width,
    containerRect.height,
    imageElement.naturalWidth,
    imageElement.naturalHeight
  )
  
  return {
    naturalWidth: imageElement.naturalWidth,
    naturalHeight: imageElement.naturalHeight,
    displayWidth: actualDisplayWidth,
    displayHeight: actualDisplayHeight
  }
}

/**
 * 디버깅을 위한 좌표 정보 출력
 * @param label - 라벨
 * @param absolute - 절대 좌표
 * @param relative - 상대 좌표
 * @param imageDimensions - 이미지 차원 정보
 */
export function logCoordinateInfo(
  label: string,
  absolute: AbsoluteCoordinate,
  relative: RelativeCoordinate,
  imageDimensions: ImageDimensions
): void {
  console.group(`🎯 ${label}`)
  console.log('📐 이미지 차원:', {
    natural: `${imageDimensions.naturalWidth}x${imageDimensions.naturalHeight}`,
    display: `${imageDimensions.displayWidth}x${imageDimensions.displayHeight}`,
    scale: {
      x: imageDimensions.displayWidth / imageDimensions.naturalWidth,
      y: imageDimensions.displayHeight / imageDimensions.naturalHeight
    }
  })
  console.log('📍 절대 좌표:', `${absolute.x}, ${absolute.y} (${absolute.width}x${absolute.height})`)
  console.log('📊 상대 좌표:', `${relative.x.toFixed(3)}, ${relative.y.toFixed(3)} (${relative.width.toFixed(3)}x${relative.height.toFixed(3)})`)
  console.groupEnd()
}