import { describe, expect, it } from "vitest";
import { statusBadgeClass, statusLabelKey, type BadgeStatus } from "./status-badge-utils";

describe("statusBadgeClass", () => {
  it("returns spec classes per status", () => {
    expect(statusBadgeClass("draft")).toBe("bg-muted text-muted-foreground");
    expect(statusBadgeClass("published")).toBe("bg-primary/10 text-primary");
    expect(statusBadgeClass("active")).toBe("bg-primary/10 text-primary");
    expect(statusBadgeClass("completed")).toBe("bg-seal-soft text-seal");
    expect(statusBadgeClass("expired")).toBe("bg-amber-soft text-amber");
  });

  it("published and active share the same class", () => {
    expect(statusBadgeClass("published")).toBe(statusBadgeClass("active"));
  });
});

describe("statusLabelKey", () => {
  it("maps status to locale key", () => {
    const cases: Record<BadgeStatus, string> = {
      draft: "status.draft",
      published: "status.published",
      active: "status.published",
      completed: "status.completed",
      expired: "status.expired",
    };
    for (const [status, key] of Object.entries(cases)) {
      expect(statusLabelKey(status as BadgeStatus)).toBe(key);
    }
  });
});
