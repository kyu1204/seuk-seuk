import { cookies } from "next/headers";

export type MetaLanguage = "ko" | "en";

/**
 * Language for metadata generation, mirroring the root layout's cookie logic.
 * Crawlers send no cookies, so they always get the Korean default.
 */
export async function getMetadataLanguage(): Promise<MetaLanguage> {
  const cookieStore = await cookies();
  return cookieStore.get("seukSeukLanguage")?.value === "en" ? "en" : "ko";
}
