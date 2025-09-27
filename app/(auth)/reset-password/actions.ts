"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { z } from "zod";

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export async function resetPassword(prevState: any, formData: FormData) {
  const supabase = await createServerSupabase();

  try {
    // Validate form data
    const validatedFields = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
      return {
        error: null,
        fieldErrors: validatedFields.error.flatten().fieldErrors,
      };
    }

    const { password } = validatedFields.data;

    // Update the user's password
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error("Password update error:", updateError);
      return {
        error: "Failed to update password. Please try again.",
        fieldErrors: null,
      };
    }

    // Sign out the user after password reset
    await supabase.auth.signOut();

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