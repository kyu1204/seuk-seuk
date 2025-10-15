"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, RefreshCw, Share } from "lucide-react";
import { useState, useEffect } from "react";

interface PublishDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (password: string, expiresAt: string) => Promise<void>;
  isLoading?: boolean;
  isRepublishing?: boolean;
  currentExpiresAt?: string | null;
}

export default function PublishDocumentModal({
  isOpen,
  onClose,
  onPublish,
  isLoading = false,
  isRepublishing = false,
  currentExpiresAt = null,
}: PublishDocumentModalProps) {
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    expiresAt?: string;
  }>({});

  // Pre-fill expiration date if republishing
  useEffect(() => {
    if (isRepublishing && currentExpiresAt) {
      const date = new Date(currentExpiresAt);
      setExpiresAt(date);
    }
  }, [isRepublishing, currentExpiresAt]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      if (!isRepublishing) {
        setExpiresAt(undefined);
      }
    }
  }, [isOpen, isRepublishing]);

  const validateForm = () => {
    const newErrors: { password?: string; expiresAt?: string } = {};

    // Password validation - always required
    if (!password.trim()) {
      newErrors.password = "비밀번호는 필수입니다";
    } else if (password.length < 4) {
      newErrors.password = "비밀번호는 최소 4자 이상이어야 합니다";
    }

    if (!expiresAt) {
      newErrors.expiresAt = "만료 기간은 필수입니다";
    } else if (expiresAt <= new Date()) {
      newErrors.expiresAt = "만료 기간은 현재 시간보다 이후여야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onPublish(password, expiresAt!.toISOString());
      // Reset form on success
      setPassword("");
      setExpiresAt(undefined);
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Publish error:", error);
    }
  };

  const handleClose = () => {
    if (isLoading) return; // Prevent closing while loading
    setPassword("");
    setExpiresAt(undefined);
    setErrors({});
    onClose();
  };

  // Get minimum date (today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            {isRepublishing ? "문서 재발행" : "문서 발급하기"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            {isRepublishing
              ? "새로운 비밀번호와 만료일을 설정하면 새로운 서명 URL이 생성됩니다. 기존 URL은 즉시 무효화됩니다."
              : "문서를 발급하기 위해 보안 설정을 완료해주세요."}
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              비밀번호 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder={isRepublishing ? "새 비밀번호" : "서명 페이지 접근용 비밀번호"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              disabled={isLoading}
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Expires At Date Picker */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              만료 기간 <span className="text-red-500">*</span>
            </Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground",
                    errors.expiresAt && "border-red-500"
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt
                    ? expiresAt.toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "서명 만료 날짜를 선택하세요"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={(date) => {
                    if (date) {
                      // Set time to end of day (23:59:59)
                      const endOfDay = new Date(date);
                      endOfDay.setHours(23, 59, 59, 999);
                      setExpiresAt(endOfDay);
                      if (errors.expiresAt) {
                        setErrors((prev) => ({
                          ...prev,
                          expiresAt: undefined,
                        }));
                      }
                    }
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date < today}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.expiresAt && (
              <p className="text-sm text-red-500">{errors.expiresAt}</p>
            )}
            <p className="text-xs text-gray-500">
              선택한 날짜까지 서명자가 문서에 접근할 수 있습니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {isRepublishing ? "재발행 중..." : "발급 중..."}
                </>
              ) : (
                <>
                  <Share className="mr-2 h-4 w-4" />
                  {isRepublishing ? "재발행하기" : "발급하기"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
