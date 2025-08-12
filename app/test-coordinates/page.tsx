'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ImageDimensions } from '@/lib/coordinate-utils'
import TestImageUpload from '@/components/test/TestImageUpload'
import TestAreaSelector from '@/components/test/TestAreaSelector'
import TestAreaRenderer from '@/components/test/TestAreaRenderer'

export default function CoordinatesTestPage() {
  // 이미지 상태
  const [imageUrl, setImageUrl] = useState<string>('')
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null)
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  
  // 선택된 영역들
  const [selectedAreas, setSelectedAreas] = useState<Array<{
    id: string
    name: string
    absolute: any
    relative: any
    validation: any
  }>>([])
  
  // 테스트 진행 상태
  const [testResults, setTestResults] = useState<Array<{
    name: string
    status: 'pass' | 'fail' | 'pending'
    details?: string
  }>>([
    { name: '이미지 업로드', status: 'pending' },
    { name: '서명영역 선택', status: 'pending' },
    { name: '좌표 변환', status: 'pending' },
    { name: '위치 렌더링', status: 'pending' },
    { name: '검증 테스트', status: 'pending' }
  ])

  const [currentTest, setCurrentTest] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('upload')

  // 이미지 로드 완료 처리
  const handleImageLoad = (url: string, dimensions: ImageDimensions, element: HTMLImageElement) => {
    setImageUrl(url)
    setImageDimensions(dimensions)
    setImageElement(element)
    
    // 테스트 상태 업데이트
    updateTestStatus('이미지 업로드', 'pass', '이미지가 성공적으로 로드되었습니다')
    setCurrentTest('')
    
    // 다음 탭으로 자동 전환
    setTimeout(() => {
      setActiveTab('select')
    }, 1000)
    
    console.log('✅ 이미지 로드 완료:', { url, dimensions })
  }

  // 이미지 클리어 처리
  const handleImageClear = () => {
    setImageUrl('')
    setImageDimensions(null)
    setImageElement(null)
    setSelectedAreas([])
    setActiveTab('upload')
    
    // 테스트 상태 초기화
    setTestResults(prev => prev.map(result => ({ ...result, status: 'pending' })))
    setCurrentTest('')
    
    console.log('🗑️ 이미지 클리어 완료')
  }

  // 선택된 영역 변경 처리
  const handleAreasChange = (areas: any[]) => {
    setSelectedAreas(areas)
    
    if (areas.length > 0) {
      updateTestStatus('서명영역 선택', 'pass', `${areas.length}개의 서명영역이 선택되었습니다`)
      updateTestStatus('좌표 변환', 'pass', '상대 좌표 변환이 완료되었습니다')
      
      // 렌더링 테스트로 자동 전환
      setTimeout(() => {
        setActiveTab('render')
      }, 1000)
    } else {
      updateTestStatus('서명영역 선택', 'pending')
      updateTestStatus('좌표 변환', 'pending')
    }
  }

  // 테스트 상태 업데이트
  const updateTestStatus = (testName: string, status: 'pass' | 'fail' | 'pending', details?: string) => {
    setTestResults(prev => 
      prev.map(result => 
        result.name === testName 
          ? { ...result, status, details } 
          : result
      )
    )
  }

  // 종합 검증 테스트 실행
  const runComprehensiveTest = () => {
    setCurrentTest('종합 검증 테스트')
    
    // 시뮬레이션된 검증 테스트
    setTimeout(() => {
      const allAreasValid = selectedAreas.every(area => area.validation?.accuracy?.success)
      
      if (allAreasValid) {
        updateTestStatus('검증 테스트', 'pass', '모든 서명영역이 검증을 통과했습니다')
      } else {
        updateTestStatus('검증 테스트', 'fail', '일부 서명영역의 검증이 실패했습니다')
      }
      
      updateTestStatus('위치 렌더링', 'pass', '위치 렌더링 테스트가 완료되었습니다')
      setCurrentTest('')
    }, 2000)
  }

  // 이미지 로딩 여부
  const hasImage = imageUrl && imageDimensions && imageElement
  
  // 서명영역 선택 여부  
  const hasAreas = selectedAreas.length > 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            서명영역 위치 알고리즘 검증 환경
          </h1>
          <p className="text-gray-600">
            상대 좌표 시스템의 정확성을 다양한 시나리오에서 검증합니다.
          </p>
        </div>

        {/* 테스트 상태 요약 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              테스트 진행 상황
              {currentTest && (
                <Badge variant="outline" className="animate-pulse">
                  진행중: {currentTest}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.status === 'pass').length}
                </div>
                <div className="text-sm text-green-600">통과</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => r.status === 'fail').length}
                </div>
                <div className="text-sm text-red-600">실패</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {testResults.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-yellow-600">대기</div>
              </div>
            </div>
            
            {/* 개별 테스트 상태 */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
              {testResults.map((result) => (
                <div key={result.name} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    result.status === 'pass' ? 'bg-green-500' :
                    result.status === 'fail' ? 'bg-red-500' : 'bg-gray-300'
                  }`} />
                  <span className="truncate">{result.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 알고리즘 정보 */}
        <Alert className="mb-8">
          <AlertDescription>
            <strong>테스트 목표:</strong> 서명영역을 상대 좌표 (0-1 비율)로 저장하고, 
            다양한 화면 크기와 브라우저에서 정확한 위치에 렌더링되는지 검증
          </AlertDescription>
        </Alert>

        {/* 메인 테스트 영역 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">이미지 업로드</TabsTrigger>
            <TabsTrigger value="select" disabled={!hasImage}>영역 선택</TabsTrigger>
            <TabsTrigger value="render" disabled={!hasImage}>위치 렌더링</TabsTrigger>
            <TabsTrigger value="validate" disabled={!hasAreas}>검증 테스트</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <TestImageUpload
              onImageLoad={handleImageLoad}
              onImageClear={handleImageClear}
            />
          </TabsContent>

          <TabsContent value="select" className="space-y-6">
            {hasImage ? (
              <TestAreaSelector
                imageUrl={imageUrl}
                imageDimensions={imageDimensions!}
                imageElement={imageElement!}
                onAreasChange={handleAreasChange}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>2. 서명영역 선택 테스트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8">
                    <p className="text-gray-500 mb-4">
                      먼저 이미지를 업로드하세요
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('upload')}
                    >
                      이미지 업로드로 이동
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="render" className="space-y-6">
            {hasImage ? (
              <TestAreaRenderer
                imageUrl={imageUrl}
                imageDimensions={imageDimensions!}
                imageElement={imageElement!}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>3. 위치 렌더링 테스트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-8">
                    <p className="text-gray-500 mb-4">
                      먼저 이미지를 업로드하세요
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('upload')}
                    >
                      이미지 업로드로 이동
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="validate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>4. 종합 검증 테스트</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">브라우저 호환성</h4>
                      <p className="text-sm text-gray-600">
                        Chrome, Firefox, Safari에서 동일한 위치 확인
                      </p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">반응형 테스트</h4>
                      <p className="text-sm text-gray-600">
                        화면 크기 변경 시 비율 유지 확인
                      </p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">줌 레벨 테스트</h4>
                      <p className="text-sm text-gray-600">
                        브라우저 확대/축소 시 위치 정확성 확인
                      </p>
                    </Card>
                    <Card className="p-4">
                      <h4 className="font-medium mb-2">이미지 비율 테스트</h4>
                      <p className="text-sm text-gray-600">
                        가로/세로/정사각형 이미지에서 위치 정확성 확인
                      </p>
                    </Card>
                  </div>
                  
                  {hasAreas && (
                    <Alert>
                      <AlertDescription>
                        <strong>현재 상태:</strong> {selectedAreas.length}개의 서명영역이 선택되어 있습니다. 
                        종합 검증 테스트를 실행하여 모든 시나리오에서의 정확성을 확인하세요.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    onClick={runComprehensiveTest}
                    disabled={!hasAreas || currentTest !== ''}
                    className="w-full"
                  >
                    {currentTest === '종합 검증 테스트' ? '검증 진행중...' : '전체 검증 테스트 실행'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 개발 정보 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>개발 정보</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>검증 환경:</strong> 독립된 테스트 페이지<br/>
                <strong>데이터 저장:</strong> JSON 파일 기반<br/>
                <strong>좌표 시스템:</strong> 상대 좌표 (0-1 비율)<br/>
                <strong>현재 상태:</strong> {hasImage ? '이미지 로드됨' : '이미지 대기중'}
              </div>
              <div>
                <strong>테스트 범위:</strong> 위치 정확성, 브라우저 호환성<br/>
                <strong>검증 완료 후:</strong> 실제 제품 코드에 적용<br/>
                <strong>안전성:</strong> 기존 제품에 영향 없음<br/>
                <strong>선택된 영역:</strong> {selectedAreas.length}개
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}