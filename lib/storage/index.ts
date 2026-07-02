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
  cached =
    provider === "r2"
      ? new R2StorageProvider()
      : provider === "dual"
        ? new DualStorageProvider()
        : new SupabaseStorageProvider();
  return cached;
}
