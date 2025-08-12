"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Eye,
  RefreshCw,
  Download,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  ImageDimensions,
  RelativeCoordinate,
  relativeToPixel,
  validateRelativeCoordinate,
  testCoordinateAccuracy,
  logCoordinateInfo,
} from "@/lib/coordinate-utils";

interface TestAreaRendererProps {
  imageUrl: string;
  imageDimensions: ImageDimensions;
  imageElement: HTMLImageElement;
}

interface TestDocument {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  imageInfo: {
    naturalWidth: number;
    naturalHeight: number;
    aspectRatio: string;
    orientation: string;
  };
  signatureAreas: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    required: boolean;
    signerName: string;
    description: string;
  }>;
}

interface TestScenario {
  name: string;
  width: number;
  height: number;
  scale: number;
}

interface RenderResult {
  areaId: string;
  relative: RelativeCoordinate;
  absolute: { x: number; y: number; width: number; height: number };
  validation: any;
  accuracy: any;
}

export default function TestAreaRenderer({
  imageUrl,
  imageDimensions,
  imageElement,
}: TestAreaRendererProps) {
  const [testData, setTestData] = useState<{
    testDocuments: TestDocument[];
  } | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<TestDocument | null>(
    null
  );
  const [currentScenario, setCurrentScenario] = useState<TestScenario>({
    name: "현재",
    width: imageDimensions.displayWidth,
    height: imageDimensions.displayHeight,
    scale: 1.0,
  });
  const [renderResults, setRenderResults] = useState<RenderResult[]>([]);
  const [containerScale, setContainerScale] = useState<number>(1.0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 테스트 시나리오 정의
  const testScenarios: TestScenario[] = [
    {
      name: "현재",
      width: imageDimensions.displayWidth,
      height: imageDimensions.displayHeight,
      scale: 1.0,
    },
    { name: "모바일 S", width: 320, height: 568, scale: 0.5 },
    { name: "모바일 M", width: 375, height: 667, scale: 0.6 },
    { name: "모바일 L", width: 425, height: 812, scale: 0.7 },
    { name: "태블릿", width: 768, height: 1024, scale: 0.8 },
    { name: "노트북", width: 1366, height: 768, scale: 0.9 },
    { name: "데스크톱", width: 1920, height: 1080, scale: 1.0 },
  ];

  // 테스트 데이터 로드
  useEffect(() => {
    const loadTestData = async () => {
      try {
        const response = await fetch("/test-data/coordinates-test.json");
        const data = await response.json();
        setTestData(data);

        // 첫 번째 문서를 기본 선택
        if (data.testDocuments && data.testDocuments.length > 0) {
          setSelectedDocument(data.testDocuments[0]);
        }

        console.log("📊 테스트 데이터 로드 완료:", data);
      } catch (error) {
        console.error("❌ 테스트 데이터 로드 실패:", error);
      }
    };

    loadTestData();
  }, []);

  // 선택된 문서가 변경될 때 렌더링 수행
  useEffect(() => {
    if (selectedDocument) {
      performRendering();
    }
  }, [selectedDocument, currentScenario]);

  // 이미지 표시 크기 및 오프셋 계산 함수
  const calculateImageLayout = () => {
    const containerWidth = currentScenario.width;
    const containerHeight = currentScenario.height;
    const imageAspectRatio =
      imageDimensions.naturalWidth / imageDimensions.naturalHeight;
    const containerAspectRatio = containerWidth / containerHeight;

    let actualDisplayWidth: number;
    let actualDisplayHeight: number;
    let imageOffsetX = 0;
    let imageOffsetY = 0;

    if (imageAspectRatio > containerAspectRatio) {
      // 이미지가 더 넓음 - 너비 기준으로 맞춤
      actualDisplayWidth = containerWidth;
      actualDisplayHeight = containerWidth / imageAspectRatio;
      imageOffsetX = 0;
      imageOffsetY = (containerHeight - actualDisplayHeight) / 2;
    } else {
      // 이미지가 더 높음 - 높이 기준으로 맞춤
      actualDisplayHeight = containerHeight;
      actualDisplayWidth = containerHeight * imageAspectRatio;
      imageOffsetX = (containerWidth - actualDisplayWidth) / 2;
      imageOffsetY = 0;
    }

    return {
      actualDisplayWidth,
      actualDisplayHeight,
      imageOffsetX,
      imageOffsetY,
    };
  };

  // 렌더링 수행
  const performRendering = () => {
    if (!selectedDocument) return;

    const results: RenderResult[] = [];
    const { actualDisplayWidth, actualDisplayHeight } = calculateImageLayout();

    const scenarioDimensions: ImageDimensions = {
      naturalWidth: imageDimensions.naturalWidth,
      naturalHeight: imageDimensions.naturalHeight,
      displayWidth: actualDisplayWidth,
      displayHeight: actualDisplayHeight,
    };

    console.group("🎨 서명영역 렌더링 수행");
    console.log("📐 시나리오 차원:", scenarioDimensions);

    selectedDocument.signatureAreas.forEach((area) => {
      try {
        const relative: RelativeCoordinate = {
          x: area.x,
          y: area.y,
          width: area.width,
          height: area.height,
        };

        // 상대 좌표 → 절대 좌표 변환
        const absolute = relativeToPixel(relative, scenarioDimensions);

        // 검증 수행
        const validation = validateRelativeCoordinate(relative);
        const accuracy = testCoordinateAccuracy(absolute, scenarioDimensions);

        // 디버깅 정보
        logCoordinateInfo(
          `${area.name} (${area.id})`,
          absolute,
          relative,
          scenarioDimensions
        );

        results.push({
          areaId: area.id,
          relative,
          absolute,
          validation,
          accuracy,
        });
      } catch (error) {
        console.error(`❌ ${area.name} 렌더링 실패:`, error);
      }
    });

    console.groupEnd();
    setRenderResults(results);
  };

  // 시나리오 변경
  const changeScenario = (scenarioName: string) => {
    const scenario = testScenarios.find((s) => s.name === scenarioName);
    if (scenario) {
      setCurrentScenario(scenario);
      console.log("🔄 시나리오 변경:", scenario);
    }
  };

  // 컨테이너 스케일 변경
  const handleScaleChange = (scale: number[]) => {
    setContainerScale(scale[0]);
  };

  // 렌더링 결과 다운로드
  const downloadResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      scenario: currentScenario,
      imageDimensions,
      selectedDocument: selectedDocument?.name,
      renderResults: renderResults.map((result) => ({
        areaId: result.areaId,
        areaName: selectedDocument?.signatureAreas.find(
          (a) => a.id === result.areaId
        )?.name,
        relative: result.relative,
        absolute: result.absolute,
        validation: result.validation,
        accuracy: result.accuracy,
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `render-test-${currentScenario.name}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 전체 검증 통과 여부
  const allValidationsPassed = renderResults.every(
    (result) => result.validation.isValid && result.accuracy.success
  );

  // 현재 이미지 표시 크기 계산
  const { actualDisplayWidth, actualDisplayHeight } = calculateImageLayout();
  const currentImageDisplaySize = {
    width: actualDisplayWidth * containerScale,
    height: actualDisplayHeight * containerScale,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              서명영역 렌더링 테스트
            </div>
            <div className="flex items-center gap-2">
              {allValidationsPassed ? (
                <Badge
                  variant="success"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  모든 검증 통과
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  검증 실패
                </Badge>
              )}
              <Badge variant="outline">{renderResults.length}개 영역</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 테스트 문서 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  테스트 문서
                </label>
                <Select
                  value={selectedDocument?.id}
                  onValueChange={(value) => {
                    const doc = testData?.testDocuments.find(
                      (d) => d.id === value
                    );
                    setSelectedDocument(doc || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="테스트 문서 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {testData?.testDocuments.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.name} ({doc.signatureAreas.length}개 영역)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 테스트 시나리오 선택 */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  테스트 시나리오
                </label>
                <Select
                  value={currentScenario.name}
                  onValueChange={changeScenario}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testScenarios.map((scenario) => (
                      <SelectItem key={scenario.name} value={scenario.name}>
                        {scenario.name} ({scenario.width}×{scenario.height})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 컨테이너 스케일 조정 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">표시 스케일</label>
                <span className="text-sm text-gray-600">
                  {Math.round(containerScale * 100)}%
                </span>
              </div>
              <Slider
                value={[containerScale]}
                onValueChange={handleScaleChange}
                min={0.2}
                max={2.0}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>20%</span>
                <span>100%</span>
                <span>200%</span>
              </div>
            </div>

            {/* 현재 설정 정보 */}
            <Alert>
              <Monitor className="w-4 h-4" />
              <AlertDescription>
                <strong>현재 설정:</strong> {currentScenario.name} (
                {currentScenario.width}×{currentScenario.height}) ×{" "}
                {Math.round(containerScale * 100)}% ={" "}
                {Math.round(currentImageDisplaySize.width)}×
                {Math.round(currentImageDisplaySize.height)}px
              </AlertDescription>
            </Alert>

            {/* 이미지 및 서명영역 표시 */}
            <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
              <div
                ref={containerRef}
                className="relative inline-block border border-gray-300 rounded overflow-hidden"
                style={{
                  transform: `scale(${containerScale})`,
                  transformOrigin: "top left",
                  width: currentScenario.width,
                  height: currentScenario.height,
                }}
              >
                <img
                  src={imageUrl}
                  alt="테스트 이미지"
                  className="block"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />

                {/* 렌더링된 서명영역들 */}
                {renderResults.map((result, index) => {
                  const area = selectedDocument?.signatureAreas.find(
                    (a) => a.id === result.areaId
                  );
                  const isValid =
                    result.validation.isValid && result.accuracy.success;
                  const { imageOffsetX, imageOffsetY } = calculateImageLayout();

                  return (
                    <div
                      key={result.areaId}
                      className={`absolute border-2 ${
                        isValid
                          ? "border-green-500 bg-green-100"
                          : "border-red-500 bg-red-100"
                      } bg-opacity-30`}
                      style={{
                        left: imageOffsetX + result.absolute.x,
                        top: imageOffsetY + result.absolute.y,
                        width: result.absolute.width,
                        height: result.absolute.height,
                      }}
                    >
                      <div
                        className={`absolute -top-6 left-0 ${
                          isValid ? "bg-green-500" : "bg-red-500"
                        } text-white text-xs px-1 py-0.5 rounded whitespace-nowrap z-10`}
                      >
                        {index + 1}. {area?.name}
                        {!isValid && " ❌"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button onClick={performRendering}>
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 렌더링
              </Button>
              {renderResults.length > 0 && (
                <Button onClick={downloadResults}>
                  <Download className="w-4 h-4 mr-2" />
                  결과 다운로드
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상세 결과 */}
      {selectedDocument && renderResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>렌더링 결과 상세</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 문서 정보 */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">
                  테스트 문서: {selectedDocument.name}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedDocument.description}
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <span>
                    <strong>영역 수:</strong>{" "}
                    {selectedDocument.signatureAreas.length}
                  </span>
                  <span>
                    <strong>이미지 비율:</strong>{" "}
                    {selectedDocument.imageInfo.aspectRatio}
                  </span>
                  <span>
                    <strong>방향:</strong>{" "}
                    {selectedDocument.imageInfo.orientation}
                  </span>
                  <span>
                    <strong>렌더링 성공:</strong>{" "}
                    {
                      renderResults.filter(
                        (r) => r.validation.isValid && r.accuracy.success
                      ).length
                    }
                    /{renderResults.length}
                  </span>
                </div>
              </div>

              {/* 각 영역별 상세 정보 */}
              {renderResults.map((result, index) => {
                const area = selectedDocument.signatureAreas.find(
                  (a) => a.id === result.areaId
                );
                const isValid =
                  result.validation.isValid && result.accuracy.success;

                return (
                  <div
                    key={result.areaId}
                    className={`border rounded-lg p-4 ${
                      isValid
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <h4 className="font-medium">{area?.name}</h4>
                        {area?.required && (
                          <Badge variant="secondary">필수</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="text-sm">
                          {isValid ? "검증 통과" : "검증 실패"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 원본 상대 좌표 */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">
                          상대 좌표 (원본)
                        </h5>
                        <div className="text-xs space-y-1">
                          <p>X: {result.relative.x.toFixed(4)}</p>
                          <p>Y: {result.relative.y.toFixed(4)}</p>
                          <p>너비: {result.relative.width.toFixed(4)}</p>
                          <p>높이: {result.relative.height.toFixed(4)}</p>
                        </div>
                      </div>

                      {/* 변환된 절대 좌표 */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">
                          절대 좌표 (변환됨)
                        </h5>
                        <div className="text-xs space-y-1">
                          <p>X: {Math.round(result.absolute.x)}px</p>
                          <p>Y: {Math.round(result.absolute.y)}px</p>
                          <p>너비: {Math.round(result.absolute.width)}px</p>
                          <p>높이: {Math.round(result.absolute.height)}px</p>
                        </div>
                      </div>

                      {/* 검증 정보 */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">
                          검증 결과
                        </h5>
                        <div className="text-xs space-y-1">
                          <p>
                            좌표 유효성:{" "}
                            {result.validation.isValid ? "✅" : "❌"}
                          </p>
                          <p>
                            변환 정확성: {result.accuracy.success ? "✅" : "❌"}
                          </p>
                          <p>
                            최대 오차: {result.accuracy.pixelDifference.maxDiff}
                            px
                          </p>
                          <p>경고: {result.validation.warnings.length}개</p>
                        </div>
                      </div>
                    </div>

                    {/* 에러/경고 메시지 */}
                    {result.validation.errors.length > 0 && (
                      <div className="mt-3 p-2 bg-red-100 rounded text-sm">
                        <strong>에러:</strong>
                        {result.validation.errors.map(
                          (error: string, idx: number) => (
                            <p key={idx} className="text-red-700">
                              • {error}
                            </p>
                          )
                        )}
                      </div>
                    )}
                    {result.validation.warnings.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-100 rounded text-sm">
                        <strong>경고:</strong>
                        {result.validation.warnings.map(
                          (warning: string, idx: number) => (
                            <p key={idx} className="text-yellow-700">
                              • {warning}
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
