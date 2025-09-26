"use client";

import {
  publishDocument,
  updateSignatureAreas,
  getSignedDocumentUrl,
} from "@/app/actions/document-actions";
import AreaSelector from "@/components/area-selector";
import PublishDocumentModal from "@/components/publish-document-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type {
  Document,
  Signature,
  SignatureArea,
} from "@/lib/supabase/database.types";
import { ArrowLeft, Copy, Edit, ExternalLink, Share, Download } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

interface DocumentDetailComponentProps {
  documentData: Document;
  signatures: Signature[];
}

export default function DocumentDetailComponent({
  documentData,
  signatures,
}: DocumentDetailComponentProps) {
  const { t } = useLanguage();
  const router = useRouter();

  const [document, setDocument] = useState<Document>(documentData);
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>(
    signatures.map((sig) => ({
      x: sig.x,
      y: sig.y,
      width: sig.width,
      height: sig.height,
    }))
  );

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">{t("status.draft")}</Badge>;
      case "published":
        return <Badge variant="default">{t("status.published")}</Badge>;
      case "completed":
        return <Badge variant="success">{t("status.completed")}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleEditModeToggle = () => {
    if (document.status === "draft") {
      setIsEditMode(!isEditMode);
      setError(null);
    }
  };

  const handleAddSignatureArea = () => {
    // Save current scroll position before switching to selection mode
    if (documentContainerRef.current) {
      const scrollTop = documentContainerRef.current.scrollTop;
      const scrollLeft = documentContainerRef.current.scrollLeft;

      setScrollPosition({
        top: scrollTop,
        left: scrollLeft,
      });
    }
    setIsSelecting(true);
  };

  const handleAreaSelected = (area: SignatureArea) => {
    // Simply store the area coordinates as they are
    setSignatureAreas([...signatureAreas, area]);
    setIsSelecting(false);
  };

  const handleRemoveArea = (index: number) => {
    const updatedAreas = [...signatureAreas];
    updatedAreas.splice(index, 1);
    setSignatureAreas(updatedAreas);
  };

  const handleSaveChanges = async () => {
    if (document.status !== "draft") return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await updateSignatureAreas(document.id, signatureAreas);

      if (result.error) {
        setError(result.error);
        return;
      }

      setIsEditMode(false);
      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error updating signature areas:", error);
      setError("서명 영역 업데이트 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (password: string, expiresAt: string) => {
    if (document.status !== "draft" || signatureAreas.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await publishDocument(document.id, password, expiresAt);

      if (result.error) {
        setError(result.error);
        return;
      }

      // Update local state
      setDocument({ ...document, status: "published" });
      if (result.shortUrl) {
        setPublishedUrl(`${window.location.origin}/sign/${result.shortUrl}`);
      }

      // Refresh the page data
      router.refresh();
    } catch (error) {
      console.error("Error publishing document:", error);
      setError("문서 발행 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (publishedUrl || document.short_url) {
      const urlToCopy =
        publishedUrl || `${window.location.origin}/sign/${document.short_url}`;
      await navigator.clipboard.writeText(urlToCopy);
      // TODO: Add toast notification
    }
  };

  const handleDownloadSignedDocument = () => {
    if (!isCompleted || !signedDocumentUrl) return;

    try {
      // 새 탭에서 다운로드 URL 열기
      window.open(signedDocumentUrl, '_blank');
    } catch (error) {
      console.error('Download failed:', error);
      setError('다운로드 중 오류가 발생했습니다.');
    }
  };

  const canEdit = document.status === "draft";
  const canPublish = document.status === "draft" && signatureAreas.length > 0;
  const isPublished = document.status === "published";
  const isCompleted = document.status === "completed";

  // 완료된 문서의 경우 signed URL 가져오기
  useEffect(() => {
    if (isCompleted && document.signed_file_url) {
      getSignedDocumentUrl(document.id).then((result) => {
        if (result.signedUrl) {
          setSignedDocumentUrl(result.signedUrl);
        } else {
          console.error('Failed to get signed document URL:', result.error);
        }
      });
    }
  }, [isCompleted, document.id, document.signed_file_url]);

  // 상태에 따라 표시할 이미지 결정
  const displayImageUrl =
    isCompleted && signedDocumentUrl
      ? signedDocumentUrl
      : document.file_url;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8"></div>

        {/* Document Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {document.filename}
            </h1>
            {getStatusBadge(document.status)}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-6">
            {canEdit && (
              <Button
                variant="outline"
                onClick={handleEditModeToggle}
                disabled={isLoading}
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditMode ? "편집 취소" : "수정하기"}
              </Button>
            )}

            {canPublish && !isEditMode && (
              <Button
                onClick={() => setIsPublishModalOpen(true)}
                disabled={isLoading}
              >
                <Share className="mr-2 h-4 w-4" />
                발급하기
              </Button>
            )}

            {isEditMode && (
              <Button onClick={handleSaveChanges} disabled={isLoading}>
                {isLoading ? "저장 중..." : "변경사항 저장"}
              </Button>
            )}

            {isCompleted && signedDocumentUrl && (
              <Button
                variant="outline"
                onClick={handleDownloadSignedDocument}
                disabled={isLoading}
              >
                <Download className="mr-2 h-4 w-4" />
                서명완료 문서 다운로드
              </Button>
            )}
          </div>

          {/* Published URL Display */}
          {isPublished && document.short_url && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">발행된 서명 URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg font-mono text-sm">
                    {`${window.location.origin}/sign/${document.short_url}`}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Link href={`/sign/${document.short_url}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  이 URL을 통해 서명자가 문서에 서명할 수 있습니다.
                  {!canEdit && " 발행된 문서는 더 이상 수정할 수 없습니다."}
                </p>
              </CardContent>
            </Card>
          )}


          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="relative border rounded-lg overflow-hidden">
          {isEditMode && isSelecting ? (
            <AreaSelector
              image={document.file_url}
              onAreaSelected={handleAreaSelected}
              onCancel={() => setIsSelecting(false)}
              existingAreas={signatureAreas}
              initialScrollPosition={scrollPosition}
            />
          ) : (
            <div ref={documentContainerRef} className="relative">
              <img
                src={displayImageUrl}
                alt={document.filename}
                className="w-full h-auto object-contain"
                draggable="false"
              />
              {/* Signature Area Overlays - 완료된 문서의 경우 서명 영역 오버레이 숨김 */}
              {!isCompleted && signatureAreas.map((area, index) => (
                <div
                  key={index}
                  className={`absolute border-2 flex items-center justify-center ${
                    isEditMode
                      ? "border-red-500 bg-red-500/10 cursor-pointer"
                      : "border-blue-500 bg-blue-500/10"
                  }`}
                  style={{
                    position: "absolute",
                    left: `${area.x}px`,
                    top: `${area.y}px`,
                    width: `${area.width}px`,
                    height: `${area.height}px`,
                    pointerEvents: "auto",
                    cursor: isEditMode ? "pointer" : "default",
                  }}
                  onClick={
                    isEditMode ? () => handleRemoveArea(index) : undefined
                  }
                >
                  <span
                    className={`text-xs font-medium ${
                      isEditMode ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    서명 영역 {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Mode Controls */}
        {isEditMode && !isSelecting && (
          <div className="mt-6 flex gap-4">
            <Button onClick={handleAddSignatureArea} disabled={isLoading}>
              서명 영역 추가
            </Button>
          </div>
        )}

        {/* Publish Document Modal */}
        <PublishDocumentModal
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          onPublish={handlePublish}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
