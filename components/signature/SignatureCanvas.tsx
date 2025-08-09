'use client'

import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useLanguage } from '@/contexts/language-context'

interface Point {
  x: number
  y: number
  pressure?: number
}

interface SignatureCanvasProps {
  width?: number
  height?: number
  penColor?: string
  penWidth?: number
  backgroundColor?: string
  onSignatureChange?: (hasSignature: boolean) => void
  onSignatureComplete?: (dataUrl: string) => void
  existingSignature?: string
  disabled?: boolean
  smoothing?: boolean
  pressureSensitive?: boolean
}

export interface SignatureCanvasRef {
  clear: () => void
  undo: () => void
  getDataURL: (type?: string, quality?: number) => string | null
  getBlob: (callback: (blob: Blob | null) => void, type?: string, quality?: number) => void
  resize: (newWidth: number, newHeight: number) => void
  isEmpty: () => boolean
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(({
  width = 400,
  height = 200,
  penColor = '#000000',
  penWidth = 3,
  backgroundColor = 'transparent',
  onSignatureChange,
  onSignatureComplete,
  existingSignature,
  disabled = false,
  smoothing = true,
  pressureSensitive = true
}, ref) => {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [lastPoint, setLastPoint] = useState<Point | null>(null)
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Set up canvas
    canvas.width = width * 2 // High DPI
    canvas.height = height * 2
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    // Configure context for high quality
    context.scale(2, 2)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = penColor
    context.lineWidth = penWidth
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    if (backgroundColor !== 'transparent') {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, width, height)
    }

    contextRef.current = context

    // Load existing signature
    if (existingSignature) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        context.drawImage(img, 0, 0, width, height)
        setHasSignature(true)
        onSignatureChange?.(true)
      }
      img.src = existingSignature
    }
  }, [width, height, penColor, penWidth, backgroundColor, existingSignature, onSignatureChange])

  // Get coordinates from event
  const getPointFromEvent = useCallback((e: MouseEvent | TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX / 2,
        y: (touch.clientY - rect.top) * scaleY / 2,
        pressure: 'force' in touch ? (touch as any).force : 0.5
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX / 2,
        y: (e.clientY - rect.top) * scaleY / 2,
        pressure: 'pressure' in e ? (e as any).pressure : 0.5
      }
    }
  }, [])

  // Smooth line drawing using quadratic curves
  const drawSmoothLine = useCallback((
    context: CanvasRenderingContext2D,
    from: Point,
    to: Point
  ) => {
    const midPoint = {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2
    }

    context.beginPath()
    context.moveTo(from.x, from.y)
    context.quadraticCurveTo(from.x, from.y, midPoint.x, midPoint.y)
    
    if (pressureSensitive && to.pressure !== undefined) {
      const pressure = Math.max(0.1, Math.min(1, to.pressure))
      context.lineWidth = penWidth * pressure
    }
    
    context.stroke()
  }, [penWidth, pressureSensitive])

  // Start drawing
  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return

    e.preventDefault()
    const context = contextRef.current
    if (!context) return

    const point = getPointFromEvent(e.nativeEvent)
    
    // Save current state for undo functionality
    const imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height)
    setStrokeHistory(prev => [...prev, imageData])

    setIsDrawing(true)
    setLastPoint(point)
    setCurrentStroke([point])
    
    if (!hasSignature) {
      setHasSignature(true)
      onSignatureChange?.(true)
    }

    // Draw initial dot
    context.beginPath()
    context.arc(point.x, point.y, penWidth / 2, 0, 2 * Math.PI)
    context.fill()
  }, [disabled, getPointFromEvent, hasSignature, onSignatureChange, penWidth])

  // Continue drawing
  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return

    e.preventDefault()
    const context = contextRef.current
    if (!context || !lastPoint) return

    const currentPoint = getPointFromEvent(e.nativeEvent)
    setCurrentStroke(prev => [...prev, currentPoint])

    if (smoothing) {
      drawSmoothLine(context, lastPoint, currentPoint)
    } else {
      context.beginPath()
      context.moveTo(lastPoint.x, lastPoint.y)
      context.lineTo(currentPoint.x, currentPoint.y)
      context.stroke()
    }

    setLastPoint(currentPoint)
  }, [isDrawing, disabled, getPointFromEvent, lastPoint, smoothing, drawSmoothLine])

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!isDrawing) return

    setIsDrawing(false)
    setLastPoint(null)
    setCurrentStroke([])

    // Call completion callback if signature is complete
    if (hasSignature && onSignatureComplete) {
      const canvas = canvasRef.current
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png')
        onSignatureComplete(dataUrl)
      }
    }
  }, [isDrawing, hasSignature, onSignatureComplete])

  // Clear canvas
  const clear = useCallback(() => {
    const context = contextRef.current
    if (!context) return

    context.clearRect(0, 0, width, height)
    
    if (backgroundColor !== 'transparent') {
      context.fillStyle = backgroundColor
      context.fillRect(0, 0, width, height)
    }

    setHasSignature(false)
    setStrokeHistory([])
    onSignatureChange?.(false)
  }, [width, height, backgroundColor, onSignatureChange])

  // Undo last stroke
  const undo = useCallback(() => {
    if (strokeHistory.length === 0) return

    const context = contextRef.current
    if (!context) return

    const lastState = strokeHistory[strokeHistory.length - 1]
    context.putImageData(lastState, 0, 0)
    setStrokeHistory(prev => prev.slice(0, -1))

    const stillHasSignature = strokeHistory.length > 1
    setHasSignature(stillHasSignature)
    onSignatureChange?.(stillHasSignature)
  }, [strokeHistory, onSignatureChange])

  // Get signature data URL
  const getDataURL = useCallback((type?: string, quality?: number): string | null => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) return null
    return canvas.toDataURL(type, quality)
  }, [hasSignature])

  // Get signature as blob
  const getBlob = useCallback((callback: (blob: Blob | null) => void, type?: string, quality?: number) => {
    const canvas = canvasRef.current
    if (!canvas || !hasSignature) {
      callback(null)
      return
    }
    canvas.toBlob(callback, type, quality)
  }, [hasSignature])

  // Resize canvas
  const resize = useCallback((newWidth: number, newHeight: number) => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (!canvas || !context) return

    // Save current content
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    
    // Resize canvas
    canvas.width = newWidth * 2
    canvas.height = newHeight * 2
    canvas.style.width = `${newWidth}px`
    canvas.style.height = `${newHeight}px`
    
    // Restore settings
    context.scale(2, 2)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.strokeStyle = penColor
    context.lineWidth = penWidth
    
    // Restore content (scaled)
    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')
    if (tempCtx) {
      tempCanvas.width = imageData.width
      tempCanvas.height = imageData.height
      tempCtx.putImageData(imageData, 0, 0)
      context.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
    }
  }, [penColor, penWidth])

  // Expose methods via ref using useImperativeHandle
  useImperativeHandle(ref, () => ({
    clear,
    undo,
    getDataURL,
    getBlob,
    resize,
    isEmpty: () => !hasSignature
  }), [clear, undo, getDataURL, getBlob, resize, hasSignature])

  return (
    <div className="signature-canvas-container">
      <canvas
        ref={canvasRef}
        className={`border rounded-md ${
          disabled 
            ? 'cursor-not-allowed opacity-50' 
            : 'cursor-crosshair hover:border-primary/50'
        }`}
        style={{ 
          touchAction: 'none',
          background: backgroundColor === 'transparent' ? '#ffffff' : backgroundColor
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onTouchCancel={stopDrawing}
        aria-label={t('signature.canvas')}
        role="img"
      />
      {disabled && (
        <div className="absolute inset-0 bg-muted/50 rounded-md flex items-center justify-center">
          <span className="text-sm text-muted-foreground">{t('signature.disabled')}</span>
        </div>
      )}
    </div>
  )
})

SignatureCanvas.displayName = 'SignatureCanvas'

export default SignatureCanvas