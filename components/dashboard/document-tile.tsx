"use client";

import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge, type BadgeStatus } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

interface DocumentTileProps {
  href?: string;
  onClick?: () => void;
  status?: BadgeStatus;
  title: string;
  metaLeft: string;
  metaRight?: string;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  disabledReason?: string;
  /** 썸네일 영역 중앙에 놓을 아이콘. 기본은 문서 아이콘. */
  icon?: ReactNode;
  /** 썸네일 영역 우하단 보조 표시(예: 자물쇠). */
  thumbnail?: ReactNode;
  actions?: ReactNode;
}

export function DocumentTile({
  href,
  onClick,
  status,
  title,
  metaLeft,
  metaRight,
  selectable = false,
  selected = false,
  onSelectToggle,
  disabledReason,
  icon,
  thumbnail,
  actions,
}: DocumentTileProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectToggle?.();
    }
  };

  const body = (
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all",
        selectable && selected && "border-primary ring-1 ring-primary",
        !selectable && "hover:border-primary/40 hover:shadow-md",
        disabledReason && "opacity-60"
      )}
    >
      {/* 썸네일 영역: 파일 아이콘 + 상태 배지 + 선택 체크 */}
      <div className="relative flex h-28 items-center justify-center border-b bg-muted/60">
        <span className="text-muted-foreground/50">
          {icon ?? <FileText className="h-10 w-10" strokeWidth={1.5} />}
        </span>
        {status && (
          <div className="absolute left-3 top-3">
            <StatusBadge status={status} />
          </div>
        )}
        {selectable && (
          <div className="absolute right-3 top-3">
            <Checkbox
              aria-label={title}
              checked={selected}
              className="bg-background"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelectToggle?.();
              }}
            />
          </div>
        )}
        {thumbnail && (
          <div className="absolute bottom-2 right-3 text-muted-foreground">
            {thumbnail}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate text-sm font-semibold" title={title}>
          {title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{metaLeft}</span>
          {metaRight && <span>{metaRight}</span>}
        </div>
        {disabledReason && (
          <p className="text-xs text-muted-foreground">{disabledReason}</p>
        )}
        {actions && <div className="mt-2 flex justify-end">{actions}</div>}
      </div>
    </div>
  );

  if (selectable) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={onSelectToggle}
        onKeyDown={handleKeyDown}
        className="h-full cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {body}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {body}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={cn("h-full", onClick && "cursor-pointer")}>
      {body}
    </div>
  );
}
