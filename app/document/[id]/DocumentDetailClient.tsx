"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Share, ExternalLink, Copy, Key } from "lucide-react"
import Link from "next/link"
import AreaSelector from "@/components/area-selector"
import { publishDocument, updateSignatureAreas } from "@/app/actions/document-actions"
import { useLanguage } from "@/contexts/language-context"
import type { Document, Signature, SignatureArea } from "@/lib/supabase/database.types"

interface DocumentDetailClientProps {
  documentData: Document
  signatures: Signature[]
}

export default function DocumentDetailClient({ documentData, signatures }: DocumentDetailClientProps) {
  const { t } = useLanguage()
  const router = useRouter()

  const [document, setDocument] = useState<Document>(documentData)
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>(
    signatures.map(sig => ({ x: sig.x, y: sig.y, width: sig.width, height: sig.height }))
  )

  const [isEditMode, setIsEditMode] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [password, setPassword] = useState<string>('')
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false)
  const documentContainerRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">초안</Badge>
      case 'published':
        return <Badge variant="default">발행됨</Badge>
      case 'completed':
        return <Badge variant="outline">완료됨</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleEditModeToggle = () => {
    if (document.status === 'draft') {
      setIsEditMode(!isEditMode)
      setError(null)
    }
  }

  const handleAddSignatureArea = () => {
    // Save current scroll position before switching to selection mode
    if (documentContainerRef.current) {
      const scrollTop = documentContainerRef.current.scrollTop
      const scrollLeft = documentContainerRef.current.scrollLeft

      setScrollPosition({
        top: scrollTop,
        left: scrollLeft,
      })
    }
    setIsSelecting(true)
  }

  const handleAreaSelected = (area: SignatureArea) => {
    // Simply store the area coordinates as they are
    setSignatureAreas([...signatureAreas, area])
    setIsSelecting(false)
  }

  const handleRemoveArea = (index: number) => {
    const updatedAreas = [...signatureAreas]
    updatedAreas.splice(index, 1)
    setSignatureAreas(updatedAreas)
  }

  const handleSaveChanges = async () => {
    if (document.status !== 'draft') return

    setIsLoading(true)
    setError(null)

    try {
      const result = await updateSignatureAreas(document.id, signatureAreas)

      if (result.error) {
        setError(result.error)
        return
      }

      setIsEditMode(false)
      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error updating signature areas:", error)
      setError("서명 영역 업데이트 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublish = async () => {
    if (document.status !== 'draft' || signatureAreas.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await publishDocument(document.id, password || null)

      if (result.error) {
        setError(result.error)
        return
      }

      // Update local state
      setDocument({ ...document, status: 'published' })
      if (result.shortUrl) {
        setPublishedUrl(`${window.location.origin}/sign/${result.shortUrl}`)
      }

      // Reset password input
      setPassword('')
      setShowPasswordInput(false)

      // Refresh the page data
      router.refresh()
    } catch (error) {
      console.error("Error publishing document:", error)
      setError("문서 발행 중 오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (publishedUrl || document.short_url) {
      const urlToCopy = publishedUrl || `${window.location.origin}/sign/${document.short_url}`
      await navigator.clipboard.writeText(urlToCopy)
      // TODO: Add toast notification
    }
  }

  const canEdit = document.status === 'draft'
  const canPublish = document.status === 'draft' && signatureAreas.length > 0
  const isPublished = document.status === 'published'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/upload">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              업로드로 돌아가기
            </Button>
          </Link>
        </div>

        {/* Document Info */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold tracking-tight">{document.filename}</h1>
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
                {isEditMode ? '편집 취소' : '수정하기'}
              </Button>
            )}

            {canPublish && !isEditMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                  disabled={isLoading}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {showPasswordInput ? '비밀번호 설정 취소' : '비밀번호 설정'}
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={isLoading}
                >
                  <Share className="mr-2 h-4 w-4" />
                  {isLoading ? '발행 중...' : '발행하기'}
                </Button>
              </div>
            )}

            {isEditMode && (
              <Button
                onClick={handleSaveChanges}
                disabled={isLoading}
              >
                {isLoading ? '저장 중...' : '변경사항 저장'}
              </Button>
            )}
          </div>

          {/* Password Input */}
          {showPasswordInput && canPublish && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">문서 보안 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">비밀번호 (선택사항)</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="서명 페이지 접근 시 필요한 비밀번호를 입력하세요"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-600">
                    비밀번호를 설정하면 서명자가 문서에 접근할 때 비밀번호를 입력해야 합니다. 비워두면 누구나 접근할 수 있습니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                  {!canEdit && ' 발행된 문서는 더 이상 수정할 수 없습니다.'}
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
                src={document.file_url}
                alt={document.filename}
                className="w-full h-auto object-contain"
                draggable="false"
              />
              {/* Signature Area Overlays */}
              {signatureAreas.map((area, index) => (
                <div
                  key={index}
                  className={`absolute border-2 flex items-center justify-center ${
                    isEditMode
                      ? 'border-red-500 bg-red-500/10 cursor-pointer'
                      : 'border-blue-500 bg-blue-500/10'
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
                  onClick={isEditMode ? () => handleRemoveArea(index) : undefined}
                >
                  <span className={`text-xs font-medium ${
                    isEditMode ? 'text-red-600' : 'text-blue-600'
                  }`}>
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
      </div>
    </div>
  )
}