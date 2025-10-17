import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { CURRENT_LEGAL_VERSION } from "@/lib/constants/legal";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get("next") ?? "/";
  if (!next.startsWith("/")) {
    // if "next" is not a relative URL, use the default
    next = "/";
  }

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let needsConsent = false;

      if (user) {
        const provider = user.app_metadata?.provider;
        if (provider === "kakao") {
          const { data: profile } = await supabase
            .from("users")
            .select(
              "terms_accepted_at, privacy_accepted_at, terms_accepted_version, privacy_accepted_version"
            )
            .eq("id", user.id)
            .maybeSingle();

          const hasConsent =
            Boolean(profile?.terms_accepted_at) &&
            Boolean(profile?.privacy_accepted_at) &&
            profile?.terms_accepted_version === CURRENT_LEGAL_VERSION &&
            profile?.privacy_accepted_version === CURRENT_LEGAL_VERSION;

          needsConsent = !hasConsent;
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      const baseUrl = isLocalEnv
        ? origin
        : forwardedHost
        ? `https://${forwardedHost}`
        : origin;

      if (needsConsent) {
        const consentUrl = new URL("/auth/consent", baseUrl);
        if (next && next !== "/") {
          consentUrl.searchParams.set("next", next);
        }
        return NextResponse.redirect(consentUrl.toString());
      }

      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
