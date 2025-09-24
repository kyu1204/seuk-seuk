"use server";
import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const formSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string",
  }),
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
  confirmPassword: z.string({
    required_error: "Confirm Password is required",
    invalid_type_error: "Confirm Password must be a string",
  }),
});

export async function register(_: any, formData: FormData) {
  const data = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const result = await formSchema.spa(data);
  if (!result.success) {
    return result.error.flatten();
  }
  if (result.data.password !== result.data.confirmPassword) {
    return {
      fieldErrors: {
        confirmPassword: ["Passwords do not match"],
        password: [],
        name: [],
        email: [],
      },
    };
  }

  const { name, email, password } = result.data;

  const client = await createServerSupabase();
  const { error: registerError, data: registerData } = await client.auth.signUp(
    {
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    }
  );
  if (registerError) {
    return {
      fieldErrors: {
        password: [],
        email: [],
        name: [],
        confirmPassword: [registerError.message],
      },
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
