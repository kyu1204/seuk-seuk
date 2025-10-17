"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { CURRENT_LEGAL_VERSION } from "@/lib/constants/legal";
import { createServerSupabase } from "@/lib/supabase/server";

export async function acceptLegalConsent(_: any, formData: FormData) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nextParam = formData.get("next");
  const nextPath =
    typeof nextParam === "string" && nextParam.startsWith("/")
      ? nextParam
      : "/";

  const timestamp = new Date().toISOString();

  const { error } = await supabase
    .from("users")
    .update({
      terms_accepted_at: timestamp,
      terms_accepted_version: CURRENT_LEGAL_VERSION,
      privacy_accepted_at: timestamp,
      privacy_accepted_version: CURRENT_LEGAL_VERSION,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Failed to update legal consent:", error);
    return {
      error: "consent.error",
    };
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function declineLegalConsent() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login?error=consent_required");
}
