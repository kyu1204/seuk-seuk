import { redirect } from "next/navigation";

import { CURRENT_LEGAL_VERSION } from "@/lib/constants/legal";
import { createServerSupabase } from "@/lib/supabase/server";

import { ConsentPageContent } from "./ConsentPageContent";

function parseNextParam(rawNext: string | null): string {
  if (!rawNext) return "/";
  try {
    const decoded = decodeURIComponent(rawNext);
    if (decoded.startsWith("/")) {
      return decoded;
    }
  } catch {
    // ignore decode errors
  }
  return "/";
}

interface ConsentPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ConsentPage({ searchParams }: ConsentPageProps) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  const requestedNext =
    typeof searchParams?.next === "string"
      ? searchParams.next
      : Array.isArray(searchParams?.next)
      ? searchParams.next[0]
      : null;

  const nextPath = parseNextParam(requestedNext);

  if (hasConsent) {
    redirect(nextPath);
  }

  return <ConsentPageContent nextPath={nextPath} />;
}
