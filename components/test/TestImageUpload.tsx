"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  FileImage,
  Upload,
  X,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  ImageDimensions,
  waitForImageLoad,
  getImageDimensions,
} from "@/lib/coordinate-utils";

interface TestImageUploadProps {
  onImageLoad: (
    imageUrl: string,
    dimensions: ImageDimensions,
    imageElement: HTMLImageElement
  ) => void;
  onImageClear: () => void;
}

interface ImageInfo {
  file: File;
  url: string;
  dimensions: ImageDimensions | null;
  element: HTMLImageElement | null;
  loadingProgress: number;
  error: string | null;
}

export default function TestImageUpload({
  onImageLoad,
  onImageClear,
}: TestImageUploadProps) {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // 지원되는 이미지 형식
  const SUPPORTED_FORMATS = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = useCallback(
    async (file: File) => {
      // 파일 형식 검증
      if (!SUPPORTED_FORMATS.includes(file.type)) {
        setImageInfo({
          file,
          url: "",
          dimensions: null,
          element: null,
          loadingProgress: 0,
          error: `지원되지 않는 파일 형식: ${file.type}`,
        });
        return;
      }

      // 파일 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        setImageInfo({
          file,
          url: "",
          dimensions: null,
          element: null,
          loadingProgress: 0,
          error: `파일 크기가 너무 큽니다: ${(file.size / 1024 / 1024).toFixed(
            2
          )}MB (최대 10MB)`,
        });
        return;
      }

      setIsLoading(true);

      try {
        // 파일 URL 생성
        const url = URL.createObjectURL(file);

        setImageInfo({
          file,
          url,
          dimensions: null,
          element: null,
          loadingProgress: 25,
          error: null,
        });

        // 새로운 이미지 엘리먼트 생성 및 로딩
        const tempImage = new Image();
        tempImage.src = url;

        setImageInfo((prev) =>
          prev ? { ...prev, loadingProgress: 50 } : null
        );

        const dimensions = await waitForImageLoad(tempImage);

        // imageRef에 설정
        if (imageRef.current) {
          imageRef.current.src = url;
          imageRef.current.onload = () => {
            console.log("✅ 이미지 ref 로딩 완료");
          };
        }

        setImageInfo((prev) =>
          prev
            ? {
                ...prev,
                dimensions,
                element: tempImage,
                loadingProgress: 100,
              }
            : null
        );

        // 부모 컴포넌트에 알림
        onImageLoad(url, dimensions, tempImage);

        console.log("✅ 이미지 처리 완료:", { url, dimensions });
      } catch (error) {
        console.error("이미지 로딩 실패:", error);
        setImageInfo((prev) =>
          prev
            ? {
                ...prev,
                error:
                  error instanceof Error
                    ? error.message
                    : "이미지 로딩에 실패했습니다",
                loadingProgress: 0,
              }
            : null
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onImageLoad]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const clearImage = () => {
    if (imageInfo?.url) {
      URL.revokeObjectURL(imageInfo.url);
    }
    setImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageClear();
  };

  const formatFileSize = (bytes: number): string => {
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${kb.toFixed(1)} KB`;
    }
  };

  const formatDimensions = (dimensions: ImageDimensions): string => {
    return `${dimensions.naturalWidth} × ${dimensions.naturalHeight}`;
  };

  const getAspectRatio = (dimensions: ImageDimensions): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(dimensions.naturalWidth, dimensions.naturalHeight);
    const ratioW = dimensions.naturalWidth / divisor;
    const ratioH = dimensions.naturalHeight / divisor;

    // 일반적인 비율 표시
    if (ratioW === 16 && ratioH === 9) return "16:9 (와이드)";
    if (ratioW === 4 && ratioH === 3) return "4:3 (표준)";
    if (ratioW === 3 && ratioH === 4) return "3:4 (세로)";
    if (ratioW === 1 && ratioH === 1) return "1:1 (정사각형)";
    if (ratioW === 21 && ratioH === 9) return "21:9 (시네마)";

    return `${ratioW}:${ratioH}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            테스트 이미지 업로드
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!imageInfo ? (
            // 업로드 영역
            <div
              className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                이미지를 업로드하세요
              </h3>
              <p className="text-gray-600 mb-4">
                드래그 & 드롭하거나 클릭하여 파일을 선택하세요
              </p>
              <div className="space-y-1 text-sm text-gray-500">
                <p>지원 형식: JPEG, PNG, WebP, GIF</p>
                <p>최대 크기: 10MB</p>
              </div>
            </div>
          ) : (
            // 이미지 미리보기 및 정보
            <div className="space-y-4">
              {/* 로딩 진행률 */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>이미지 로딩 중...</span>
                    <span>{imageInfo.loadingProgress}%</span>
                  </div>
                  <Progress value={imageInfo.loadingProgress} />
                </div>
              )}

              {/* 에러 메시지 */}
              {imageInfo.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{imageInfo.error}</AlertDescription>
                </Alert>
              )}

              {/* 성공적으로 로딩된 경우 */}
              {imageInfo.dimensions && !imageInfo.error && (
                <>
                  {/* 이미지 미리보기 */}
                  <div className="relative">
                    <img
                      ref={imageRef}
                      src={imageInfo.url}
                      alt="테스트 이미지"
                      className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
                      style={{ display: "block" }}
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={clearImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 성공 알림 */}
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      이미지가 성공적으로 로딩되었습니다. 이제 서명영역을 선택할
                      수 있습니다.
                    </AlertDescription>
                  </Alert>
                </>
              )}

              {/* 파일 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">파일 정보</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">이름:</span>{" "}
                      {imageInfo.file.name}
                    </p>
                    <p>
                      <span className="font-medium">크기:</span>{" "}
                      {formatFileSize(imageInfo.file.size)}
                    </p>
                    <p>
                      <span className="font-medium">형식:</span>{" "}
                      {imageInfo.file.type}
                    </p>
                    <p>
                      <span className="font-medium">수정일:</span>{" "}
                      {new Date(imageInfo.file.lastModified).toLocaleString(
                        "ko-KR"
                      )}
                    </p>
                  </div>
                </div>

                {imageInfo.dimensions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      이미지 차원
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <span className="font-medium">원본 크기:</span>{" "}
                        {formatDimensions(imageInfo.dimensions)}
                      </p>
                      <p>
                        <span className="font-medium">화면 크기:</span>{" "}
                        {Math.round(imageInfo.dimensions.displayWidth)} ×{" "}
                        {Math.round(imageInfo.dimensions.displayHeight)}
                      </p>
                      <p>
                        <span className="font-medium">비율:</span>{" "}
                        {getAspectRatio(imageInfo.dimensions)}
                      </p>
                      <p>
                        <span className="font-medium">스케일:</span>{" "}
                        <Badge variant="outline" className="text-xs">
                          {(
                            (imageInfo.dimensions.displayWidth /
                              imageInfo.dimensions.naturalWidth) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("🔄 다른 이미지 선택 클릭");
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  다른 이미지 선택
                </Button>
                <Button variant="destructive" onClick={clearImage}>
                  <X className="w-4 h-4 mr-2" />
                  이미지 제거
                </Button>
              </div>
            </div>
          )}

          {/* 숨겨진 파일 입력 - 항상 존재 */}
          <input
            ref={fileInputRef}
            type="file"
            accept={SUPPORTED_FORMATS.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* 개발자 정보 */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          <strong>테스트 목적:</strong> 업로드된 이미지에서 정확한 차원 정보를
          추출하여 상대 좌표 시스템의 기준점으로 사용합니다. 이미지 로딩 완료 후
          서명영역 선택이 가능합니다.
        </AlertDescription>
      </Alert>
    </div>
  );
}
