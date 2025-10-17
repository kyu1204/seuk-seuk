import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CURRENT_LEGAL_VERSION } from "@/lib/constants/legal";
import { publicOnlyRoutes, isPublicRoute } from "@/lib/constants/routes";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  if (
    user &&
    user.app_metadata?.provider === "kakao" &&
    !pathname.startsWith("/auth/consent") &&
    !pathname.startsWith("/api/")
  ) {
    const { data: consent, error: consentError } = await supabase
      .from("users")
      .select(
        "terms_accepted_at, privacy_accepted_at, terms_accepted_version, privacy_accepted_version"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (consentError) {
      console.error("Failed to fetch consent information:", consentError);
    }

    const hasConsent =
      Boolean(consent?.terms_accepted_at) &&
      Boolean(consent?.privacy_accepted_at) &&
      consent?.terms_accepted_version === CURRENT_LEGAL_VERSION &&
      consent?.privacy_accepted_version === CURRENT_LEGAL_VERSION;

    if (!hasConsent) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/auth/consent";
      const destination = `${pathname}${request.nextUrl.search ?? ""}`;
      if (destination && destination !== "/auth/consent") {
        redirectUrl.searchParams.set("next", destination);
      }
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Check if user is trying to access a protected route without authentication
  if (!user && !isPublicRoute(pathname)) {
    // no user, redirect to login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Check if authenticated user is trying to access public-only routes
  if (user && publicOnlyRoutes[pathname]) {
    // logged in user trying to access public-only page, redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
