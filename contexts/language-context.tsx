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
    "pricing.free.cta": "시작하기",
    "pricing.starter.name": "스타터",
    "pricing.starter.description": "개인 또는 소규모 팀을 위한 플랜",
    "pricing.starter.cta": "스타터 시작하기",
    "pricing.pro.name": "프로",
    "pricing.pro.description": "전문가를 위한 플랜",
    "pricing.pro.cta": "프로 시작하기",
    "pricing.popular": "인기",
    "pricing.perMonth": "월",
    "pricing.perYear": "년",
    "pricing.billing.monthly": "월간",
    "pricing.billing.yearly": "연간",
    // Pricing limits (dynamic count)
    "pricing.limitPerMonth": "월 최대 {count}개 문서 생성",
    "pricing.limitUnlimitedPerMonth": "문서 무제한 생성",

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
    "pricingPage.perYear": "/년",
    "pricingPage.documentsPerMonth": "월 문서 생성",
    "pricingPage.activeDocuments": "활성 문서",
    "pricingPage.unlimited": "무제한",
    "pricingPage.documents": "개",
    "pricingPage.currentlyUsing": "현재 이용 중",
    "pricingPage.lowerPlan": "상위 플랜 사용중",
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
    "pricingPage.plans.free.description": "개인 사용자를 위한 무료 플랜",
    "pricingPage.plans.starter.description": "개인 또는 소규모 팀을 위한 플랜",
    "pricingPage.plans.pro.description": "전문가를 위한 플랜",

    // Checkout Success
    "checkout.success.title": "결제가 완료되었습니다!",
    "checkout.success.message":
      "구독해 주셔서 감사합니다. 결제가 성공적으로 처리되었습니다.",
    "checkout.success.emailInfo":
      "구독 세부 정보가 포함된 확인 이메일이 곧 발송됩니다.",
    "checkout.success.dashboard": "대시보드로 이동",

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
    "register.terms": "이용약관",
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

    // Bills
    "bills.title": "결제 및 구독",
    "bills.description": "구독 정보와 결제 내역을 관리하세요",
    "bills.subscriptions": "구독",
    "bills.payments": "결제 내역",
    "bills.startedOn": "시작일:",
    "bills.nextPayment": "다음 결제",
    "bills.pastPayments": "이전 결제",
    "bills.due": "결제 예정일",
    "bills.cancel.title": "구독 취소",
    "bills.cancel.description":
      "현재 결제 주기 종료 시까지 이용 가능하며 이후 자동으로 해지됩니다.",
    "bills.cancel.action": "구독 취소",
    "bills.cancel.keep": "유지",
    "bills.cancel.confirm": "취소 확인",
    "bills.cancel.canceling": "취소 중...",
    "bills.cancel.scheduled": "구독이 결제 주기 종료 시 해지됩니다",
    "bills.cancel.failed": "구독 취소에 실패했습니다",
    "bills.noSubscription.title": "활성 구독이 없습니다",
    "bills.noSubscription.description":
      "프리미엄 플랜을 구독하여 더 많은 기능을 이용하세요",
    "bills.noSubscription.action": "플랜 보기",
    "bills.noTransactions": "결제 내역이 없습니다",
    // Billing payment reasons
    "bills.payment.reason.new": "신규",
    "bills.payment.reason.renewalOf": "갱신",
    // Table
    "table.previous": "이전",
    "table.next": "다음",
    "table.noResults": "결과가 없습니다.",
    "table.date": "날짜",
    "table.amount": "금액",
    "table.status": "상태",
    "table.description": "설명",
    "table.moreCount": "+{count}개 더",
    "table.pageOf": "페이지 {current} / {total}",
    "bills.error.loadSubscriptions": "구독 정보를 불러오지 못했습니다",
    "bills.error.loadTransactions": "결제 내역을 불러오지 못했습니다",
    "bills.error.loadSubscriptionDetail":
      "구독 상세 정보를 불러오지 못했습니다",

    // Document Status
    "status.draft": "초안",
    "status.published": "게시됨",
    "status.completed": "완료됨",
    "status.active": "활성",
    "status.paid": "결제 완료",
    "status.trialing": "체험 중",
    "status.ready": "준비됨",
    "status.canceled": "취소됨",
    "status.inactive": "비활성",
    "status.past_due": "연체",
    "status.paused": "일시중지",
    "status.billed": "청구됨",

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
    "usage.upgrade.description.free": "Pro 플랜으로 업그레이드하세요",
    "usage.upgrade.description.pro": "더 상위 플랜으로 업그레이드하세요",
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
    "footer.terms": "이용약관",
    "footer.privacy": "개인정보 처리방침",

    // Terms of Service Page
    "term.backToHome": "홈으로 돌아가기",
    "term.title": "슥슥 이용약관",
    "term.intro":
      '본 약관은 개인(이하 "운영자"라 합니다)이 슥슥(이하 "서비스"라 합니다)을 통해 제공하는 전자문서 서명 및 관리 서비스 이용과 관련하여, 운영자와 회원 간의 권리, 의무 및 책임 사항 등 기타 필요한 사항을 규정함을 목적으로 합니다.',

    // Chapter 1
    "term.chapter1.title": "제1장 총칙",
    "term.article1.title": "제1조 (목적)",
    "term.article1.content":
      "본 약관은 서비스 이용과 관련하여 운영자와 회원(또는 비회원) 간의 권리, 의무 및 책임, 기타 필요한 사항을 규정함을 목적으로 합니다. 서비스는 온라인상에서 전자문서에 서명할 수 있도록 하는 도구를 제공합니다.",

    "term.article2.title": "제2조 (용어의 정의)",
    "term.article2.item1":
      "서비스: 운영자가 제공하는 클라우드 기반 전자문서 서명 및 관리 서비스를 말합니다.",
    "term.article2.item2":
      "회원: 본 약관에 따라 이용계약을 체결하고 서비스를 이용하는 자를 말합니다. 회원가입 시 제공되는 이름, 이메일, 비밀번호로 로그인합니다.",
    "term.article2.item3":
      "비회원: 회원가입을 하지 않고 서비스를 이용하는 자를 말합니다.",
    "term.article2.item4":
      "서명 요청자: 전자문서에 대한 서명을 요청하는 회원을 말합니다.",
    "term.article2.item5":
      "서명자: 서명 요청자로부터 전자문서에 서명을 요청받거나 서명을 하는 이용자를 말합니다.",
    "term.article2.item6":
      "유료서비스: 운영자가 제공하는 서비스 중 회원이 요금을 결제한 후 이용할 수 있는 서비스(추후 도입 가능)를 말합니다.",

    "term.article3.title": "제3조 (약관의 게시와 개정)",
    "term.article3.para1":
      "운영자는 본 약관의 내용과 운영자의 연락처 등을 회원이 쉽게 알 수 있도록 서비스 초기화면 또는 별도의 연결화면에 게시합니다.",
    "term.article3.para2":
      "운영자는 관련 법령(개인정보 보호법, 전자서명법 등)을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다.",
    "term.article3.para3":
      "운영자가 약관을 개정할 경우에는 적용일자와 개정사유를 명시하여 현행약관과 함께 적용일자 7일 전부터 서비스 내 공지사항을 통해 공지합니다.",
    "term.article3.para4":
      "회원이 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있습니다. 별도 거부의사를 표시하지 않고 서비스를 계속 사용할 경우 개정 약관에 동의한 것으로 간주합니다.",

    "term.article4.title": "제4조 (약관의 해석)",
    "term.article4.content":
      "본 약관에 명시되지 않은 사항은 관련 법령 및 일반적인 상관례에 따릅니다. 서비스와 별도로 제공되는 개별 운영정책 또는 가이드에서 본 약관과 상충되는 내용이 있을 경우 개별 정책이 우선합니다.",

    // Chapter 2
    "term.chapter2.title": "제2장 서비스 이용 계약",
    "term.article5.title": "제5조 (서비스 이용계약의 성립)",
    "term.article5.para1":
      '서비스 이용계약은 서비스를 이용하고자 하는 자(이하 "가입신청자")가 본 약관과 개인정보 처리방침에 동의하고 회원가입을 신청한 후, 운영자가 이를 승낙함으로써 체결됩니다.',
    "term.article5.para2":
      "가입신청자는 이름, 이메일, 비밀번호를 정확히 입력해야 하며, 타인의 정보를 도용해서는 안 됩니다.",
    "term.article5.para3":
      "운영자는 다음 각 호에 해당하는 신청에 대하여 승낙을 거부하거나 사후에 취소할 수 있습니다.",
    "term.article5.para3.item1":
      "실명이 아닌 이름이나 타인의 정보를 사용한 경우",
    "term.article5.para3.item2":
      "허위의 정보를 기재하거나 필수 항목을 기재하지 않은 경우",
    "term.article5.para3.item3":
      "만 14세 미만 아동이 법정대리인의 동의 없이 개인정보를 입력한 경우",
    "term.article5.para3.item4":
      "기타 운영자가 제시한 제한 사항을 위반하여 신청한 경우",
    "term.article5.para4":
      "만 14세 미만은 서비스를 이용할 수 없습니다. 운영자는 나이 확인 기능을 별도로 제공하지 않지만, 만 14세 미만 이용 사실을 확인하면 즉시 서비스 이용을 중단시키고 법정대리인의 동의를 요청하거나 해당 계정을 삭제할 수 있습니다.",

    "term.article6.title": "제6조 (이용자 정보의 제공)",
    "term.article6.para1":
      "회원은 이름·이메일·비밀번호 등 회원가입 시 필요한 정보를 제공해야 하며, 회원 본인이 아닌 타인의 정보나 허위 정보를 사용할 경우 서비스 이용이 제한될 수 있습니다.",
    "term.article6.para2":
      "운영자는 본인 확인을 위해 이메일 인증 또는 소셜 로그인 등을 요구할 수 있습니다.",
    "term.article6.para3":
      "회원은 자신의 계정 정보(이메일, 비밀번호 등)를 적절히 관리해야 하며, 부주의로 인한 정보 유출 또는 제3자의 악용에 대해 책임을 집니다.",

    "term.article7.title": "제7조 (개인정보의 보호 및 관리)",
    "term.article7.para1":
      "운영자는 관계 법령 및 별도 게시된 개인정보처리방침에 따라 회원의 개인정보를 보호하기 위해 노력합니다. 개인정보 처리와 관련한 구체적인 내용은 개인정보처리방침을 따릅니다.",
    "term.article7.para2":
      "회원이 공식 서비스 사이트 이외의 외부 링크를 통해 서명 기능을 사용한 경우에는 운영자의 책임이 적용되지 않습니다.",
    "term.article7.para3":
      "운영자는 서명완료 후 회원이 전자문서를 내려받을 수 있도록 하며, 일정 기간이 지나면 원본 문서를 파기할 수 있습니다. 회원은 서명 완료 문서를 적절히 백업해야 합니다.",
    "term.article7.para4":
      "운영자는 회원의 개인정보를 적법한 절차와 방법으로 수집·이용하며, 회원의 동의 없이 제3자에게 제공하지 않습니다.",

    "term.article8.title": "제8조 (회원의 계정 및 비밀번호 관리)",
    "term.article8.para1":
      "회원은 서비스에서 사용하는 이메일 계정을 본인의 관리 목적 외 용도로 사용하거나 제3자에게 양도할 수 없습니다.",
    "term.article8.para2":
      "회원은 안전한 비밀번호를 생성하고 적절한 주기로 변경해야 합니다. 운영자는 보안, 운영 등을 이유로 비밀번호 변경을 요청할 수 있습니다. 회원이 정해진 기한 내 변경하지 않을 경우 운영자는 비밀번호를 강제 변경할 수 있습니다.",
    "term.article8.para3":
      "회원은 자신의 계정이 도용되었음을 인지한 경우 즉시 운영자에게 통지해야 하며, 운영자는 지체 없이 조치를 취합니다. 회원이 통지하지 않아 발생한 손해에 대해 운영자는 책임지지 않습니다.",

    "term.article9.title": "제9조 (운영자의 통지)",
    "term.article9.para1":
      "운영자가 회원에 대한 개별 통지가 필요한 경우 회원가입 시 등록한 이메일 주소로 통지합니다.",
    "term.article9.para2":
      "운영자가 전체 회원에게 통지할 경우 7일 이상 서비스 초기화면 또는 공지사항에 게시함으로써 개별 통지에 갈음할 수 있습니다.",

    // Chapter 3
    "term.chapter3.title": "제3장 서비스 제공 및 변경",
    "term.article10.title": "제10조 (서비스의 제공)",
    "term.article10.para1":
      "운영자는 회원의 회원가입이 완료된 때부터 서비스를 개시합니다. 다만, 일부 서비스의 경우 별도의 신청 절차를 완료한 때부터 제공할 수 있습니다.",
    "term.article10.para2":
      "운영자는 서비스의 안정적 제공을 위해 설비를 수시로 점검·보수·교체할 수 있으며, 이에 따라 일시적으로 서비스가 중단될 수 있습니다.",
    "term.article10.para3":
      "운영자가 서비스를 변경하거나 종료하는 경우 그 내용을 사전에 공지합니다. 다만, 예측하기 어려운 기술상·업무상 사유나 법령상의 사유가 있는 경우에는 사후에 통지할 수 있습니다.",

    "term.article11.title": "제11조 (서비스 내용의 변경)",
    "term.article11.para1":
      "운영자는 서비스의 내용(기능, UI 등)을 추가·변경·삭제할 수 있습니다. 무료로 제공되는 서비스의 전부 또는 일부를 운영상의 필요에 따라 변경하거나 중단할 수 있습니다.",
    "term.article11.para2":
      "서비스 변경으로 회원에게 불리한 사항이 있는 경우 운영자는 사전에 공지하며, 회원은 변경된 서비스에 동의하지 않는 경우 이용계약을 해지할 수 있습니다.",

    "term.article12.title": "제12조 (정보의 제공 및 광고의 게재)",
    "term.article12.para1":
      "운영자는 서비스 운영에 필요한 각종 정보를 서비스 화면이나 이메일을 통해 회원에게 제공할 수 있습니다. 회원은 관련 법령에 따른 거래 관련 정보 등을 제외하고 수신을 거절할 수 있습니다.",
    "term.article12.para2":
      "운영자는 서비스 화면, 이메일 등에 광고를 게재할 수 있으며, 회원은 서비스 이용 시 광고 노출에 동의하는 것으로 봅니다.",
    "term.article12.para3":
      "운영자가 제공하는 광고나 제3자의 광고에 회원이 참여하여 발생한 손실 및 손해에 대해서는 운영자가 책임을 지지 않습니다.",

    "term.article13.title": "제13조 (권리의 귀속)",
    "term.article13.para1":
      "서비스 및 운영자가 제공하는 콘텐츠에 대한 저작권 및 지적재산권은 운영자에게 귀속됩니다.",
    "term.article13.para2":
      "회원은 서비스를 이용하는 과정에서 얻은 정보를 운영자의 사전 승낙 없이 복제, 전송, 출판, 배포, 방송 기타 방법으로 이용하거나 제3자에게 이용하게 해서는 안 됩니다.",

    "term.article14.title": "제14조 (회원의 계약해지와 이용중지)",
    "term.article14.para1":
      "회원은 언제든지 서비스 내 탈퇴 메뉴를 통해 이용계약을 해지할 수 있으며, 운영자는 관련 법령이 정하는 바에 따라 이를 즉시 처리합니다.",
    "term.article14.para2":
      "회원이 탈퇴하면 운영자는 관련 법령 및 개인정보처리방침에 따라 필요한 범위 내에서 회원의 정보를 보유할 수 있으며, 이후에는 즉시 파기합니다.",
    "term.article14.para3":
      "운영자는 회원이 본 약관을 위반하거나 서비스 운영을 방해하는 행위를 하는 경우 서비스 이용을 경고, 제한 또는 중지할 수 있습니다. 이로 인해 발생한 손해에 대해 운영자는 별도의 보상을 하지 않습니다.",

    "term.article15.title": "제15조 (이용제한)",
    "term.article15.para1":
      "운영자는 다음 각 호의 경우 회원의 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.",
    "term.article15.para1.item1":
      "본 약관 또는 운영정책을 위반하여 서비스의 정상적인 운영을 방해한 경우",
    "term.article15.para1.item2":
      "타인의 개인정보를 도용하거나 허위 정보를 등록한 경우",
    "term.article15.para1.item3":
      "악성 프로그램 유포, 해킹, 불법정보 게재, 사기행위, 저작권 및 지식재산권 침해 등 법령을 위반하는 행위를 한 경우",
    "term.article15.para1.item4":
      "운영자의 승인을 받지 않고 서비스를 이용해 영업·광고·정치활동 등을 수행한 경우",
    "term.article15.para1.item5": "기타 관련 법령을 위반하는 행위를 한 경우",
    "term.article15.para2":
      "운영자는 이용제한을 하고자 할 경우 사전에 통지하나, 긴급한 사유가 있는 경우에는 사후에 통지할 수 있습니다.",
    "term.article15.para3":
      "운영자가 이용계약을 해지하는 경우 운영자는 회원에게 해지사유를 밝혀 통지하며, 회원은 통지일로부터 7일 이내 이의를 제기할 수 있습니다.",

    // Chapter 4
    "term.chapter4.title": "제4장 유료서비스 (추후 도입 시 적용)",
    "term.chapter4.intro":
      "현재 서비스는 무료로 제공되며, 향후 유료 서비스 도입 시 다음 규정이 적용됩니다.",

    "term.article16.title": "제16조 (유료서비스 이용 계약 및 요금제)",
    "term.article16.para1":
      "유료서비스 이용계약은 회원이 유료서비스를 신청하고 운영자가 승낙함으로써 성립합니다.",
    "term.article16.para2":
      "유료서비스의 종류, 이용 요금, 결제 방법, 환불 기준 등은 별도의 이용안내나 운영정책에 따르며, 운영자는 유료서비스의 내용을 변경하거나 종료할 수 있습니다.",
    "term.article16.para3":
      "회원은 유료서비스 이용에 필요한 대금을 신용카드, 계좌이체 등 운영자가 정한 방법으로 결제해야 합니다.",

    "term.article17.title": "제17조 (청약 철회 및 환불)",
    "term.article17.para1":
      "회원은 유료서비스 결제 후 7일 이내에 서비스를 전혀 이용하지 않은 경우 청약 철회 및 환불을 요청할 수 있습니다. 운영자는 회원이 제시한 자료에 따라 적정한 절차를 거쳐 환불을 진행합니다.",
    "term.article17.para2":
      "회원이 이미 서비스를 이용한 경우에는 환불이 제한될 수 있으며, 프로모션을 통해 무상으로 취득한 혜택은 환불 대상에서 제외됩니다.",
    "term.article17.para3":
      "환불 및 과오금 처리와 관련하여 회원이 제공해야 하는 정보, 환불 기한 등은 운영정책에서 별도로 정합니다.",

    "term.article18.title": "제18조 (유료서비스 내용 변경 및 서비스 중지)",
    "term.article18.para1":
      "운영자는 운영상, 기술상 필요에 따라 유료서비스의 내용(가격, 제공 수량 등)을 변경할 수 있으며, 변경 사항은 사전에 유료회원에게 공지합니다.",
    "term.article18.para2":
      "유료서비스의 중지나 종료가 발생하는 경우 운영자는 사전에 통지하고, 회원은 공지된 내용에 따라 적절한 조치를 취할 수 있습니다.",

    // Chapter 5
    "term.chapter5.title": "제5장 손해배상 및 면책조항",
    "term.article19.title": "제19조 (손해배상)",
    "term.article19.para1":
      "운영자가 제공하는 유료서비스의 하자 등으로 회원에게 손해가 발생한 경우 운영자는 관련 법령이 정하는 범위 내에서 손해를 배상합니다.",
    "term.article19.para2":
      "회원이 본 약관 및 관계 법령을 위반하여 운영자에 손해가 발생한 경우 회원은 운영자가 입은 모든 손해를 배상해야 합니다.",

    "term.article20.title": "제20조 (책임의 한계)",
    "term.article20.para1":
      "운영자는 천재지변, 정전, 서버나 네트워크 장애, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.",
    "term.article20.para2":
      "운영자는 회원의 귀책사유로 인해 발생한 서비스 이용 장애에 대해 책임을 지지 않으며, 회원이 서비스를 통해 전송하거나 게시한 정보의 신뢰도 및 정확성에 대해 보증하지 않습니다.",
    "term.article20.para3":
      "운영자는 제3자 서비스와의 연동 과정에서 발생한 문제에 대해 책임지지 않습니다. 제3자 서비스를 함께 사용하는 경우 회원은 해당 서비스의 약관을 준수해야 합니다.",

    // Chapter 6
    "term.chapter6.title": "제6장 기타",
    "term.article21.title": "제21조 (준거법 및 재판관할)",
    "term.article21.para1":
      "본 약관과 서비스 이용에 관한 분쟁에는 대한민국 법을 적용합니다.",
    "term.article21.para2":
      "서비스 이용과 관련하여 운영자와 회원 사이에 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 성실히 협의합니다. 협의가 이루어지지 않을 경우 민사소송법상의 관할법원에 소를 제기할 수 있습니다.",

    "term.article22.title": "제22조 (전자서명 이용약관의 적용)",
    "term.article22.content":
      "서비스에서 제공하는 전자서명 기능을 이용할 경우 별도로 게시된 전자서명 이용약관에 동의해야 하며, 본 약관과 전자서명 이용약관이 충돌하는 경우 전자서명 이용약관이 우선합니다.",

    "term.article23.title": "제23조 (개인정보 처리방침)",
    "term.article23.content":
      "개인정보의 수집·이용·제공·파기 등 처리에 관한 사항은 별도로 게시하는 개인정보처리방침에 따르며, 본 약관과 개인정보처리방침이 상충할 경우 개인정보처리방침이 우선합니다.",

    "term.article24.title": "제24조 (약관의 효력)",
    "term.article24.content":
      "본 약관은 2025년 10월 1일부터 적용됩니다. 운영자는 필요한 경우 본 약관을 개정할 수 있으며, 개정된 약관은 제3조에서 정한 방식에 따라 공지한 때부터 효력이 발생합니다.",

    "term.effectiveDate.title": "시행일",
    "term.effectiveDate.date": "이 이용약관은 2025년 10월 1일부터 적용됩니다.",

    // Contact Page
    "contact.backToHome": "홈으로 돌아가기",
    "contact.title": "문의하기",
    "contact.description":
      "궁금한 사항이나 제안이 있으시면 언제든지 연락해주세요.",
    "contact.form.name": "이름",
    "contact.form.namePlaceholder": "홍길동",
    "contact.form.email": "이메일",
    "contact.form.emailPlaceholder": "example@email.com",
    "contact.form.subject": "제목",
    "contact.form.subjectPlaceholder": "문의 제목을 입력하세요",
    "contact.form.message": "메시지",
    "contact.form.messagePlaceholder": "문의 내용을 입력해주세요...",
    "contact.form.submit": "문의하기",
    "contact.form.submitting": "전송 중...",
    "contact.success.title": "문의가 전송되었습니다",
    "contact.success.description":
      "빠른 시일 내에 답변 드리겠습니다. 감사합니다.",
    "contact.error.title": "전송 실패",
    "contact.error.description":
      "문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.",

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
      "전자우편(cs.seuk.seuk@gmail.com)을 통해 서면·이메일·팩스 등으로 요구할 수 있으며, 서비스는 이에 대해 지체 없이 조치합니다.",
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
    "pricing.free.cta": "Get Started",
    "pricing.starter.name": "Starter",
    "pricing.starter.description": "For individuals and small teams",
    "pricing.starter.cta": "Get Started",
    "pricing.pro.name": "Pro",
    "pricing.pro.description": "For professionals and small teams",
    "pricing.pro.cta": "Go Pro",
    "pricing.popular": "Popular",
    "pricing.perMonth": "/month",
    "pricing.perYear": "/year",
    "pricing.billing.monthly": "monthly",
    "pricing.billing.yearly": "yearly",
    // Pricing limits (dynamic count)
    "pricing.limitPerMonth": "Up to {count} documents per month",
    "pricing.limitUnlimitedPerMonth": "Unlimited documents per month",

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
    "pricingPage.perYear": "/year",
    "pricingPage.documentsPerMonth": "Monthly documents",
    "pricingPage.activeDocuments": "Active documents",
    "pricingPage.unlimited": "Unlimited",
    "pricingPage.documents": "",
    "pricingPage.currentlyUsing": "Currently Using",
    "pricingPage.lowerPlan": "Using Higher Plan",
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
    "pricingPage.plans.starter.description": "For individuals and small teams",
    "pricingPage.plans.pro.description": "Enhanced features for professionals",

    // Checkout Success
    "checkout.success.title": "Payment Successful!",
    "checkout.success.message":
      "Thank you for subscribing. Your payment has been processed successfully.",
    "checkout.success.emailInfo":
      "You will receive a confirmation email shortly with your subscription details.",
    "checkout.success.dashboard": "Go to Dashboard",

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
    "register.terms": "Terms of Service",
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

    // Bills
    "bills.title": "Billing & Subscriptions",
    "bills.description": "Manage your subscriptions and payment history",
    "bills.subscriptions": "Subscriptions",
    "bills.payments": "Payment History",
    "bills.startedOn": "Started on:",
    "bills.nextPayment": "Next Payment",
    "bills.pastPayments": "Past Payments",
    "bills.due": "due",
    "bills.cancel.title": "Cancel subscription",
    "bills.cancel.description":
      "Your subscription remains active until the end of the current billing period.",
    "bills.cancel.action": "Cancel subscription",
    "bills.cancel.keep": "Keep subscription",
    "bills.cancel.confirm": "Confirm cancel",
    "bills.cancel.canceling": "Canceling...",
    "bills.cancel.scheduled": "Subscription scheduled for cancellation",
    "bills.cancel.failed": "Cancellation failed",
    "bills.noSubscription.title": "No active subscription",
    "bills.noSubscription.description":
      "Subscribe to a premium plan to unlock more features",
    "bills.noSubscription.action": "View Plans",
    "bills.noTransactions": "No payment history available",
    // Billing payment reasons
    "bills.payment.reason.new": "New",
    "bills.payment.reason.renewalOf": "Renewal of",
    // Table
    "table.previous": "Previous",
    "table.next": "Next",
    "table.noResults": "No results.",
    "table.date": "Date",
    "table.amount": "Amount",
    "table.status": "Status",
    "table.description": "Description",
    "table.moreCount": "+{count} more",
    "table.pageOf": "Page {current} of {total}",
    "bills.error.loadSubscriptions": "Failed to load subscriptions",
    "bills.error.loadTransactions": "Failed to load transactions",
    "bills.error.loadSubscriptionDetail": "Failed to load subscription details",

    // Document Status
    "status.draft": "Draft",
    "status.published": "Published",
    "status.completed": "Completed",
    "status.active": "Active",
    "status.paid": "Paid",
    "status.trialing": "Trialing",
    "status.ready": "Ready",
    "status.canceled": "Canceled",
    "status.inactive": "Inactive",
    "status.past_due": "Past due",
    "status.paused": "Paused",
    "status.billed": "Billed",

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
    "usage.upgrade.description.free": "Upgrade to Pro plan",
    "usage.upgrade.description.pro": "Upgrade to a higher plan",
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
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",

    // Terms of Service Page
    "term.backToHome": "Back to Home",
    "term.title": "SeukSeuk Terms of Service",
    "term.intro":
      'These Terms of Service establish the rights, obligations, responsibilities, and other necessary matters between the operator and members regarding the use of the electronic document signing and management services provided by an individual (hereinafter referred to as the "Operator") through SeukSeuk (hereinafter referred to as the "Service").',

    // Chapter 1
    "term.chapter1.title": "Chapter 1: General Provisions",
    "term.article1.title": "Article 1 (Purpose)",
    "term.article1.content":
      "These Terms of Service aim to establish the rights, obligations, responsibilities, and other necessary matters between the Operator and members (or non-members) regarding the use of the Service. The Service provides tools for signing electronic documents online.",

    "term.article2.title": "Article 2 (Definition of Terms)",
    "term.article2.item1":
      "Service: Cloud-based electronic document signing and management service provided by the Operator.",
    "term.article2.item2":
      "Member: A person who concludes a service agreement according to these Terms and uses the Service. Login is performed using the name, email, and password provided during membership registration.",
    "term.article2.item3":
      "Non-member: A person who uses the Service without membership registration.",
    "term.article2.item4":
      "Signature Requester: A member who requests a signature on an electronic document.",
    "term.article2.item5":
      "Signer: A user who receives or provides a signature request on an electronic document from the signature requester.",
    "term.article2.item6":
      "Paid Service: Services provided by the Operator that members can use after paying a fee (may be introduced in the future).",

    "term.article3.title": "Article 3 (Publication and Amendment of Terms)",
    "term.article3.para1":
      "The Operator shall post the contents of these Terms and the Operator's contact information on the initial screen of the Service or a separate connection screen for easy access by members.",
    "term.article3.para2":
      "The Operator may amend these Terms without violating relevant laws (Personal Information Protection Act, Electronic Signature Act, etc.).",
    "term.article3.para3":
      "When the Operator amends the Terms, the effective date and reasons for amendment shall be clearly stated and posted through service notifications at least 7 days before the effective date along with the current terms.",
    "term.article3.para4":
      "If a member does not agree with the amended terms, they may stop using the Service and withdraw. If they continue to use the Service without expressing separate refusal, they shall be deemed to have agreed to the amended terms.",

    "term.article4.title": "Article 4 (Interpretation of Terms)",
    "term.article4.content":
      "Matters not specified in these Terms shall be governed by relevant laws and general commercial practices. If there is conflicting content between these Terms and separate operational policies or guides provided with the Service, the individual policy shall take precedence.",

    // Chapter 2
    "term.chapter2.title": "Chapter 2: Service Use Agreement",
    "term.article5.title": "Article 5 (Formation of Service Use Agreement)",
    "term.article5.para1":
      'A service use agreement is formed when a person wishing to use the Service (hereinafter referred to as the "Applicant") agrees to these Terms and Privacy Policy, applies for membership, and the Operator accepts it.',
    "term.article5.para2":
      "The Applicant must accurately enter their name, email, and password, and shall not misuse another person's information.",
    "term.article5.para3":
      "The Operator may refuse or subsequently cancel acceptance of applications that fall under any of the following:",
    "term.article5.para3.item1":
      "Using a name that is not real or using another person's information",
    "term.article5.para3.item2":
      "Entering false information or not entering required items",
    "term.article5.para3.item3":
      "Children under 14 years of age entering personal information without legal representative's consent",
    "term.article5.para3.item4":
      "Applying in violation of restrictions set by the Operator",
    "term.article5.para4":
      "Persons under 14 years of age cannot use the Service. Although the Operator does not separately provide age verification, if use by persons under 14 is confirmed, service use will be immediately suspended and legal representative's consent will be requested or the account may be deleted.",

    "term.article6.title": "Article 6 (Provision of User Information)",
    "term.article6.para1":
      "Members must provide necessary information such as name, email, and password during membership registration, and service use may be restricted if they use information that is not their own or false information.",
    "term.article6.para2":
      "The Operator may require email verification or social login for identity verification.",
    "term.article6.para3":
      "Members must properly manage their account information (email, password, etc.) and are responsible for information leakage or third-party abuse due to carelessness.",

    "term.article7.title":
      "Article 7 (Protection and Management of Personal Information)",
    "term.article7.para1":
      "The Operator strives to protect members' personal information in accordance with relevant laws and a separately posted Privacy Policy. Specific details regarding personal information processing shall follow the Privacy Policy.",
    "term.article7.para2":
      "The Operator's responsibility does not apply if members use the signature function through external links other than the official service site.",
    "term.article7.para3":
      "The Operator allows members to download electronic documents after signature completion and may destroy original documents after a certain period. Members must properly back up completed signed documents.",
    "term.article7.para4":
      "The Operator collects and uses members' personal information through lawful procedures and methods and does not provide it to third parties without members' consent.",

    "term.article8.title": "Article 8 (Member Account and Password Management)",
    "term.article8.para1":
      "Members cannot use the email account used in the Service for purposes other than their own management or transfer it to third parties.",
    "term.article8.para2":
      "Members must create secure passwords and change them at appropriate intervals. The Operator may request password changes for security or operational reasons. If members do not change within the specified period, the Operator may forcibly change the password.",
    "term.article8.para3":
      "If members recognize that their account has been stolen, they must immediately notify the Operator, and the Operator will take action without delay. The Operator is not responsible for damages caused by members' failure to notify.",

    "term.article9.title": "Article 9 (Operator's Notification)",
    "term.article9.para1":
      "When the Operator needs individual notification to members, it shall be sent to the email address registered at the time of membership registration.",
    "term.article9.para2":
      "When notifying all members, the Operator may substitute individual notification by posting on the service initial screen or announcements for at least 7 days.",

    // Chapter 3
    "term.chapter3.title": "Chapter 3: Service Provision and Changes",
    "term.article10.title": "Article 10 (Provision of Service)",
    "term.article10.para1":
      "The Operator shall commence service from the time a member's membership registration is completed. However, some services may be provided from the time separate application procedures are completed.",
    "term.article10.para2":
      "The Operator may periodically inspect, repair, and replace facilities for stable service provision, which may temporarily interrupt the Service.",
    "term.article10.para3":
      "When the Operator changes or terminates the Service, it shall announce the content in advance. However, in cases of unpredictable technical or business reasons or legal reasons, notification may be made afterwards.",

    "term.article11.title": "Article 11 (Changes to Service Content)",
    "term.article11.para1":
      "The Operator may add, change, or delete service content (features, UI, etc.). All or part of the free service may be changed or suspended according to operational needs.",
    "term.article11.para2":
      "If there are unfavorable matters to members due to service changes, the Operator shall announce them in advance, and members may terminate the use agreement if they do not agree with the changed service.",

    "term.article12.title":
      "Article 12 (Provision of Information and Advertisement Placement)",
    "term.article12.para1":
      "The Operator may provide various information necessary for service operation to members through the service screen or email. Members may refuse to receive information except transaction-related information according to relevant laws.",
    "term.article12.para2":
      "The Operator may place advertisements on the service screen, email, etc., and members are deemed to consent to advertisement exposure when using the Service.",
    "term.article12.para3":
      "The Operator is not responsible for losses and damages incurred by members' participation in advertisements provided by the Operator or third parties.",

    "term.article13.title": "Article 13 (Attribution of Rights)",
    "term.article13.para1":
      "Copyrights and intellectual property rights for the Service and content provided by the Operator belong to the Operator.",
    "term.article13.para2":
      "Members shall not reproduce, transmit, publish, distribute, broadcast, or otherwise use information obtained during the use of the Service or allow third parties to use it without the Operator's prior consent.",

    "term.article14.title":
      "Article 14 (Member's Contract Termination and Suspension of Use)",
    "term.article14.para1":
      "Members may terminate the use agreement at any time through the withdrawal menu in the Service, and the Operator shall immediately process this in accordance with relevant laws.",
    "term.article14.para2":
      "When a member withdraws, the Operator may retain member information within the necessary scope according to relevant laws and the Privacy Policy, and shall immediately destroy it thereafter.",
    "term.article14.para3":
      "The Operator may warn, restrict, or suspend service use if members violate these Terms or engage in acts that interfere with service operation. The Operator shall not provide separate compensation for damages incurred thereby.",

    "term.article15.title": "Article 15 (Use Restrictions)",
    "term.article15.para1":
      "The Operator may restrict members' service use or terminate the contract in the following cases:",
    "term.article15.para1.item1":
      "Violating these Terms or operational policies and interfering with normal service operation",
    "term.article15.para1.item2":
      "Misusing others' personal information or registering false information",
    "term.article15.para1.item3":
      "Distributing malicious programs, hacking, posting illegal information, fraud, copyright and intellectual property infringement, or other acts violating laws",
    "term.article15.para1.item4":
      "Using the Service without Operator's approval for business, advertising, political activities, etc.",
    "term.article15.para1.item5": "Other acts violating relevant laws",
    "term.article15.para2":
      "The Operator shall notify in advance when imposing use restrictions, but may notify afterwards in urgent cases.",
    "term.article15.para3":
      "When the Operator terminates the use agreement, it shall notify members with the reasons for termination, and members may object within 7 days from the notification date.",

    // Chapter 4
    "term.chapter4.title": "Chapter 4: Paid Services (Applied When Introduced)",
    "term.chapter4.intro":
      "The Service is currently provided free of charge, and the following regulations will apply when paid services are introduced in the future.",

    "term.article16.title":
      "Article 16 (Paid Service Use Agreement and Fee System)",
    "term.article16.para1":
      "A paid service use agreement is formed when a member applies for paid services and the Operator accepts it.",
    "term.article16.para2":
      "Types of paid services, usage fees, payment methods, refund standards, etc. shall follow separate usage guides or operational policies, and the Operator may change or terminate paid service content.",
    "term.article16.para3":
      "Members must pay the necessary fees for using paid services by credit card, bank transfer, or other methods determined by the Operator.",

    "term.article17.title": "Article 17 (Withdrawal and Refund)",
    "term.article17.para1":
      "Members may request withdrawal and refund if they have not used the service at all within 7 days after paid service payment. The Operator shall process refunds through appropriate procedures according to the materials provided by members.",
    "term.article17.para2":
      "Refunds may be restricted if members have already used the service, and benefits acquired free through promotions are excluded from refund targets.",
    "term.article17.para3":
      "Information to be provided by members regarding refunds and overpayment processing, refund deadlines, etc. shall be separately determined in operational policies.",

    "term.article18.title":
      "Article 18 (Changes to Paid Service Content and Service Suspension)",
    "term.article18.para1":
      "The Operator may change paid service content (price, quantity provided, etc.) according to operational and technical needs, and shall announce changes to paid members in advance.",
    "term.article18.para2":
      "If paid service suspension or termination occurs, the Operator shall notify in advance, and members may take appropriate action according to the announced content.",

    // Chapter 5
    "term.chapter5.title": "Chapter 5: Damages and Disclaimer",
    "term.article19.title": "Article 19 (Damages)",
    "term.article19.para1":
      "If damages occur to members due to defects in paid services provided by the Operator, the Operator shall compensate for damages within the scope determined by relevant laws.",
    "term.article19.para2":
      "If damages occur to the Operator due to members' violations of these Terms and relevant laws, members must compensate for all damages incurred by the Operator.",

    "term.article20.title": "Article 20 (Limitation of Liability)",
    "term.article20.para1":
      "The Operator is not responsible if unable to provide services due to force majeure such as natural disasters, power outages, server or network failures, or service interruptions by telecommunications carriers.",
    "term.article20.para2":
      "The Operator is not responsible for service use failures caused by members' fault and does not guarantee the reliability and accuracy of information transmitted or posted by members through the Service.",
    "term.article20.para3":
      "The Operator is not responsible for problems occurring during integration with third-party services. When using third-party services together, members must comply with the terms of those services.",

    // Chapter 6
    "term.chapter6.title": "Chapter 6: Miscellaneous",
    "term.article21.title": "Article 21 (Governing Law and Jurisdiction)",
    "term.article21.para1":
      "Korean law shall apply to disputes regarding these Terms and service use.",
    "term.article21.para2":
      "If a dispute arises between the Operator and members regarding service use, both parties shall sincerely consult for amicable resolution. If consultation is not reached, lawsuits may be filed with the competent court under the Civil Procedure Act.",

    "term.article22.title":
      "Article 22 (Application of Electronic Signature Terms)",
    "term.article22.content":
      "When using the electronic signature function provided by the Service, consent to separately posted electronic signature terms is required, and if these Terms conflict with electronic signature terms, the electronic signature terms shall take precedence.",

    "term.article23.title": "Article 23 (Privacy Policy)",
    "term.article23.content":
      "Matters concerning the collection, use, provision, and destruction of personal information shall follow the separately posted Privacy Policy, and if these Terms conflict with the Privacy Policy, the Privacy Policy shall take precedence.",

    "term.article24.title": "Article 24 (Effectiveness of Terms)",
    "term.article24.content":
      "These Terms shall be effective from October 1, 2025. The Operator may amend these Terms if necessary, and amended terms shall be effective from the time announced according to the method determined in Article 3.",

    "term.effectiveDate.title": "Effective Date",
    "term.effectiveDate.date":
      "These Terms of Service are effective from October 1, 2025.",

    // Contact Page
    "contact.backToHome": "Back to Home",
    "contact.title": "Contact Us",
    "contact.description":
      "Feel free to reach out with any questions or suggestions.",
    "contact.form.name": "Name",
    "contact.form.namePlaceholder": "John Doe",
    "contact.form.email": "Email",
    "contact.form.emailPlaceholder": "example@email.com",
    "contact.form.subject": "Subject",
    "contact.form.subjectPlaceholder": "Enter your inquiry subject",
    "contact.form.message": "Message",
    "contact.form.messagePlaceholder": "Please enter your message...",
    "contact.form.submit": "Send Message",
    "contact.form.submitting": "Sending...",
    "contact.success.title": "Message Sent",
    "contact.success.description":
      "We'll get back to you as soon as possible. Thank you.",
    "contact.error.title": "Send Failed",
    "contact.error.description":
      "An error occurred while sending your message. Please try again.",

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
      "Requests can be made in writing, email, fax, etc. via cs.seuk.seuk@gmail.com, and the Service will take action without delay.",
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
