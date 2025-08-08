import { cookies } from 'next/headers'

export type Language = "ko" | "en"

// Translation data - duplicated from language-context for server-side use
const translations: Record<Language, Record<string, string>> = {
  ko: {
    "auth.invalidInput": "입력값을 확인해주세요",
    "auth.validEmail": "유효한 이메일을 입력해주세요",
    "auth.passwordLength": "비밀번호는 6자 이상이어야 합니다",
    "auth.passwordRequired": "비밀번호를 입력해주세요",
    "auth.signUpError": "회원가입 중 오류가 발생했습니다",
    "auth.signInError": "로그인 중 오류가 발생했습니다",
    "auth.signUpSuccess": "회원가입이 완료되었습니다. 로그인해주세요.",
    "auth.authError": "인증 처리 중 오류가 발생했습니다",
    "auth.signOutError": "로그아웃 중 오류가 발생했습니다",
    "register.passwordsDoNotMatch": "비밀번호가 일치하지 않습니다",
    "register.passwordTooShort": "비밀번호는 6자 이상이어야 합니다",
  },
  en: {
    "auth.invalidInput": "Please check your input",
    "auth.validEmail": "Please enter a valid email",
    "auth.passwordLength": "Password must be at least 6 characters",
    "auth.passwordRequired": "Please enter your password",
    "auth.signUpError": "An error occurred during sign up",
    "auth.signInError": "An error occurred during sign in",
    "auth.signUpSuccess": "Registration completed. Please log in.",
    "auth.authError": "An error occurred during authentication",
    "auth.signOutError": "An error occurred during sign out",
    "register.passwordsDoNotMatch": "Passwords do not match",
    "register.passwordTooShort": "Password must be at least 6 characters",
  },
}

// Server-side translation function
export async function getServerTranslation(key: string, lang?: Language): Promise<string> {
  // Get language from cookies or default to Korean
  const cookieStore = cookies()
  const selectedLanguage = lang || (cookieStore.get('docSignLanguage')?.value as Language) || 'ko'
  
  return translations[selectedLanguage][key] || key
}

// Get language from cookies (for server actions)
export async function getServerLanguage(): Promise<Language> {
  const cookieStore = cookies()
  return (cookieStore.get('docSignLanguage')?.value as Language) || 'ko'
}