"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { setLanguageCookie } from "@/app/actions/language-actions";

// Define available languages
export type Language = "ko" | "en";

// Define the context type
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "ko",
  setLanguage: async () => {},
  t: (key) => key,
});

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
    "sign.saveDocument": "문서 제출",
    "sign.signedDocument": "서명된 문서",
    "sign.close": "닫기",
    "sign.download": "다운로드",
    "sign.complete.title": "서명이 완료되었습니다",
    "sign.complete.description":
      "문서 서명이 성공적으로 완료되어 안전하게 저장되었습니다.",

    // Signature Modal
    "signature.title": "서명 추가",
    "signature.instruction": "위에 마우스나 손가락으로 서명을 그리세요",
    "signature.clear": "지우기",
    "signature.sign": "문서 서명",
    "signature.signing": "서명 중...",

    // Language Selector
    "language.ko": "한국어",
    "language.en": "English",

    // Homepage
    "home.notification":
      "🎉 새로운 기능이 출시되었습니다! 지금 바로 확인해보세요.",
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
    "home.featuresDescription":
      "슥슥은 문서 서명 프로세스를 간소화하는 다양한 기능을 제공합니다.",
    "home.features.easy.title": "간편한 사용",
    "home.features.easy.description":
      "직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다.",
    "home.features.secure.title": "안전한 보안",
    "home.features.secure.description":
      "모든 문서와 서명은 암호화되어 안전하게 보호됩니다.",
    "home.features.fast.title": "빠른 처리",
    "home.features.fast.description":
      "몇 초 만에 문서를 업로드하고 서명할 수 있습니다.",
    "home.testimonialsTitle": "고객 후기",
    "home.testimonialsDescription":
      "슥슥을 사용하는 고객들의 생생한 후기를 확인해보세요.",
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
    "pricing.free.name": "무료",
    "pricing.free.description": "개인 사용자를 위한 무료 플랜",
    "pricing.free.price": "무료",
    "pricing.free.feature1": "월 최대 5개 문서 생성",
    "pricing.free.feature2": "무제한 서명 수집",
    "pricing.free.feature3": "기본 문서 관리",
    "pricing.free.cta": "시작하기",
    "pricing.pro.name": "프로",
    "pricing.pro.description": "전문가와 소규모 팀을 위한 플랜",
    "pricing.pro.feature1": "월 최대 30개 문서",
    "pricing.pro.feature2": "30일간 문서 보관",
    "pricing.pro.feature3": "이메일 알림",
    "pricing.pro.cta": "프로 시작하기",
    "pricing.enterprise.name": "엔터프라이즈",
    "pricing.enterprise.description": "대규모 조직을 위한 맞춤형 솔루션",
    "pricing.enterprise.price": "문의",
    "pricing.enterprise.feature1": "무제한 문서",
    "pricing.enterprise.feature2": "맞춤형 워크플로우",
    "pricing.enterprise.feature3": "전용 지원",
    "pricing.enterprise.cta": "문의하기",
    "pricing.popular": "인기",
    "pricing.perMonth": "월",

    // Pricing Page Specific Keys
    "pricingPage.title": "요금제 선택",
    "pricingPage.description":
      "필요에 맞는 플랜을 선택하고 더 많은 기능을 이용하세요",
    "pricingPage.currentPlan": "현재 {planName} 플랜을 이용 중입니다",
    "pricingPage.popular": "인기",
    "pricingPage.currentBadge": "현재 플랜",
    "pricingPage.free": "무료",
    "pricingPage.contact": "문의",
    "pricingPage.perMonth": "/월",
    "pricingPage.documentsPerMonth": "월 문서 생성",
    "pricingPage.activeDocuments": "활성 문서",
    "pricingPage.unlimited": "무제한",
    "pricingPage.documents": "개",
    "pricingPage.currentlyUsing": "현재 이용 중",
    "pricingPage.startFree": "무료로 시작하기",
    "pricingPage.contactUs": "문의하기",
    "pricingPage.selectPlan": "플랜 선택하기",
    "pricingPage.additionalInfo":
      "모든 플랜에는 기본 전자서명 기능이 포함되어 있습니다.",
    "pricingPage.additionalInfo2":
      "언제든지 플랜을 변경하거나 취소할 수 있습니다.",
    "pricingPage.errorTitle": "오류가 발생했습니다",
    "pricingPage.backButton": "뒤로 가기",
    "pricingPage.loadError": "Failed to load pricing data",
    "pricingPage.alertMessage":
      "{planName} 플랜이 선택되었습니다. 결제 모듈 연동 예정입니다.",

    // Pricing Page - Plan Details
    "pricingPage.plans.free.description": "개인 사용자를 위한 기본 플랜",
    "pricingPage.plans.free.feature1": "기본 문서 관리",
    "pricingPage.plans.free.feature2": "표준 지원",
    "pricingPage.plans.pro.description":
      "전문가와 소규모 팀을 위한 향상된 기능",
    "pricingPage.plans.pro.feature1": "이메일 알림",
    "pricingPage.plans.pro.feature2": "우선순위 지원",
    "pricingPage.plans.pro.feature3": "고급 분석",
    "pricingPage.plans.enterprise.description":
      "대규모 조직을 위한 완전한 솔루션",
    "pricingPage.plans.enterprise.feature1": "맞춤형 워크플로우",
    "pricingPage.plans.enterprise.feature2": "전용 지원",
    "pricingPage.plans.enterprise.feature3": "API 액세스",
    "pricingPage.plans.enterprise.feature4": "SSO 통합",

    "home.cta.title": "지금 바로 시작하세요",
    "home.cta.description":
      "슥슥으로 문서 서명 프로세스를 간소화하고 시간과 비용을 절약하세요.",
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
    "sign.expired.instruction":
      "문서 발행자에게 연락하여 새로운 서명 요청을 받아주세요.",
    "sign.expired.date": "만료일:",
    "sign.savingSignature": "서명 저장 중...",

    // Authentication
    "auth.signOut": "로그아웃",
    "auth.signingOut": "로그아웃 중...",

    // Dashboard
    "dashboard.title": "내 문서",
    "dashboard.description": "총 {total}개의 문서를 관리하고 있습니다.",
    "dashboard.header.title": "내 문서",
    "dashboard.header.description": "문서를 관리하고 서명을 수집하세요",
    "dashboard.upload": "업로드",
    "dashboard.empty.title": "아직 업로드된 문서가 없습니다",
    "dashboard.empty.description":
      "첫 번째 문서를 업로드하여 시작해보세요. 문서를 업로드하고 서명 영역을 지정한 후 다른 사람과 공유할 수 있습니다.",
    "dashboard.empty.action": "첫 문서 업로드하기",
    "dashboard.loading.more": "추가 문서 로딩 중...",
    "dashboard.retry": "다시 시도",
    "dashboard.end.message": "모든 문서를 불러왔습니다.",
    "dashboard.error.loadMore": "추가 문서를 불러오는 중 오류가 발생했습니다.",
    "dashboard.filter.all": "전체",
    "dashboard.filter.draft": "초안",
    "dashboard.filter.published": "게시됨",
    "dashboard.filter.completed": "완료됨",

    // Document Status
    "status.draft": "초안",
    "status.published": "게시됨",
    "status.completed": "완료됨",

    // Usage Widget
    "usage.title": "사용량 현황",
    "usage.description": "현재 월 사용량과 활성 문서 현황을 확인하세요",
    "usage.error.title": "사용량 정보 오류",
    "usage.error.message": "사용량 정보를 불러올 수 없습니다.",
    "usage.monthly.title": "이번 달 문서 생성",
    "usage.monthly.unlimited": "무제한",
    "usage.monthly.limit.reached": "월별 문서 생성 제한에 도달했습니다",
    "usage.active.title": "활성 문서 (게시됨 + 완료됨)",
    "usage.active.limit.reached": "활성 문서 제한에 도달했습니다",
    "usage.plan.free": "무료",
    "usage.plan.suffix": "플랜",
    "usage.upgrade.title": "더 많은 문서가 필요하신가요?",
    "usage.upgrade.description": "Pro 플랜으로 업그레이드하세요",
    "usage.upgrade.button": "업그레이드",
    "usage.features.title": "현재 플랜 혜택",

    // Forgot Password Page
    "forgotPassword.title": "비밀번호 찾기",
    "forgotPassword.subtitle":
      "이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.",
    "forgotPassword.emailLabel": "이메일 주소",
    "forgotPassword.sendReset": "재설정 링크 보내기",
    "forgotPassword.sending": "전송 중...",
    "forgotPassword.backToLogin": "로그인으로 돌아가기",
    "forgotPassword.checkEmail": "이메일을 확인하세요",
    "forgotPassword.emailSentMessage":
      "비밀번호 재설정 링크가 이메일로 전송되었습니다.",
    "forgotPassword.checkInbox":
      "이메일 받은함을 확인하시고 링크를 클릭하여 비밀번호를 재설정하세요.",
    "forgotPassword.didntReceive": "이메일을 받지 못하셨나요?",
    "forgotPassword.sendAnother": "다시 보내기",

    // Reset Password Page
    "resetPassword.title": "새 비밀번호 설정",
    "resetPassword.subtitle": "새로운 비밀번호를 입력하세요.",
    "resetPassword.newPassword": "새 비밀번호",
    "resetPassword.confirmPassword": "비밀번호 확인",
    "resetPassword.updatePassword": "비밀번호 업데이트",
    "resetPassword.updating": "업데이트 중...",
    "resetPassword.backToLogin": "로그인으로 돌아가기",
    "resetPassword.invalidLink": "유효하지 않은 링크",
    "resetPassword.invalidLinkMessage":
      "이 링크는 유효하지 않거나 만료되었습니다. 새로운 비밀번호 재설정을 요청해주세요.",
    "resetPassword.requestNew": "새 재설정 링크 요청",
    "resetPassword.successTitle": "비밀번호가 변경되었습니다",
    "resetPassword.successMessage":
      "새 비밀번호로 로그인해주세요. 잠시 후 로그인 페이지로 이동합니다.",
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
    "sign.notFoundDesc":
      "The document you're looking for doesn't exist or has expired.",
    "sign.returnHome": "Return to Home",
    "sign.clickAreas": "Click on the highlighted areas to add your signature",
    "sign.clickToSign": "Click to sign",
    "sign.generating": "Generating...",
    "sign.saveDocument": "Submit Document",
    "sign.signedDocument": "Your Signed Document",
    "sign.close": "Close",
    "sign.download": "Download",
    "sign.complete.title": "Signature Completed",
    "sign.complete.description":
      "Your document has been successfully signed and securely saved.",

    // Signature Modal
    "signature.title": "Add Your Signature",
    "signature.instruction":
      "Draw your signature above using your mouse or finger",
    "signature.clear": "Clear",
    "signature.sign": "Sign Document",
    "signature.signing": "Signing...",

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
    "home.featuresDescription":
      "SeukSeuk offers a range of features to streamline your document signing process.",
    "home.features.easy.title": "Easy to Use",
    "home.features.easy.description":
      "Intuitive interface that anyone can use without training.",
    "home.features.secure.title": "Secure & Protected",
    "home.features.secure.description":
      "All documents and signatures are encrypted and securely stored.",
    "home.features.fast.title": "Lightning Fast",
    "home.features.fast.description":
      "Upload and sign documents in seconds, not minutes.",
    "home.testimonialsTitle": "Customer Testimonials",
    "home.testimonialsDescription":
      "See what our customers are saying about SeukSeuk.",
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
    "pricing.free.name": "Free",
    "pricing.free.description": "Free plan for individual users",
    "pricing.free.price": "Free",
    "pricing.free.feature1": "Up to 5 documents per month",
    "pricing.free.feature2": "Unlimited signature collection",
    "pricing.free.feature3": "Basic document management",
    "pricing.free.cta": "Get Started",
    "pricing.pro.name": "Pro",
    "pricing.pro.description": "For professionals and small teams",
    "pricing.pro.feature1": "Up to 30 documents per month",
    "pricing.pro.feature2": "30-day document storage",
    "pricing.pro.feature3": "Email notifications",
    "pricing.pro.cta": "Go Pro",
    "pricing.enterprise.name": "Enterprise",
    "pricing.enterprise.description":
      "Custom solutions for large organizations",
    "pricing.enterprise.price": "Contact Us",
    "pricing.enterprise.feature1": "Unlimited documents",
    "pricing.enterprise.feature2": "Custom workflows",
    "pricing.enterprise.feature3": "Dedicated support",
    "pricing.enterprise.feature4": "API access",
    "pricing.enterprise.cta": "Contact Sales",
    "pricing.popular": "Popular",
    "pricing.perMonth": "/month",

    // Pricing Page Specific Keys
    "pricingPage.title": "Choose Your Plan",
    "pricingPage.description":
      "Select a plan that fits your needs and unlock more features",
    "pricingPage.currentPlan": "Currently using {planName} plan",
    "pricingPage.popular": "Popular",
    "pricingPage.currentBadge": "Current Plan",
    "pricingPage.free": "Free",
    "pricingPage.contact": "Contact Us",
    "pricingPage.perMonth": "/month",
    "pricingPage.documentsPerMonth": "Monthly documents",
    "pricingPage.activeDocuments": "Active documents",
    "pricingPage.unlimited": "Unlimited",
    "pricingPage.documents": "",
    "pricingPage.currentlyUsing": "Currently Using",
    "pricingPage.startFree": "Start Free",
    "pricingPage.contactUs": "Contact Us",
    "pricingPage.selectPlan": "Select Plan",
    "pricingPage.additionalInfo":
      "All plans include basic electronic signature features.",
    "pricingPage.additionalInfo2":
      "You can change or cancel your plan anytime.",
    "pricingPage.errorTitle": "An error occurred",
    "pricingPage.backButton": "Go Back",
    "pricingPage.loadError": "Failed to load pricing data",
    "pricingPage.alertMessage":
      "{planName} plan has been selected. Payment integration coming soon.",

    // Pricing Page - Plan Details
    "pricingPage.plans.free.description": "Basic plan for individual users",
    "pricingPage.plans.free.feature1": "Basic document management",
    "pricingPage.plans.free.feature2": "Standard support",
    "pricingPage.plans.pro.description":
      "Enhanced features for professionals and small teams",
    "pricingPage.plans.pro.feature1": "Email notifications",
    "pricingPage.plans.pro.feature2": "Priority support",
    "pricingPage.plans.pro.feature3": "Advanced analytics",
    "pricingPage.plans.enterprise.description":
      "Complete solution for large organizations",
    "pricingPage.plans.enterprise.feature1": "Custom workflows",
    "pricingPage.plans.enterprise.feature2": "Dedicated support",
    "pricingPage.plans.enterprise.feature3": "API access",
    "pricingPage.plans.enterprise.feature4": "SSO integration",

    "home.cta.title": "Get Started Today",
    "home.cta.description":
      "Streamline your document signing process and save time and money with SeukSeuk.",
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
    "sign.completed.message":
      "This document has already been signed and submitted.",
    "sign.completed.noEdit": "No further changes can be made.",
    "sign.completed.status": "Signature Completed",
    "sign.expired.title": "Signature Period Expired",
    "sign.expired.message":
      "Sorry, the signing period for this document has expired.",
    "sign.expired.instruction":
      "Please contact the document issuer to request a new signature request.",
    "sign.expired.date": "Expired on:",
    "sign.savingSignature": "Saving signature...",

    // Authentication
    "auth.signOut": "Sign Out",
    "auth.signingOut": "Signing out...",

    // Dashboard
    "dashboard.title": "My Documents",
    "dashboard.description": "You are managing a total of {total} documents.",
    "dashboard.header.title": "My Documents",
    "dashboard.header.description":
      "Manage your documents and collect signatures",
    "dashboard.upload": "Upload",
    "dashboard.empty.title": "No documents uploaded yet",
    "dashboard.empty.description":
      "Get started by uploading your first document. You can upload documents, define signature areas, and share them with others.",
    "dashboard.empty.action": "Upload First Document",
    "dashboard.loading.more": "Loading more documents...",
    "dashboard.retry": "Retry",
    "dashboard.end.message": "All documents have been loaded.",
    "dashboard.error.loadMore":
      "An error occurred while loading more documents.",
    "dashboard.filter.all": "All",
    "dashboard.filter.draft": "Draft",
    "dashboard.filter.published": "Published",
    "dashboard.filter.completed": "Completed",

    // Document Status
    "status.draft": "Draft",
    "status.published": "Published",
    "status.completed": "Completed",

    // Usage Widget
    "usage.title": "Usage Overview",
    "usage.description":
      "Check your current monthly usage and active document status",
    "usage.error.title": "Usage Information Error",
    "usage.error.message": "Unable to load usage information.",
    "usage.monthly.title": "Monthly Document Creation",
    "usage.monthly.unlimited": "Unlimited",
    "usage.monthly.limit.reached": "Monthly document creation limit reached",
    "usage.active.title": "Active Documents (Published + Completed)",
    "usage.active.limit.reached": "Active document limit reached",
    "usage.plan.free": "Free",
    "usage.plan.suffix": "Plan",
    "usage.upgrade.title": "Need more documents?",
    "usage.upgrade.description": "Upgrade to Pro plan",
    "usage.upgrade.button": "Upgrade",
    "usage.features.title": "Current Plan Benefits",

    // Forgot Password Page
    "forgotPassword.title": "Forgot Password",
    "forgotPassword.subtitle":
      "Enter your email address and we'll send you a password reset link.",
    "forgotPassword.emailLabel": "Email Address",
    "forgotPassword.sendReset": "Send Reset Link",
    "forgotPassword.sending": "Sending...",
    "forgotPassword.backToLogin": "Back to Login",
    "forgotPassword.checkEmail": "Check Your Email",
    "forgotPassword.emailSentMessage":
      "A password reset link has been sent to your email.",
    "forgotPassword.checkInbox":
      "Please check your inbox and click the link to reset your password.",
    "forgotPassword.didntReceive": "Didn't receive an email?",
    "forgotPassword.sendAnother": "Send Another",

    // Reset Password Page
    "resetPassword.title": "Set New Password",
    "resetPassword.subtitle": "Enter your new password below.",
    "resetPassword.newPassword": "New Password",
    "resetPassword.confirmPassword": "Confirm Password",
    "resetPassword.updatePassword": "Update Password",
    "resetPassword.updating": "Updating...",
    "resetPassword.backToLogin": "Back to Login",
    "resetPassword.invalidLink": "Invalid Link",
    "resetPassword.invalidLinkMessage":
      "This link is invalid or has expired. Please request a new password reset.",
    "resetPassword.requestNew": "Request New Reset Link",
    "resetPassword.successTitle": "Password Changed Successfully",
    "resetPassword.successMessage":
      "Please log in with your new password. You will be redirected to the login page shortly.",
  },
};

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with Korean as default
  const [language, setLanguageState] = useState<Language>("ko");

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("seukSeukLanguage") as Language;
    if (savedLanguage && (savedLanguage === "ko" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
      // Sync with server-side cookie
      setLanguageCookie(savedLanguage);
    } else {
      // Set default language cookie if none exists
      setLanguageCookie("ko");
    }
  }, []);

  // Save language preference when it changes
  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("seukSeukLanguage", newLanguage);
    // Update server-side cookie for metadata generation
    await setLanguageCookie(newLanguage);
  };

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;

    // Replace parameters in the translation string
    if (params) {
      Object.keys(params).forEach((param) => {
        translation = translation.replace(
          new RegExp(`\\{${param}\\}`, "g"),
          String(params[param])
        );
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook for using the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
