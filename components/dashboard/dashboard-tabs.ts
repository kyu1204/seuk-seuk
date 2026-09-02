export type TabType = "documents" | "publications" | "templates";

export function resolveTab(value: string | null): TabType {
  if (value === "documents" || value === "publications" || value === "templates") {
    return value;
  }
  return "documents";
}
