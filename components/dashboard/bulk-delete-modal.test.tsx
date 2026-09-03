import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("./bulk-delete-modal.tsx", import.meta.url), "utf-8");

describe("bulk-delete-modal.tsx source", () => {
  it("accepts an items prop", () => {
    expect(source).toContain("items");
  });

  it("shows a truncated name list with andMore", () => {
    expect(source).toContain("dashboard.bulkDelete.andMore");
    expect(source).toContain("list-disc");
  });

  it("shows draft and completed warnings", () => {
    expect(source).toContain("dashboard.bulkDelete.draftWarning");
    expect(source).toContain("dashboard.bulkDelete.completedWarning");
  });

  it("confirm button uses the count-aware label", () => {
    expect(source).toContain("dashboard.bulkDelete.confirmDelete");
  });

  it("supports a progress label override", () => {
    expect(source).toContain("progressLabel");
  });
});
