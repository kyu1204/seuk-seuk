import { type NextRequest } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sitemap.xml (SEO sitemap)
     * - robots.txt (SEO robots)
     * - .*\\.(?:ico|png|svg|jpg|jpeg|gif|webp)$ (image files)
     * - api/webhook (Paddle webhook endpoint)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/webhook|.*\\.(?:ico|png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};