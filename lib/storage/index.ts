import type { StorageProvider } from "./types";
import { SupabaseStorageProvider } from "./supabase-provider";
import { R2StorageProvider } from "./r2-provider";
import { DualStorageProvider } from "./dual-provider";

export type * from "./types";

let cached: StorageProvider | null = null;

/**
 * Returns the active storage provider based on STORAGE_PROVIDER env:
 * - "supabase" (default): Supabase only
 * - "dual": write both, read R2 → Supabase fallback (zero-downtime migration)
 * - "r2": R2 only (post-cutover)
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const provider = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();
  switch (provider) {
    case "r2":
      cached = new R2StorageProvider();
      break;
    case "dual":
      cached = new DualStorageProvider();
      break;
    case "supabase":
      cached = new SupabaseStorageProvider();
      break;
    default:
      // Fail fast: a typo must not silently split writes across providers.
      throw new Error(
        `Invalid STORAGE_PROVIDER "${process.env.STORAGE_PROVIDER}". Expected "supabase" | "dual" | "r2".`
      );
  }
  return cached;
}
