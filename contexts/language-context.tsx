"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define available languages
export type Language = "ko" | "en"

// Define the context type
type LanguageContextType = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string) => string
}

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "ko",
  setLanguage: () => {},
  t: (key) => key,
})

// Translation data
const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Header
    "app.title": "슥슥",
    "app.description": "문서를 쉽게 업로드하고, 서명하고, 공유하세요",

    // Document Upload
    "upload.title": "문서 관리",
    "upload.description": "문서를 업로드하고 서명 영역을 지정하세요",
    "upload.backToHome": "홈으로 돌아가기",
    "upload.dragDrop": "문서를 드래그 앤 드롭하거나 클릭하여 찾아보기",
    "upload.button": "문서 선택",
    "upload.clear": "지우기",
    "upload.addSignatureArea": "서명 영역 추가",
    "upload.getSignature": "서명 받기",
    "upload.generating": "생성 중...",
    "upload.signature": "서명",

    // Sign Page
    "sign.loading": "문서 로딩 중...",
    "sign.notFound": "문서를 찾을 수 없음",
    "sign.notFoundDesc": "찾으시는 문서가 존재하지 않거나 만료되었습니다.",
    "sign.returnHome": "홈으로 돌아가기",
    "sign.clickAreas": "강조된 영역을 클릭하여 서명을 추가하세요",
    "sign.clickToSign": "클릭하여 서명",
    "sign.generating": "생성 중...",
    "sign.saveDocument": "문서 저장",
    "sign.signedDocument": "서명된 문서",
    "sign.close": "닫기",
    "sign.download": "다운로드",
    "sign.completed.title": "서명이 완료되었습니다",
    "sign.completed.description": "문서 서명이 성공적으로 완료되어 안전하게 저장되었습니다.",

    // Signature Modal
    "signature.title": "서명 추가",
    "signature.instruction": "위에 마우스나 손가락으로 서명을 그리세요",
    "signature.clear": "지우기",
    "signature.sign": "문서 서명",

    // Language Selector
    "language.ko": "한국어",
    "language.en": "English",

    // Homepage
    "home.notification": "🎉 새로운 기능이 출시되었습니다! 지금 바로 확인해보세요.",
    "home.nav.features": "기능",
    "home.nav.pricing": "가격",
    "home.nav.testimonials": "고객 후기",
    "home.dashboard": "대시보드",
    "home.getStarted": "시작하기",
    "home.hero.title": "문서 서명, 더 쉽고 빠르게",
    "home.hero.description":
      "슥슥으로 종이 없는 문서 워크플로우를 경험하세요. 어디서나 안전하게 문서에 서명하고 공유할 수 있습니다.",
    "home.hero.cta": "지금 시작하기",
    "home.hero.learnMore": "더 알아보기",
    "home.hero.trustedBy": "수천 명의 사용자가 신뢰하는 서비스",
    "home.featuresTitle": "강력한 기능",
    "home.featuresDescription": "슥슥은 문서 서명 프로세스를 간소화하는 다양한 기능을 제공합니다.",
    "home.features.easy.title": "간편한 사용",
    "home.features.easy.description": "직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다.",
    "home.features.secure.title": "안전한 보안",
    "home.features.secure.description": "모든 문서와 서명은 암호화되어 안전하게 보호됩니다.",
    "home.features.fast.title": "빠른 처리",
    "home.features.fast.description": "몇 초 만에 문서를 업로드하고 서명할 수 있습니다.",
    "home.testimonialsTitle": "고객 후기",
    "home.testimonialsDescription": "슥슥을 사용하는 고객들의 생생한 후기를 확인해보세요.",
    "home.testimonials.quote1":
      "슥슥은 우리 회사의 계약 프로세스를 완전히 바꿔놓았습니다. 이전에는 서류 작업에 며칠이 걸렸지만, 이제는 몇 분 만에 완료됩니다.",
    "home.testimonials.author1": "김민수",
    "home.testimonials.role1": "스타트업 CEO",
    "home.testimonials.quote2":
      "사용하기 쉽고 안전한 서명 솔루션을 찾고 있었는데, 슥슥이 완벽했습니다. 고객들도 사용하기 쉽다고 좋아합니다.",
    "home.testimonials.author2": "이지현",
    "home.testimonials.role2": "프리랜서 디자이너",
    "home.testimonials.quote3":
      "원격 근무 환경에서 문서 서명이 큰 문제였는데, 슥슥 덕분에 이제는 걱정이 없습니다. 강력히 추천합니다!",
    "home.testimonials.author3": "박준호",
    "home.testimonials.role3": "인사 관리자",
    "home.pricingTitle": "합리적인 가격",
    "home.pricingDescription": "귀하의 요구에 맞는 플랜을 선택하세요.",
    "pricing.light.name": "라이트",
    "pricing.light.description": "개인 사용자를 위한 기본 플랜",
    "pricing.light.feature1": "월 최대 10개 문서",
    "pricing.light.feature2": "기본 서명 도구",
    "pricing.light.feature3": "7일간 문서 보관",
    "pricing.light.cta": "시작하기",
    "pricing.pro.name": "프로",
    "pricing.pro.description": "전문가와 소규모 팀을 위한 플랜",
    "pricing.pro.feature1": "월 최대 50개 문서",
    "pricing.pro.feature2": "고급 서명 도구",
    "pricing.pro.feature3": "30일간 문서 보관",
    "pricing.pro.feature4": "이메일 알림",
    "pricing.pro.cta": "프로 시작하기",
    "pricing.enterprise.name": "엔터프라이즈",
    "pricing.enterprise.description": "대규모 조직을 위한 맞춤형 솔루션",
    "pricing.enterprise.price": "문의",
    "pricing.enterprise.feature1": "무제한 문서",
    "pricing.enterprise.feature2": "맞춤형 워크플로우",
    "pricing.enterprise.feature3": "전용 지원",
    "pricing.enterprise.feature4": "API 액세스",
    "pricing.enterprise.cta": "문의하기",
    "pricing.popular": "인기",
    "pricing.perMonth": "월",
    "home.cta.title": "지금 바로 시작하세요",
    "home.cta.description": "슥슥으로 문서 서명 프로세스를 간소화하고 시간과 비용을 절약하세요.",
    "home.cta.button": "지금 시작하기",
    "home.footer.rights": "모든 권리 보유.",

    // 테마 전환 버튼
    "theme.light": "라이트",
    "theme.dark": "다크",

    // Login Page
    "login.title": "로그인",
    "login.subtitle": "계정에 로그인하여 문서 서명을 시작하세요",
    "login.email": "이메일",
    "login.password": "비밀번호",
    "login.forgotPassword": "비밀번호를 잊으셨나요?",
    "login.logIn": "로그인",
    "login.loggingIn": "로그인 중...",
    "login.orContinueWith": "또는 다음으로 계속",
    "login.noAccount": "계정이 없으신가요?",
    "login.createAccount": "계정 만들기",
    "login.register": "회원가입",
    "login.backToHome": "홈으로",
    "login.welcomeBack": "다시 만나서 반갑습니다",
    "login.welcomeMessage":
      "슥슥에 로그인하여 문서 서명 및 관리를 시작하세요. 안전하고 빠른 서명 경험을 제공합니다.",
    "login.kakaoTalk": "카카오",

    // Register Page
    "register.title": "계정 만들기",
    "register.subtitle": "아래 정보를 입력하여 새 계정을 만드세요",
    "register.name": "이름",
    "register.email": "이메일",
    "register.password": "비밀번호",
    "register.confirmPassword": "비밀번호 확인",
    "register.createAccount": "계정 만들기",
    "register.registering": "계정 생성 중...",
    "register.orContinueWith": "또는 다음으로 계속",
    "register.alreadyHaveAccount": "이미 계정이 있으신가요?",
    "register.login": "로그인",
    "register.backToHome": "홈으로",
    "register.joinUs": "슥슥에 가입하세요",
    "register.joinMessage":
      "슥슥에 가입하여 문서 서명 및 관리를 시작하세요. 간편하고 안전한 서명 경험을 제공합니다.",
    "register.kakaoTalk": "카카오",

    // Sign Page - Password Protection & Status
    "sign.password.title": "보안 문서",
    "sign.password.description": "이 문서는 비밀번호로 보호되어 있습니다.",
    "sign.password.instruction": "계속하려면 비밀번호를 입력해주세요.",
    "sign.password.placeholder": "비밀번호를 입력하세요",
    "sign.password.verify": "확인",
    "sign.password.verifying": "확인 중...",
    "sign.password.required": "비밀번호를 입력해주세요.",
    "sign.password.incorrect": "비밀번호가 올바르지 않습니다.",
    "sign.password.error": "비밀번호 확인 중 오류가 발생했습니다.",
    "sign.completed.title": "이미 제출된 문서입니다",
    "sign.completed.message": "이 문서는 이미 서명이 완료되어 제출되었습니다.",
    "sign.completed.noEdit": "더 이상 수정할 수 없습니다.",
    "sign.completed.status": "서명 완료됨",
    "sign.expired.title": "서명 기간 만료",
    "sign.expired.message": "죄송합니다. 이 문서의 서명 기간이 만료되었습니다.",
    "sign.expired.instruction": "문서 발행자에게 연락하여 새로운 서명 요청을 받아주세요.",
    "sign.expired.date": "만료일:",
    "sign.savingSignature": "서명 저장 중...",

    // Authentication
    "auth.signOut": "로그아웃",
    "auth.signingOut": "로그아웃 중...",
  },
  en: {
    // Header
    "app.title": "SeukSeuk",
    "app.description": "Upload, sign, and share documents online with ease",

    // Document Upload
    "upload.title": "Document Management",
    "upload.description": "Upload documents and define signature areas",
    "upload.backToHome": "Back to Home",
    "upload.dragDrop": "Drag and drop your document or click to browse",
    "upload.button": "Select Document",
    "upload.clear": "Clear",
    "upload.addSignatureArea": "Add Signature Area",
    "upload.getSignature": "Get Signature",
    "upload.generating": "Generating...",
    "upload.signature": "Signature",

    // Sign Page
    "sign.loading": "Loading document...",
    "sign.notFound": "Document Not Found",
    "sign.notFoundDesc": "The document you're looking for doesn't exist or has expired.",
    "sign.returnHome": "Return to Home",
    "sign.clickAreas": "Click on the highlighted areas to add your signature",
    "sign.clickToSign": "Click to sign",
    "sign.generating": "Generating...",
    "sign.saveDocument": "Save Document",
    "sign.signedDocument": "Your Signed Document",
    "sign.close": "Close",
    "sign.download": "Download",
    "sign.completed.title": "Signature Completed",
    "sign.completed.description": "Your document has been successfully signed and securely saved.",

    // Signature Modal
    "signature.title": "Add Your Signature",
    "signature.instruction": "Draw your signature above using your mouse or finger",
    "signature.clear": "Clear",
    "signature.sign": "Sign Document",

    // Language Selector
    "language.ko": "한국어",
    "language.en": "English",

    // Homepage
    "home.notification": "🎉 New features just released! Check them out now.",
    "home.nav.features": "Features",
    "home.nav.pricing": "Pricing",
    "home.nav.testimonials": "Testimonials",
    "home.dashboard": "Dashboard",
    "home.getStarted": "Get Started",
    "home.hero.title": "Document Signing Made Simple",
    "home.hero.description":
      "Experience paperless document workflows with SeukSeuk. Sign and share documents securely from anywhere.",
    "home.hero.cta": "Start Now",
    "home.hero.learnMore": "Learn More",
    "home.hero.trustedBy": "Trusted by thousands of users",
    "home.featuresTitle": "Powerful Features",
    "home.featuresDescription": "SeukSeuk offers a range of features to streamline your document signing process.",
    "home.features.easy.title": "Easy to Use",
    "home.features.easy.description": "Intuitive interface that anyone can use without training.",
    "home.features.secure.title": "Secure & Protected",
    "home.features.secure.description": "All documents and signatures are encrypted and securely stored.",
    "home.features.fast.title": "Lightning Fast",
    "home.features.fast.description": "Upload and sign documents in seconds, not minutes.",
    "home.testimonialsTitle": "Customer Testimonials",
    "home.testimonialsDescription": "See what our customers are saying about SeukSeuk.",
    "home.testimonials.quote1":
      "SeukSeuk completely transformed our contract process. What used to take days now takes minutes.",
    "home.testimonials.author1": "John Smith",
    "home.testimonials.role1": "Startup CEO",
    "home.testimonials.quote2":
      "I was looking for an easy-to-use and secure signing solution, and SeukSeuk was perfect. My clients love how easy it is to use.",
    "home.testimonials.author2": "Sarah Johnson",
    "home.testimonials.role2": "Freelance Designer",
    "home.testimonials.quote3":
      "Document signing was a major pain point in our remote work environment, but SeukSeuk solved that. Highly recommended!",
    "home.testimonials.author3": "Michael Chen",
    "home.testimonials.role3": "HR Manager",
    "home.pricingTitle": "Simple Pricing",
    "home.pricingDescription": "Choose a plan that works for your needs.",
    "pricing.light.name": "Light",
    "pricing.light.description": "Basic plan for individual users",
    "pricing.light.feature1": "Up to 10 documents per month",
    "pricing.light.feature2": "Basic signature tools",
    "pricing.light.feature3": "7-day document storage",
    "pricing.light.cta": "Get Started",
    "pricing.pro.name": "Pro",
    "pricing.pro.description": "For professionals and small teams",
    "pricing.pro.feature1": "Up to 50 documents per month",
    "pricing.pro.feature2": "Advanced signature tools",
    "pricing.pro.feature3": "30-day document storage",
    "pricing.pro.feature4": "Email notifications",
    "pricing.pro.cta": "Go Pro",
    "pricing.enterprise.name": "Enterprise",
    "pricing.enterprise.description": "Custom solutions for large organizations",
    "pricing.enterprise.price": "Contact Us",
    "pricing.enterprise.feature1": "Unlimited documents",
    "pricing.enterprise.feature2": "Custom workflows",
    "pricing.enterprise.feature3": "Dedicated support",
    "pricing.enterprise.feature4": "API access",
    "pricing.enterprise.cta": "Contact Sales",
    "pricing.popular": "Popular",
    "pricing.perMonth": "/month",
    "home.cta.title": "Get Started Today",
    "home.cta.description": "Streamline your document signing process and save time and money with SeukSeuk.",
    "home.cta.button": "Get Started",
    "home.footer.rights": "All rights reserved.",

    // 테마 전환 버튼
    "theme.light": "Light",
    "theme.dark": "Dark",

    // Login Page
    "login.title": "Log in to your account",
    "login.subtitle": "Enter your credentials to access your account",
    "login.email": "Email",
    "login.password": "Password",
    "login.forgotPassword": "Forgot password?",
    "login.logIn": "Log in",
    "login.loggingIn": "Logging in...",
    "login.orContinueWith": "or continue with",
    "login.noAccount": "Don't have an account?",
    "login.createAccount": "Create an account",
    "login.register": "Register",
    "login.backToHome": "Back to home",
    "login.welcomeBack": "Welcome Back",
    "login.welcomeMessage":
      "Sign in to SeukSeuk to start signing and managing your documents. We provide a secure and fast signing experience.",
    "login.kakaoTalk": "Kakao",

    // Register Page
    "register.title": "Create an account",
    "register.subtitle": "Enter your information below to create your account",
    "register.name": "Name",
    "register.email": "Email",
    "register.password": "Password",
    "register.confirmPassword": "Confirm Password",
    "register.createAccount": "Create account",
    "register.registering": "Creating account...",
    "register.orContinueWith": "or continue with",
    "register.alreadyHaveAccount": "Already have an account?",
    "register.login": "Log in",
    "register.backToHome": "Back to home",
    "register.joinUs": "Join SeukSeuk Today",
    "register.joinMessage":
      "Sign up for SeukSeuk to start signing and managing your documents. We provide a simple and secure signing experience.",
    "register.kakaoTalk": "Kakao",

    // Sign Page - Password Protection & Status
    "sign.password.title": "Protected Document",
    "sign.password.description": "This document is password protected.",
    "sign.password.instruction": "Please enter the password to continue.",
    "sign.password.placeholder": "Enter password",
    "sign.password.verify": "Verify",
    "sign.password.verifying": "Verifying...",
    "sign.password.required": "Please enter a password.",
    "sign.password.incorrect": "The password is incorrect.",
    "sign.password.error": "An error occurred while verifying the password.",
    "sign.completed.title": "Document Already Submitted",
    "sign.completed.message": "This document has already been signed and submitted.",
    "sign.completed.noEdit": "No further changes can be made.",
    "sign.completed.status": "Signature Completed",
    "sign.expired.title": "Signature Period Expired",
    "sign.expired.message": "Sorry, the signing period for this document has expired.",
    "sign.expired.instruction": "Please contact the document issuer to request a new signature request.",
    "sign.expired.date": "Expired on:",
    "sign.savingSignature": "Saving signature...",

    // Authentication
    "auth.signOut": "Sign Out",
    "auth.signingOut": "Signing out...",
  },
}

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with Korean as default
  const [language, setLanguageState] = useState<Language>("ko")

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("seukSeukLanguage") as Language
    if (savedLanguage && (savedLanguage === "ko" || savedLanguage === "en")) {
      setLanguageState(savedLanguage)
    }
  }, [])

  // Save language preference when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
    localStorage.setItem("seukSeukLanguage", newLanguage)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

// Custom hook for using the language context
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

