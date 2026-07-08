import { MetadataRoute } from "next";
import { sitemapRoutes } from "@/lib/constants/routes";

/**
 * Generate sitemap for public pages
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  return sitemapRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    changeFrequency: "monthly" as const,
    priority: route === "/" ? 1.0 : route === "/pricing" ? 0.9 : 0.5,
  }));
}
