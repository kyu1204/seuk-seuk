"use server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const formSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Invalid Email address"),
  password: z
    .string({
      required_error: "Password is required",
    })
    .min(8, {
      message: "Password must be at least 8 characters",
    }),
});

export async function login(_: any, formData: FormData) {
  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const result = await formSchema.spa(data);
  if (!result.success) {
    return result.error.flatten();
  }

  const { email, password } = result.data;

  const client = await createServerSupabase();
  const { error: loginError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (loginError) {
    return {
      fieldErrors: {
        password: [loginError.message],
        email: [],
      },
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
