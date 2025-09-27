"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function forgotPassword(prevState: any, formData: FormData) {
  const supabase = await createServerSupabase();

  try {
    // Validate form data
    const validatedFields = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!validatedFields.success) {
      return {
        error: null,
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { email } = validatedFields.data;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/confirm?next=${encodeURIComponent('/reset-password')}`,
    });

    if (error) {
      console.error("Password reset error:", error);
      return {
        error: "Failed to send password reset email. Please try again.",
        fieldErrors: null,
      };
    }

    return {
      success: true,
      error: null,
      fieldErrors: null,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      error: "An unexpected error occurred. Please try again.",
      fieldErrors: null,
    };
  }
}