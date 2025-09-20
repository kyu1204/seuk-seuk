"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schemas
const SignUpSchema = z.object({
  fullName: z.string().min(2, "이름은 최소 2자 이상이어야 합니다"),
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(6, "비밀번호는 최소 6자 이상이어야 합니다"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
})

const SignInSchema = z.object({
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
})

export interface ActionResult {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    fullName: formData.get("fullName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  }

  // Validate input
  const validation = SignUpSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: "입력 정보를 확인해주세요",
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const { fullName, email, password } = validation.data

  try {
    // Sign up the user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (signUpError) {
      console.error("SignUp error:", signUpError)

      if (signUpError.message === "User already registered") {
        return {
          success: false,
          message: "이미 등록된 이메일 주소입니다",
        }
      }

      return {
        success: false,
        message: signUpError.message || "회원가입 중 오류가 발생했습니다",
      }
    }

    if (!authData.user) {
      return {
        success: false,
        message: "회원가입 중 오류가 발생했습니다",
      }
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: fullName,
      })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Continue even if profile creation fails
    }

    return {
      success: true,
      message: "회원가입이 완료되었습니다. 로그인해주세요.",
    }
  } catch (error) {
    console.error("Unexpected error during signup:", error)
    return {
      success: false,
      message: "회원가입 중 예상치 못한 오류가 발생했습니다",
    }
  }
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  // Validate input
  const validation = SignInSchema.safeParse(data)
  if (!validation.success) {
    return {
      success: false,
      message: "입력 정보를 확인해주세요",
      errors: validation.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validation.data

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("SignIn error:", error)

      if (error.message === "Invalid login credentials") {
        return {
          success: false,
          message: "이메일 또는 비밀번호가 올바르지 않습니다",
        }
      }

      return {
        success: false,
        message: error.message || "로그인 중 오류가 발생했습니다",
      }
    }

    if (!authData.user) {
      return {
        success: false,
        message: "로그인 중 오류가 발생했습니다",
      }
    }

    return {
      success: true,
      message: "로그인이 완료되었습니다",
    }
  } catch (error) {
    console.error("Unexpected error during signin:", error)
    return {
      success: false,
      message: "로그인 중 예상치 못한 오류가 발생했습니다",
    }
  }
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("SignOut error:", error)
      return {
        success: false,
        message: error.message || "로그아웃 중 오류가 발생했습니다",
      }
    }

    // Next.js 14 App Router 최적화: 레이아웃 전체 재검증 후 리다이렉트
    redirect("/")
  } catch (error) {
    console.error("Unexpected error during signout:", error)
    return {
      success: false,
      message: "로그아웃 중 예상치 못한 오류가 발생했습니다",
    }
  }
}

// 새로운 서버 액션: 폼 데이터 없이 직접 호출 가능
export async function performSignOut() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("SignOut error:", error)
    throw new Error(error.message || "로그아웃 중 오류가 발생했습니다")
  }

  // 전체 레이아웃 재검증으로 인증 상태 업데이트
  revalidatePath("/", "layout")
  redirect("/")
}