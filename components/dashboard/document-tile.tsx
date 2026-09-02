"use client";

import type { KeyboardEvent, ReactNode } from "react";
import Link from "next/link";
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
        "flex h-36 flex-col justify-between rounded-lg border p-4 transition-colors",
        !selectable && "hover:border-primary/30",
        disabledReason && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {status && <StatusBadge status={status} />}
        {selectable && (
          <Checkbox
            aria-label={title}
            checked={selected}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onSelectToggle?.();
            }}
          />
        )}
      </div>
      <div className="space-y-1">
        <h3 className="truncate text-sm font-medium" title={title}>
          {title}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{metaLeft}</span>
          {metaRight && <span>{metaRight}</span>}
        </div>
        {disabledReason && (
          <p className="text-xs text-muted-foreground">{disabledReason}</p>
        )}
      </div>
      {thumbnail}
      {actions && <div className="flex justify-end">{actions}</div>}
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
        className="cursor-pointer"
      >
        {body}
      </div>
    );
  }

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="block">
        {body}
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={onClick ? "cursor-pointer" : undefined}>
      {body}
    </div>
  );
}
