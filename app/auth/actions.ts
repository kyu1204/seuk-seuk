"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getServerTranslation } from "@/lib/translations";
import { z } from "zod";

// Create dynamic schemas with translations
async function createSignUpSchema() {
  return z.object({
    email: z.string().email(await getServerTranslation("auth.validEmail")),
    password: z.string().min(6, await getServerTranslation("auth.passwordLength")),
    name: z.string().optional(),
  });
}

async function createSignInSchema() {
  return z.object({
    email: z.string().email(await getServerTranslation("auth.validEmail")),
    password: z.string().min(1, await getServerTranslation("auth.passwordRequired")),
  });
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  };

  // Validate input
  const signUpSchema = await createSignUpSchema();
  const validatedFields = signUpSchema.safeParse(rawData);
  if (!validatedFields.success) {
    const errorMessage = await getServerTranslation("auth.invalidInput");
    redirect("/register?error=" + encodeURIComponent(errorMessage));
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
    const errorMessage = await getServerTranslation("auth.signUpError");
    redirect(
      "/register?error=" + encodeURIComponent(errorMessage)
    );
  }

  // If we get here, signup was successful
  revalidatePath("/", "layout");
  const successMessage = await getServerTranslation("auth.signUpSuccess");
  redirect(
    "/login?message=" +
      encodeURIComponent(successMessage)
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
  const signInSchema = await createSignInSchema();
  const validatedFields = signInSchema.safeParse(rawData);
  if (!validatedFields.success) {
    const errorMessage = await getServerTranslation("auth.invalidInput");
    redirect("/login?error=" + encodeURIComponent(errorMessage));
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
    const errorMessage = await getServerTranslation("auth.signInError");
    redirect(
      "/login?error=" + encodeURIComponent(errorMessage)
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
      console.error('Sign out error:', error);
      const errorMessage = await getServerTranslation("auth.signOutError");
      redirect("/?error=" + encodeURIComponent(errorMessage));
    }
  } catch (error) {
    console.error('Unexpected sign out error:', error);
    const errorMessage = await getServerTranslation("auth.signOutError");
    redirect("/?error=" + encodeURIComponent(errorMessage));
  }
  
  redirect("/");
}
