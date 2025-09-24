"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createServerSupabase();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  } catch (error) {
    console.error("Sign out failed:", error);
    throw new Error("로그아웃 중 오류가 발생했습니다.");
  }

  // 로그아웃 후 메인 페이지로 리다이렉트
  redirect("/");
}
