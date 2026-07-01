import type { StorageProvider } from "./types";
import { SupabaseStorageProvider } from "./supabase-provider";
import { R2StorageProvider } from "./r2-provider";

export type * from "./types";

let cached: StorageProvider | null = null;

/**
 * Returns the active storage provider based on STORAGE_PROVIDER env
 * ("supabase" | "r2"). Defaults to Supabase for safe rollback.
 */
export function getStorage(): StorageProvider {
  if (cached) return cached;
  const provider = (process.env.STORAGE_PROVIDER || "supabase").toLowerCase();
  cached = provider === "r2" ? new R2StorageProvider() : new SupabaseStorageProvider();
  return cached;
}
