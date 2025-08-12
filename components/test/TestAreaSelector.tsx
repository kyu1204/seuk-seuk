'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MousePointer, 
  Square, 
  Trash2, 
  Download, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Ruler
} from 'lucide-react'
import { 
  ImageDimensions, 
  AbsoluteCoordinate, 
  RelativeCoordinate,
  pixelToRelative,
  relativeToPixel,
  validateRelativeCoordinate,
  validateAbsoluteCoordinate,
  testCoordinateAccuracy,
  logCoordinateInfo
} from '@/lib/coordinate-utils'

interface TestAreaSelectorProps {
  imageUrl: string
  imageDimensions: ImageDimensions
  imageElement: HTMLImageElement
  onAreasChange: (areas: Array<{
    id: string
    name: string
    absolute: AbsoluteCoordinate
    relative: RelativeCoordinate
    validation: any
  }>) => void
}

interface SelectedArea {
  id: string
  name: string
  absolute: AbsoluteCoordinate
  relative: RelativeCoordinate
  validation: {
    absolute: any
    relative: any
    accuracy: any
  }
  isEditing: boolean
}

export default function TestAreaSelector({ 
  imageUrl, 
  imageDimensions, 
  imageElement,
  onAreasChange 
}: TestAreaSelectorProps) {
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null)
  const [selectedAreas, setSelectedAreas] = useState<SelectedArea[]>([])
  const [nextAreaName, setNextAreaName] = useState<string>('서명영역-1')
  const containerRef = useRef<HTMLDivElement>(null)

  // 좌표 계산 (이미지 컨테이너 기준)
  const getCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current || !imageElement) return { x: 0, y: 0 }

    const containerRect = containerRef.current.getBoundingClientRect()
    const imageRect = imageElement.getBoundingClientRect()
    
    // 이미지 요소의 실제 위치 계산 (컨테이너 내에서)
    const imageOffsetX = imageRect.left - containerRect.left
    const imageOffsetY = imageRect.top - containerRect.top
    
    // 클릭 위치가 이미지 영역 내인지 확인
    const relativeX = clientX - containerRect.left - imageOffsetX
    const relativeY = clientY - containerRect.top - imageOffsetY
    
    return {
      x: Math.max(0, Math.min(imageDimensions.displayWidth, relativeX)),
      y: Math.max(0, Math.min(imageDimensions.displayHeight, relativeY))
    }
  }, [imageDimensions, imageElement])

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e.clientX, e.clientY)
    setStartPos({ x, y })
    setCurrentPos({ x, y })
    setIsSelecting(true)
    
    console.log('🎯 영역 선택 시작:', { x, y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !startPos) return
    
    const { x, y } = getCoordinates(e.clientX, e.clientY)
    setCurrentPos({ x, y })
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      const width = Math.abs(currentPos.x - startPos.x)
      const height = Math.abs(currentPos.y - startPos.y)

      // 최소 크기 확인 (20x20 픽셀)
      if (width > 20 && height > 20) {
        addSelectedArea({ x, y, width, height })
      } else {
        console.log('⚠️ 영역이 너무 작습니다:', { width, height })
      }
    }

    setIsSelecting(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  // 터치 이벤트 핸들러 (모바일 지원)
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    const { x, y } = getCoordinates(touch.clientX, touch.clientY)
    setStartPos({ x, y })
    setCurrentPos({ x, y })
    setIsSelecting(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting || !startPos) return
    
    const touch = e.touches[0]
    const { x, y } = getCoordinates(touch.clientX, touch.clientY)
    setCurrentPos({ x, y })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    
    if (isSelecting && startPos && currentPos) {
      const x = Math.min(startPos.x, currentPos.x)
      const y = Math.min(startPos.y, currentPos.y)
      const width = Math.abs(currentPos.x - startPos.x)
      const height = Math.abs(currentPos.y - startPos.y)

      if (width > 20 && height > 20) {
        addSelectedArea({ x, y, width, height })
      }
    }

    setIsSelecting(false)
    setStartPos(null)
    setCurrentPos(null)
  }

  // 선택된 영역 추가
  const addSelectedArea = (absolute: AbsoluteCoordinate) => {
    try {
      // 절대 좌표 → 상대 좌표 변환
      const relative = pixelToRelative(absolute, imageDimensions)
      
      // 검증 수행
      const absoluteValidation = validateAbsoluteCoordinate(absolute, imageDimensions)
      const relativeValidation = validateRelativeCoordinate(relative)
      const accuracyTest = testCoordinateAccuracy(absolute, imageDimensions)
      
      // 디버깅 정보 출력
      logCoordinateInfo('새 서명영역', absolute, relative, imageDimensions)
      
      const newArea: SelectedArea = {
        id: `area-${Date.now()}`,
        name: nextAreaName,
        absolute,
        relative,
        validation: {
          absolute: absoluteValidation,
          relative: relativeValidation,
          accuracy: accuracyTest
        },
        isEditing: false
      }
      
      const newAreas = [...selectedAreas, newArea]
      setSelectedAreas(newAreas)
      
      // 다음 영역 이름 자동 생성
      const nextNumber = selectedAreas.length + 2
      setNextAreaName(`서명영역-${nextNumber}`)
      
      // 부모 컴포넌트에 알림
      onAreasChange(newAreas)
      
      console.log('✅ 새 서명영역 추가됨:', newArea)
      
    } catch (error) {
      console.error('❌ 서명영역 추가 실패:', error)
    }
  }

  // 영역 삭제
  const removeArea = (id: string) => {
    const newAreas = selectedAreas.filter(area => area.id !== id)
    setSelectedAreas(newAreas)
    onAreasChange(newAreas)
    console.log('🗑️ 서명영역 삭제됨:', id)
  }

  // 영역 이름 변경
  const updateAreaName = (id: string, newName: string) => {
    const newAreas = selectedAreas.map(area => 
      area.id === id ? { ...area, name: newName, isEditing: false } : area
    )
    setSelectedAreas(newAreas)
    onAreasChange(newAreas)
  }

  // JSON 다운로드
  const downloadAreasAsJson = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      imageDimensions,
      signatureAreas: selectedAreas.map(area => ({
        id: area.id,
        name: area.name,
        relativeCoordinates: area.relative,
        absoluteCoordinates: area.absolute,
        validation: area.validation
      }))
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `signature-areas-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('📥 JSON 파일 다운로드:', exportData)
  }

  // 현재 선택 중인 영역 계산
  const currentSelectionArea = isSelecting && startPos && currentPos ? {
    x: Math.min(startPos.x, currentPos.x),
    y: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y)
  } : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              서명영역 선택 테스트
            </div>
            <Badge variant="secondary">
              {selectedAreas.length}개 선택됨
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 다음 영역 이름 설정 */}
            <div className="flex items-center gap-2">
              <Label htmlFor="area-name">다음 영역 이름:</Label>
              <Input
                id="area-name"
                value={nextAreaName}
                onChange={(e) => setNextAreaName(e.target.value)}
                className="max-w-xs"
                placeholder="영역 이름 입력"
              />
            </div>

            {/* 이미지 컨테이너 */}
            <div 
              ref={containerRef}
              className="relative inline-block border-2 border-gray-200 rounded-lg overflow-hidden cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'none' }}
            >
              <img
                src={imageUrl}
                alt="테스트 이미지"
                className="block max-w-full max-h-96"
                draggable={false}
              />
              
              {/* 선택된 영역들 표시 */}
              {selectedAreas.map((area, index) => (
                <div
                  key={area.id}
                  className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-30"
                  style={{
                    left: area.absolute.x,
                    top: area.absolute.y,
                    width: area.absolute.width,
                    height: area.absolute.height
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
                    {index + 1}. {area.name}
                  </div>
                </div>
              ))}
              
              {/* 현재 선택 중인 영역 */}
              {currentSelectionArea && (
                <div
                  className="absolute border-2 border-red-500 border-dashed bg-red-100 bg-opacity-20"
                  style={{
                    left: currentSelectionArea.x,
                    top: currentSelectionArea.y,
                    width: currentSelectionArea.width,
                    height: currentSelectionArea.height
                  }}
                >
                  <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                    선택 중... ({Math.round(currentSelectionArea.width)}×{Math.round(currentSelectionArea.height)})
                  </div>
                </div>
              )}
            </div>

            {/* 안내 메시지 */}
            <Alert>
              <MousePointer className="w-4 h-4" />
              <AlertDescription>
                이미지 위에서 드래그하여 서명영역을 선택하세요. 
                선택된 영역은 자동으로 상대 좌표로 변환됩니다.
              </AlertDescription>
            </Alert>

            {/* 액션 버튼 */}
            {selectedAreas.length > 0 && (
              <div className="flex gap-2">
                <Button onClick={downloadAreasAsJson}>
                  <Download className="w-4 h-4 mr-2" />
                  JSON 다운로드
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    setSelectedAreas([])
                    onAreasChange([])
                    setNextAreaName('서명영역-1')
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  모든 영역 삭제
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 선택된 영역 목록 */}
      {selectedAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              선택된 영역 상세 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {selectedAreas.map((area, index) => (
                <div key={area.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{index + 1}</Badge>
                      {area.isEditing ? (
                        <Input
                          defaultValue={area.name}
                          onBlur={(e) => updateAreaName(area.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateAreaName(area.id, e.currentTarget.value)
                            }
                          }}
                          className="max-w-xs"
                          autoFocus
                        />
                      ) : (
                        <h4 
                          className="font-medium cursor-pointer hover:text-blue-600"
                          onClick={() => {
                            const newAreas = selectedAreas.map(a => 
                              a.id === area.id ? { ...a, isEditing: true } : { ...a, isEditing: false }
                            )
                            setSelectedAreas(newAreas)
                          }}
                        >
                          {area.name}
                        </h4>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeArea(area.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 절대 좌표 */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">절대 좌표 (픽셀)</h5>
                      <div className="text-sm space-y-1">
                        <p>X: {Math.round(area.absolute.x)}px</p>
                        <p>Y: {Math.round(area.absolute.y)}px</p>
                        <p>너비: {Math.round(area.absolute.width)}px</p>
                        <p>높이: {Math.round(area.absolute.height)}px</p>
                      </div>
                    </div>

                    {/* 상대 좌표 */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">상대 좌표 (비율)</h5>
                      <div className="text-sm space-y-1">
                        <p>X: {area.relative.x.toFixed(4)}</p>
                        <p>Y: {area.relative.y.toFixed(4)}</p>
                        <p>너비: {area.relative.width.toFixed(4)}</p>
                        <p>높이: {area.relative.height.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 검증 결과 */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {area.validation.accuracy.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        변환 정확성: {area.validation.accuracy.success ? '통과' : '실패'} 
                        (최대 오차: {area.validation.accuracy.pixelDifference.maxDiff}px)
                      </span>
                    </div>

                    {/* 경고 메시지 */}
                    {area.validation.relative.warnings.length > 0 && (
                      <div className="text-sm text-yellow-600">
                        {area.validation.relative.warnings.map((warning, idx) => (
                          <p key={idx}>⚠️ {warning}</p>
                        ))}
                      </div>
                    )}

                    {/* 에러 메시지 */}
                    {area.validation.relative.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        {area.validation.relative.errors.map((error, idx) => (
                          <p key={idx}>❌ {error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}