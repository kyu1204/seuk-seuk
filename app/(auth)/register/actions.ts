"use server";
import { z } from "zod";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CURRENT_LEGAL_VERSION } from "@/lib/constants/legal";

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

  const userId = registerData.user?.id;
  if (userId) {
    const serviceClient = createServiceSupabase();
    const timestamp = new Date().toISOString();
    const { error: consentError } = await serviceClient
      .from("users")
      .upsert(
        {
          id: userId,
          terms_accepted_at: timestamp,
          terms_accepted_version: CURRENT_LEGAL_VERSION,
          privacy_accepted_at: timestamp,
          privacy_accepted_version: CURRENT_LEGAL_VERSION,
        },
        { onConflict: "id" }
      );

    if (consentError) {
      console.error("Failed to persist legal consent for new user:", consentError);
    }
  }

  revalidatePath("/", "layout");
  redirect("/register/success");
}
