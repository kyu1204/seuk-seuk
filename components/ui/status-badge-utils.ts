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
    case "active":
      return "status.published";
    case "completed":
      return "status.completed";
    case "expired":
      return "status.expired";
  }
}
