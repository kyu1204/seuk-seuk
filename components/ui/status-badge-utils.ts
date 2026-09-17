export type BadgeStatus = "draft" | "published" | "active" | "completed" | "expired";

export function statusBadgeClass(status: BadgeStatus): string {
  switch (status) {
    case "draft":
      return "bg-muted text-muted-foreground";
    case "published":
    case "active":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-seal-soft text-seal";
    case "expired":
      return "bg-amber-soft text-amber";
  }
}

export function statusLabelKey(status: BadgeStatus): string {
  switch (status) {
    case "draft":
      return "status.draft";
    case "published":
      return "status.published";
    case "active":
      // 발행 건(서명 요청)의 active 는 "서명 진행 중"이라는 뜻. 문서 상태 "발행됨"과 구분한다.
      return "status.active";
    case "completed":
      return "status.completed";
    case "expired":
      return "status.expired";
  }
}
