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
    "register.privacyAgree": "본인은",
    "register.privacyPolicy": "개인정보 처리방침",
    "register.privacyAgree2": "에 동의합니다.",

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

    // Breadcrumb
    "breadcrumb.dashboard": "대시보드",
    "breadcrumb.upload": "문서 업로드",
    "breadcrumb.details": "문서 상세",

    // Footer
    "footer.privacy": "개인정보 처리방침",

    // Privacy Policy Page
    "privacy.backToHome": "홈으로 돌아가기",
    "privacy.title": "슥슥 개인정보 처리방침",
    "privacy.intro":
      '본 개인정보 처리방침은 슥슥(이하 "서비스")이 제공하는 전자 문서 서명 및 관리 서비스와 관련하여 개인정보보호법 제30조에 따라 정보주체의 개인정보를 보호하고 관련한 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.',

    // Section 1
    "privacy.section1.title": "1. 개인정보의 처리 목적",
    "privacy.section1.intro":
      "서비스는 다음과 같은 목적을 위하여 개인정보를 수집·이용하며, 목적이 변경되는 경우에는 사전에 이용자의 동의를 받습니다.",
    "privacy.section1.item1.title": "회원 가입 및 관리",
    "privacy.section1.item1.content":
      "회원 가입 의사 확인, 이용자 식별·인증, 계정 유지·관리, 부정이용 방지 및 각종 고지·통지를 위한 목적.",
    "privacy.section1.item2.title": "전자 문서 서명 서비스 제공",
    "privacy.section1.item2.content":
      "전자 서명 요청·작성·보관·공유 등 서비스 제공을 위한 업무 처리, 문서 전송 및 처리 현황 알림 등.",
    "privacy.section1.item3.title": "결제 및 정산",
    "privacy.section1.item3.content":
      "유료 서비스 이용에 따른 본인 인증, 요금 결제, 청구서 발송 및 결제 내역 관리.",
    "privacy.section1.item4.title": "고객지원",
    "privacy.section1.item4.content":
      "문의·요청사항 처리, 불만처리 및 분쟁조정, 공지사항 전달.",
    "privacy.section1.item5.title": "서비스 개선 및 통계 활용",
    "privacy.section1.item5.content":
      "서비스 이용기록과 접속 정보 분석을 통한 서비스 품질 개선 및 통계적 분석.",
    "privacy.section1.item6.title": "법령 준수",
    "privacy.section1.item6.content":
      "관계 법령에서 정한 의무의 이행 및 법령상 의무사항 준수.",

    // Section 2
    "privacy.section2.title": "2. 처리하는 개인정보 항목",
    "privacy.section2.intro":
      "서비스는 다음과 같은 개인정보를 처리합니다. 슥슥은 서비스 특성상 전자서명 데이터와 문서 파일을 안전하게 취급합니다.",
    "privacy.section2.sub1.title": "2.1 회원 가입 시 수집 항목",
    "privacy.section2.sub1.required": "필수 항목",
    "privacy.section2.sub1.requiredItems":
      "이름, 이메일 주소, 비밀번호, 서비스 이용 기록, IP 주소, 브라우저 정보, 쿠키 정보.",
    "privacy.section2.sub1.optional": "선택 항목",
    "privacy.section2.sub1.optionalItems":
      "연락처(휴대전화 번호), 직책/직무 정보, 프로필 사진.",
    "privacy.section2.sub1.social": "소셜 로그인 시 수집 항목",
    "privacy.section2.sub1.socialItems":
      "Google/GitHub/카카오 등의 소셜 로그인 서비스를 이용할 경우 해당 서비스에 등록된 프로필 정보(닉네임, 프로필 사진, 이메일 등)와 고유 식별자.",
    "privacy.section2.sub2.title": "2.2 서명 요청 및 문서 관리 시 수집 항목",
    "privacy.section2.sub2.signature": "서명 데이터",
    "privacy.section2.sub2.signatureContent":
      "전자 서명을 위해 사용자가 입력한 서명 이미지나 서명에 필요한 추적 좌표 등.",
    "privacy.section2.sub2.document": "문서 및 첨부 파일",
    "privacy.section2.sub2.documentContent":
      "서비스에서 생성·전송·저장되는 문서와 첨부 파일의 내용.",
    "privacy.section2.sub2.recipient": "수신인 정보",
    "privacy.section2.sub2.recipientContent":
      "문서 서명을 요청하는 상대방의 이름, 이메일 주소 및 서명 진행 상태.",
    "privacy.section2.sub2.payment": "결제 정보",
    "privacy.section2.sub2.paymentContent":
      "유료 서비스 이용 시 결제를 위한 카드 정보(카드사명, 카드번호 일부, 결제승인 번호 등).",

    // Section 3
    "privacy.section3.title": "3. 개인정보의 처리 및 보유 기간",
    "privacy.section3.intro":
      "서비스는 법령이 정한 기간 또는 이용자로부터 동의를 얻은 기간 동안 개인정보를 보유합니다.",
    "privacy.section3.item1.title": "회원 정보",
    "privacy.section3.item1.content":
      "회원 탈퇴 시까지 보유하며, 요금 정산, 부정이용 방지 등 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보유합니다.",
    "privacy.section3.item2.title": "서명 및 문서 데이터",
    "privacy.section3.item2.content":
      "서비스 제공 목적 달성 시 또는 회원이 삭제 요청 또는 탈퇴 시까지 보유합니다.",
    "privacy.section3.item3.title": "로그 기록",
    "privacy.section3.item3.content":
      "보안 및 서비스 개선을 위하여 수집한 접속 로그는 6개월간 보관 후 파기합니다.",
    "privacy.section3.item4.title": "관련 법령에 따른 보유",
    "privacy.section3.item4.content":
      "세법, 전자서명법, 통신비밀보호법 등 관계 법령에서 정한 기간 동안 보유할 필요가 있는 정보는 해당 법령에서 정한 기간 동안 보관합니다.",

    // Section 4
    "privacy.section4.title": "4. 개인정보의 제3자 제공",
    "privacy.section4.content":
      "서비스는 개인정보를 '개인정보의 처리 목적'에서 명시한 범위를 초과하여 제3자에게 제공하지 않습니다. 다만, 이용자의 동의가 있거나 법령의 특별한 규정이 있는 경우에는 예외로 합니다.",
    "privacy.section4.social": "소셜 로그인 제공사",
    "privacy.section4.socialContent":
      "이용자가 Google, GitHub, 카카오 등 외부 계정 연동을 통해 서비스를 이용하는 경우 해당 서비스에 개인정보가 제공될 수 있습니다.",
    "privacy.section4.legal": "법령 및 수사기관",
    "privacy.section4.legalContent":
      "법령에서 정한 절차와 방법에 따라 수사기관이나 감독기관의 요구가 있는 경우.",

    // Section 5
    "privacy.section5.title": "5. 개인정보 처리의 위탁",
    "privacy.section5.intro":
      "서비스는 안정적인 서비스 제공과 업무 처리를 위하여 다음과 같이 개인정보 처리 업무를 외부 전문 업체에 위탁할 수 있습니다.",
    "privacy.section5.table.header1": "위탁받는 자",
    "privacy.section5.table.header2": "위탁업무 내용",
    "privacy.section5.table.header3": "개인정보 보유 및 이용기간",
    "privacy.section5.table.row1.col1":
      "클라우드·호스팅 서비스 제공자 (예: AWS, Naver Cloud)",
    "privacy.section5.table.row1.col2":
      "데이터 저장, 서버 운영, 문서 및 서명 파일의 보관",
    "privacy.section5.table.row1.col3": "계약 종료 또는 위탁업무 종료 시까지",
    "privacy.section5.table.row2.col1": "결제대행사 (PG사)",
    "privacy.section5.table.row2.col2": "결제 처리 및 결제 내역 관리",
    "privacy.section5.table.row2.col3": "관련 법령 또는 이용자의 동의 기간까지",
    "privacy.section5.table.row3.col1": "이메일·SMS 발송업체",
    "privacy.section5.table.row3.col2": "서비스 알림, 본인 인증, 공지사항 발송",
    "privacy.section5.table.row3.col3": "위탁업무 목적 달성 후 즉시 파기",
    "privacy.section5.outro":
      "서비스는 추가적인 위탁이 발생할 경우 개인정보 처리방침을 통하여 사전에 고지하고 동의를 받습니다.",

    // Section 6
    "privacy.section6.title": "6. 개인정보 파기 절차 및 방법",
    "privacy.section6.intro":
      "개인정보의 처리 목적이 달성되거나 보유 기간이 경과한 경우 서비스는 지체 없이 개인정보를 파기합니다.",
    "privacy.section6.item1.title": "파기 절차",
    "privacy.section6.item1.content":
      "이용자가 회원 가입 등을 위해 입력한 개인정보는 목적 달성 후 별도의 DB로 이동하여 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장한 후 파기합니다.",
    "privacy.section6.item2.title": "파기 기한",
    "privacy.section6.item2.content":
      "개인정보의 보유 기간이 종료된 경우 그 종료일부터 5일 이내에 파기합니다.",
    "privacy.section6.item3.title": "파기 방법",
    "privacy.section6.item3.content":
      "전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법을 이용하여 영구 삭제하며, 종이 문서 등은 분쇄하거나 소각하는 방법으로 파기합니다.",

    // Section 7
    "privacy.section7.title":
      "7. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항",
    "privacy.section7.intro":
      "서비스는 맞춤형 서비스 제공을 위해 쿠키(cookie) 등 개인정보 자동 수집 장치를 이용할 수 있습니다.",
    "privacy.section7.item1.title": "쿠키의 사용 목적",
    "privacy.section7.item1.content":
      "방문 기록과 사용 패턴 분석, 로그인 상태 유지, 맞춤형 정보 제공을 위해 쿠키를 사용합니다.",
    "privacy.section7.item2.title": "쿠키 설치·운영 및 거부 방법",
    "privacy.section7.item2.content":
      "이용자는 웹브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다.",
    "privacy.section7.item3.title": "웹 로그 분석 도구",
    "privacy.section7.item3.content":
      "서비스 개선을 위해 Google Analytics 등 외부 분석 도구를 사용할 수 있으며, IP 주소 및 기기 정보를 익명 형태로 전송합니다.",

    // Section 8
    "privacy.section8.title": "8. 개인정보의 안전성 확보 조치",
    "privacy.section8.intro":
      "서비스는 개인정보보호법 제29조에 따라 다음과 같은 기술적·관리적·물리적 조치를 취합니다.",
    "privacy.section8.item1.title": "개인정보 취급 직원의 최소화 및 교육",
    "privacy.section8.item1.content":
      "개인정보를 취급하는 직원을 최소한으로 지정하고 정기적인 교육을 실시합니다.",
    "privacy.section8.item2.title": "접근권한의 관리",
    "privacy.section8.item2.content":
      "개인정보를 처리하는 데이터베이스 시스템에 대한 접근권한을 부여·변경·말소하고, 침입차단 시스템 등을 통해 무단 접근을 방지합니다.",
    "privacy.section8.item3.title": "암호화 및 안전한 저장",
    "privacy.section8.item3.content":
      "비밀번호와 서명 데이터 등 중요정보는 암호화하여 저장하며, 전송 시에도 암호화 기법을 사용합니다.",
    "privacy.section8.item4.title": "해킹 등에 대비한 기술적 대책",
    "privacy.section8.item4.content":
      "백신 프로그램과 침입 차단 시스템을 설치하여 주기적으로 업데이트하고, 서버는 외부로부터 접근이 통제된 구역에서 운영합니다.",
    "privacy.section8.item5.title": "접속 기록의 관리",
    "privacy.section8.item5.content":
      "개인정보처리시스템에 접속한 기록을 최소 6개월 이상 보관·관리하며, 위변조 및 도난·분실되지 않도록 보안 기능을 사용합니다.",
    "privacy.section8.item6.title": "물리적 보안",
    "privacy.section8.item6.content":
      "전산실, 자료 보관실 등 개인정보를 보관하는 장소에 대해 출입 통제와 잠금장치 등을 적용합니다.",

    // Section 9
    "privacy.section9.title":
      "9. 정보주체와 법정대리인의 권리·의무 및 행사 방법",
    "privacy.section9.intro":
      "이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.",
    "privacy.section9.item1.title": "개인정보 열람요구",
    "privacy.section9.item1.content":
      "서비스가 보유한 본인의 개인정보 열람을 요구할 수 있습니다.",
    "privacy.section9.item2.title": "정정 및 삭제 요구",
    "privacy.section9.item2.content":
      "개인정보에 오류가 있을 경우 정정을 요구할 수 있으며, 처리 목적이 달성된 경우 삭제를 요청할 수 있습니다.",
    "privacy.section9.item3.title": "처리정지 요구",
    "privacy.section9.item3.content":
      "개인정보의 처리 정지를 요구할 수 있습니다.",
    "privacy.section9.item4.title": "권리 행사 방법",
    "privacy.section9.item4.content":
      "전자우편(pb1123love@gmail.com)을 통해 서면·이메일·팩스 등으로 요구할 수 있으며, 서비스는 이에 대해 지체 없이 조치합니다.",
    "privacy.section9.item5.title": "대리인을 통한 권리 행사",
    "privacy.section9.item5.content":
      "정보주체의 법정대리인이나 위임을 받은 자 등 대리인을 통하여 권리를 행사할 수 있습니다.",
    "privacy.section9.item6.title": "권리 행사에 대한 결과 통지",
    "privacy.section9.item6.content":
      "서비스는 열람 요구, 정정·삭제 요구, 처리정지 요구를 받은 경우 10일 이내에 조치 결과를 통지합니다.",

    // Section 10
    "privacy.section10.title": "10. 개인정보 보호책임자 및 담당자 연락처",
    "privacy.section10.intro":
      "서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 이용자 문의·불만처리 및 피해구제를 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정합니다.",
    "privacy.section10.responsibility": "개인정보 보호책임자",
    "privacy.section10.responsibilityName": "김민규",
    "privacy.section10.contact": "연락처",
    "privacy.section10.duties": "담당 업무",
    "privacy.section10.dutiesContent":
      "개인정보 보호 정책 수립 및 시행, 이용자 문의 대응, 개인정보 유출 사고 예방 및 조치.",
    "privacy.section10.outro":
      "이용자는 서비스를 이용하면서 발생하는 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관하여 개인정보 보호책임자에게 문의할 수 있습니다.",

    // Section 11
    "privacy.section11.title":
      "11. 개인정보 관련 분쟁조정 및 권익침해 구제방법",
    "privacy.section11.intro":
      "개인정보 침해에 대한 신고나 상담이 필요한 경우 다음 기관에 문의할 수 있습니다.",
    "privacy.section11.item1.title": "개인정보 침해신고센터 (한국인터넷진흥원)",
    "privacy.section11.item1.phone": "(국번없이) 118",
    "privacy.section11.item2.title": "개인정보 분쟁조정위원회",
    "privacy.section11.item2.phone": "(국번없이) 1833-6972",
    "privacy.section11.item3.title": "대검찰청 사이버범죄수사단",
    "privacy.section11.item3.phone": "02-3480-3573",
    "privacy.section11.item4.title": "경찰청 사이버안전국",
    "privacy.section11.item4.phone": "(국번없이) 182",

    // Section 12
    "privacy.section12.title": "12. 개인정보 처리방침의 변경",
    "privacy.section12.content":
      "본 개인정보 처리방침은 시행일로부터 적용되며, 법령·정책 또는 서비스 내용의 변경에 따라 수정될 수 있습니다. 변경되는 경우에는 시행 7일 전부터 홈페이지 또는 공지사항을 통하여 변경 내용을 알립니다.",

    // Effective Date
    "privacy.effectiveDate.title": "시행일",
    "privacy.effectiveDate.date":
      "이 개인정보 처리방침은 2025년 10월 01일부터 적용됩니다.",
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
    "register.privacyAgree": "I agree to the",
    "register.privacyPolicy": "Privacy Policy",
    "register.privacyAgree2": ".",

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

    // Breadcrumb
    "breadcrumb.dashboard": "Dashboard",
    "breadcrumb.upload": "Upload Document",
    "breadcrumb.details": "Document Details",

    // Footer
    "footer.privacy": "Privacy Policy",

    // Privacy Policy Page
    "privacy.backToHome": "Back to Home",
    "privacy.title": "SeukSeuk Privacy Policy",
    "privacy.intro":
      "This Privacy Policy is established and disclosed in accordance with Article 30 of the Personal Information Protection Act to protect personal information of data subjects and promptly and smoothly handle related grievances regarding the electronic document signing and management service provided by SeukSeuk (hereinafter referred to as 'Service').",

    // Section 1
    "privacy.section1.title": "1. Purpose of Processing Personal Information",
    "privacy.section1.intro":
      "The Service collects and uses personal information for the following purposes and will obtain prior consent from users if the purpose changes.",
    "privacy.section1.item1.title": "Membership Registration and Management",
    "privacy.section1.item1.content":
      "Confirmation of membership intent, user identification and authentication, account maintenance and management, prevention of unauthorized use, and various notifications.",
    "privacy.section1.item2.title":
      "Electronic Document Signing Service Provision",
    "privacy.section1.item2.content":
      "Business processing for providing services such as electronic signature requests, creation, storage, and sharing, document transmission, and processing status notifications.",
    "privacy.section1.item3.title": "Payment and Settlement",
    "privacy.section1.item3.content":
      "User authentication for paid service usage, fee payment, invoice issuance, and payment history management.",
    "privacy.section1.item4.title": "Customer Support",
    "privacy.section1.item4.content":
      "Handling inquiries and requests, complaint resolution and dispute mediation, announcement delivery.",
    "privacy.section1.item5.title":
      "Service Improvement and Statistical Utilization",
    "privacy.section1.item5.content":
      "Service quality improvement and statistical analysis through analysis of service usage records and access information.",
    "privacy.section1.item6.title": "Legal Compliance",
    "privacy.section1.item6.content":
      "Fulfillment of obligations stipulated by relevant laws and compliance with legal requirements.",

    // Section 2
    "privacy.section2.title": "2. Personal Information Items Processed",
    "privacy.section2.intro":
      "The Service processes the following personal information. SeukSeuk handles electronic signature data and document files securely due to the nature of the service.",
    "privacy.section2.sub1.title": "2.1 Items Collected During Registration",
    "privacy.section2.sub1.required": "Required Items",
    "privacy.section2.sub1.requiredItems":
      "Name, email address, password, service usage records, IP address, browser information, cookie information.",
    "privacy.section2.sub1.optional": "Optional Items",
    "privacy.section2.sub1.optionalItems":
      "Contact information (mobile phone number), job title/position information, profile picture.",
    "privacy.section2.sub1.social": "Items Collected via Social Login",
    "privacy.section2.sub1.socialItems":
      "When using social login services such as Google/GitHub/Kakao, profile information registered with the service (nickname, profile picture, email, etc.) and unique identifiers.",
    "privacy.section2.sub2.title":
      "2.2 Items Collected During Signature Requests and Document Management",
    "privacy.section2.sub2.signature": "Signature Data",
    "privacy.section2.sub2.signatureContent":
      "Signature images or tracking coordinates required for electronic signatures entered by users.",
    "privacy.section2.sub2.document": "Documents and Attachments",
    "privacy.section2.sub2.documentContent":
      "Contents of documents and attachments created, transmitted, and stored in the service.",
    "privacy.section2.sub2.recipient": "Recipient Information",
    "privacy.section2.sub2.recipientContent":
      "Name, email address, and signature progress status of the recipient requesting document signature.",
    "privacy.section2.sub2.payment": "Payment Information",
    "privacy.section2.sub2.paymentContent":
      "Card information for payment when using paid services (card company name, partial card number, payment approval number, etc.).",

    // Section 3
    "privacy.section3.title":
      "3. Processing and Retention Period of Personal Information",
    "privacy.section3.intro":
      "The Service retains personal information for the period stipulated by law or for the period agreed upon by the user.",
    "privacy.section3.item1.title": "Member Information",
    "privacy.section3.item1.content":
      "Retained until membership withdrawal. If retention is required for a certain period according to relevant laws for fee settlement, fraud prevention, etc., it will be retained for that period.",
    "privacy.section3.item2.title": "Signature and Document Data",
    "privacy.section3.item2.content":
      "Retained until the service provision purpose is achieved or until the member requests deletion or withdraws.",
    "privacy.section3.item3.title": "Log Records",
    "privacy.section3.item3.content":
      "Access logs collected for security and service improvement are retained for 6 months and then destroyed.",
    "privacy.section3.item4.title": "Retention According to Relevant Laws",
    "privacy.section3.item4.content":
      "Information required to be retained for the period stipulated by relevant laws such as tax law, Electronic Signature Act, and Communication Privacy Act will be retained for the period stipulated by the law.",

    // Section 4
    "privacy.section4.title":
      "4. Third-Party Provision of Personal Information",
    "privacy.section4.content":
      "The Service does not provide personal information to third parties beyond the scope specified in the 'Purpose of Processing Personal Information'. However, exceptions may be made with user consent or if there are special provisions in the law.",
    "privacy.section4.social": "Social Login Providers",
    "privacy.section4.socialContent":
      "When users access the service through external account linking such as Google, GitHub, Kakao, personal information may be provided to the service.",
    "privacy.section4.legal": "Law and Investigation Agencies",
    "privacy.section4.legalContent":
      "When requested by investigation or supervisory agencies in accordance with procedures and methods stipulated by law.",

    // Section 5
    "privacy.section5.title":
      "5. Entrustment of Personal Information Processing",
    "privacy.section5.intro":
      "The Service may entrust personal information processing work to external professional companies as follows for stable service provision and business processing.",
    "privacy.section5.table.header1": "Trustee",
    "privacy.section5.table.header2": "Entrusted Work",
    "privacy.section5.table.header3":
      "Personal Information Retention and Use Period",
    "privacy.section5.table.row1.col1":
      "Cloud/Hosting Service Providers (e.g., AWS, Naver Cloud)",
    "privacy.section5.table.row1.col2":
      "Data storage, server operation, document and signature file storage",
    "privacy.section5.table.row1.col3":
      "Until contract termination or end of entrusted work",
    "privacy.section5.table.row2.col1": "Payment Gateway (PG) Company",
    "privacy.section5.table.row2.col2":
      "Payment processing and payment history management",
    "privacy.section5.table.row2.col3":
      "Until the period stipulated by relevant laws or user consent period",
    "privacy.section5.table.row3.col1": "Email/SMS Sending Company",
    "privacy.section5.table.row3.col2":
      "Service notifications, user authentication, announcement sending",
    "privacy.section5.table.row3.col3":
      "Immediate destruction after achieving entrusted work purpose",
    "privacy.section5.outro":
      "If additional entrustment occurs, the Service will notify in advance through the privacy policy and obtain consent.",

    // Section 6
    "privacy.section6.title":
      "6. Personal Information Destruction Procedures and Methods",
    "privacy.section6.intro":
      "When the purpose of processing personal information is achieved or the retention period expires, the Service destroys personal information without delay.",
    "privacy.section6.item1.title": "Destruction Procedure",
    "privacy.section6.item1.content":
      "Personal information entered by users for membership registration is moved to a separate DB after achieving the purpose and destroyed after being stored for a certain period according to internal policies and other relevant laws.",
    "privacy.section6.item2.title": "Destruction Period",
    "privacy.section6.item2.content":
      "When the retention period of personal information expires, it is destroyed within 5 days from the end date.",
    "privacy.section6.item3.title": "Destruction Method",
    "privacy.section6.item3.content":
      "Information in electronic file form is permanently deleted using methods that make recovery and regeneration impossible, and paper documents are destroyed by shredding or incineration.",

    // Section 7
    "privacy.section7.title":
      "7. Installation, Operation, and Rejection of Automatic Personal Information Collection Devices",
    "privacy.section7.intro":
      "The Service may use automatic personal information collection devices such as cookies to provide customized services.",
    "privacy.section7.item1.title": "Purpose of Cookie Use",
    "privacy.section7.item1.content":
      "Cookies are used to analyze visit records and usage patterns, maintain login status, and provide customized information.",
    "privacy.section7.item2.title":
      "Cookie Installation, Operation, and Rejection Methods",
    "privacy.section7.item2.content":
      "Users can refuse cookie storage through web browser settings.",
    "privacy.section7.item3.title": "Web Log Analysis Tools",
    "privacy.section7.item3.content":
      "External analysis tools such as Google Analytics may be used for service improvement, transmitting IP addresses and device information in anonymous form.",

    // Section 8
    "privacy.section8.title":
      "8. Measures to Ensure Safety of Personal Information",
    "privacy.section8.intro":
      "The Service takes the following technical, administrative, and physical measures in accordance with Article 29 of the Personal Information Protection Act.",
    "privacy.section8.item1.title":
      "Minimization and Training of Personal Information Handling Staff",
    "privacy.section8.item1.content":
      "Personnel handling personal information are designated to a minimum and regular training is conducted.",
    "privacy.section8.item2.title": "Access Authority Management",
    "privacy.section8.item2.content":
      "Access authority to database systems processing personal information is granted, changed, or revoked, and unauthorized access is prevented through intrusion prevention systems.",
    "privacy.section8.item3.title": "Encryption and Secure Storage",
    "privacy.section8.item3.content":
      "Important information such as passwords and signature data is encrypted and stored, and encryption techniques are used during transmission.",
    "privacy.section8.item4.title": "Technical Measures Against Hacking",
    "privacy.section8.item4.content":
      "Antivirus programs and intrusion prevention systems are installed and periodically updated, and servers are operated in areas with controlled external access.",
    "privacy.section8.item5.title": "Access Record Management",
    "privacy.section8.item5.content":
      "Records of access to personal information processing systems are retained and managed for at least 6 months, and security functions are used to prevent forgery, alteration, theft, and loss.",
    "privacy.section8.item6.title": "Physical Security",
    "privacy.section8.item6.content":
      "Access control and locking devices are applied to places where personal information is stored, such as computer rooms and data storage rooms.",

    // Section 9
    "privacy.section9.title":
      "9. Rights and Obligations of Data Subjects and Legal Representatives and Methods of Exercise",
    "privacy.section9.intro":
      "Users can exercise the following rights as data subjects.",
    "privacy.section9.item1.title": "Request to View Personal Information",
    "privacy.section9.item1.content":
      "Users can request to view their personal information held by the Service.",
    "privacy.section9.item2.title": "Request for Correction and Deletion",
    "privacy.section9.item2.content":
      "Users can request correction if there are errors in personal information, and can request deletion if the processing purpose has been achieved.",
    "privacy.section9.item3.title": "Request to Stop Processing",
    "privacy.section9.item3.content":
      "Users can request to stop processing of personal information.",
    "privacy.section9.item4.title": "Methods of Exercising Rights",
    "privacy.section9.item4.content":
      "Requests can be made in writing, email, fax, etc. via pb1123love@gmail.com, and the Service will take action without delay.",
    "privacy.section9.item5.title":
      "Exercise of Rights through Representatives",
    "privacy.section9.item5.content":
      "Rights can be exercised through representatives such as legal representatives or authorized persons of data subjects.",
    "privacy.section9.item6.title":
      "Notification of Results of Rights Exercise",
    "privacy.section9.item6.content":
      "When receiving requests for viewing, correction/deletion, or stop of processing, the Service will notify the results within 10 days.",

    // Section 10
    "privacy.section10.title": "10. Privacy Officer and Contact Information",
    "privacy.section10.intro":
      "The Service designates a privacy officer as follows to oversee personal information processing and handle user inquiries, complaints, and remedies related to personal information processing.",
    "privacy.section10.responsibility": "Privacy Officer",
    "privacy.section10.responsibilityName": "MINKYU KIM",
    "privacy.section10.contact": "Contact",
    "privacy.section10.duties": "Duties",
    "privacy.section10.dutiesContent":
      "Establishment and implementation of privacy protection policies, responding to user inquiries, prevention and measures for personal information leakage accidents.",
    "privacy.section10.outro":
      "Users can contact the privacy officer regarding all privacy-related inquiries, complaints, and remedies arising from using the Service.",

    // Section 11
    "privacy.section11.title":
      "11. Dispute Resolution and Relief Methods for Rights Violations",
    "privacy.section11.intro":
      "If you need to report or consult about personal information infringement, you can contact the following organizations.",
    "privacy.section11.item1.title":
      "Personal Information Infringement Report Center (KISA)",
    "privacy.section11.item1.phone": "(No area code) 118",
    "privacy.section11.item2.title":
      "Personal Information Dispute Mediation Committee",
    "privacy.section11.item2.phone": "(No area code) 1833-6972",
    "privacy.section11.item3.title":
      "Supreme Prosecutors' Office Cybercrime Investigation Unit",
    "privacy.section11.item3.phone": "02-3480-3573",
    "privacy.section11.item4.title":
      "National Police Agency Cybersecurity Bureau",
    "privacy.section11.item4.phone": "(No area code) 182",

    // Section 12
    "privacy.section12.title": "12. Changes to Privacy Policy",
    "privacy.section12.content":
      "This privacy policy is effective from the effective date and may be revised according to changes in laws, policies, or service contents. Changes will be announced through the homepage or notifications at least 7 days before implementation.",

    // Effective Date
    "privacy.effectiveDate.title": "Effective Date",
    "privacy.effectiveDate.date":
      "This Privacy Policy is effective from October 1, 2025.",
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
