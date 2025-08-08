"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const signUpSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
  name: z.string().optional(),
});

const signInSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  };

  // Validate input
  const validatedFields = signUpSchema.safeParse(rawData);
  if (!validatedFields.success) {
    redirect("/register?error=" + encodeURIComponent("입력값을 확인해주세요"));
  }

  const { email, password, name } = validatedFields.data;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "",
        },
      },
    });

    if (error) {
      redirect("/register?error=" + encodeURIComponent(error.message));
    }

    // Success - redirect outside try-catch to avoid catching the redirect error
  } catch (error: any) {
    redirect(
      "/register?error=" + encodeURIComponent("회원가입 중 오류가 발생했습니다")
    );
  }

  // If we get here, signup was successful
  revalidatePath("/", "layout");
  redirect(
    "/login?message=" +
      encodeURIComponent("회원가입이 완료되었습니다. 로그인해주세요.")
  );
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    redirect: formData.get("redirect") as string,
  };

  // Validate input
  const validatedFields = signInSchema.safeParse(rawData);
  if (!validatedFields.success) {
    redirect("/login?error=" + encodeURIComponent("입력값을 확인해주세요"));
  }

  const { email, password } = validatedFields.data;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect("/login?error=" + encodeURIComponent(error.message));
    }

    // Success - redirect outside try-catch to avoid catching the redirect error
  } catch (error: any) {
    redirect(
      "/login?error=" + encodeURIComponent("로그인 중 오류가 발생했습니다")
    );
  }

  // If we get here, login was successful
  const redirectTo = rawData.redirect || "/dashboard";
  revalidatePath("/", "layout");
  redirect(redirectTo);
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    // Handle error if needed
  }
  
  redirect("/");
}
