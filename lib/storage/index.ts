import type { StorageProvider } from "./types";
import { R2StorageProvider } from "./r2-provider";

export type * from "./types";

let cached: StorageProvider | null = null;

/**
 * Cloudflare R2 is the sole storage backend (migration from Supabase Storage
 * completed). The Supabase/dual providers used during the transition were
 * removed once the cutover finished.
 */
export function getStorage(): StorageProvider {
  if (!cached) cached = new R2StorageProvider();
  return cached;
}
