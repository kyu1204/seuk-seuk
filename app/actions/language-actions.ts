"use server";

import { cookies } from "next/headers";

export async function setLanguageCookie(language: "ko" | "en") {
  const cookieStore = await cookies();
  cookieStore.set("seukSeukLanguage", language, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}