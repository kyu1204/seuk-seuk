"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/supabase/database.types";
import { createPublication } from "@/app/actions/publication-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";

interface PublishFormProps {
  documents: Document[];
}

export default function PublishForm({ documents }: PublishFormProps) {
  const router = useRouter();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [publicationName, setPublicationName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map((doc) => doc.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!publicationName.trim()) {
      setError("발행 이름을 입력해주세요.");
      return;
    }

    if (selectedDocuments.length === 0) {
      setError("최소 1개 이상의 문서를 선택해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createPublication(
        publicationName,
        password,
        expiresAt || null,
        selectedDocuments
      );

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.success && result.shortUrl) {
        // Redirect to a success page or dashboard
        router.push(`/dashboard?published=true&shortUrl=${result.shortUrl}`);
      }
    } catch (err) {
      setError("발행 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="publicationName">발행 이름</Label>
        <Input
          id="publicationName"
          type="text"
          value={publicationName}
          onChange={(e) => setPublicationName(e.target.value)}
          placeholder="예: 2024년 1분기 계약서"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호 (선택사항)</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="서명 페이지 접근 시 필요한 비밀번호"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expiresAt">만료일 (선택사항)</Label>
        <Input
          id="expiresAt"
          type="datetime-local"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>문서 선택 ({selectedDocuments.length}/{documents.length})</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedDocuments.length === documents.length ? "전체 해제" : "전체 선택"}
          </Button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {documents.map((document) => (
            <Card
              key={document.id}
              className={`cursor-pointer transition-colors ${
                selectedDocuments.includes(document.id)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
              onClick={() => handleDocumentToggle(document.id)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                    selectedDocuments.includes(document.id)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/50"
                  }`}
                >
                  {selectedDocuments.includes(document.id) && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{document.filename}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(document.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "발행 중..." : "발행하기"}
        </Button>
      </div>
    </form>
  );
}
