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
  t: (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ) => string;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "ko",
  setLanguage: async () => { },
  t: (key, fallbackOrParams) => typeof fallbackOrParams === "string" ? fallbackOrParams : key,
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
    "upload.save": "저장하기",
    "upload.saving": "저장 중...",
    "upload.filename": "파일 이름",
    "upload.alias": "문서 이름",
    "upload.aliasOptional": "선택사항",
    "upload.aliasPlaceholder": "문서 이름을 입력하세요 (예: 계약서, 회의록 등)",
    "upload.aliasDescription": "문서를 구분하기 쉽도록 별칭을 지정할 수 있습니다. 입력하지 않으면 파일 이름이 표시됩니다.",

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
      "문서 서명이 성공적으로 완료되어 안전하게 저장되었습니다. 서명 완료된 문서가 필요한 경우 문서 발행자에게 문의 부탁드립니다.",

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
    "pricing.free.name": "베이직",
    "pricing.free.description": "개인 사용자를 위한 무료 플랜",
    "pricing.basic.name": "베이직",
    "pricing.basic.description": "개인 사용자를 위한 베이직 플랜",
    "pricing.free.price": "무료",
    "pricing.free.cta": "시작하기",
    "pricing.basic.cta": "시작하기",
    "pricing.starter.name": "스타터",
    "pricing.starter.description": "개인 또는 소규모 팀을 위한 플랜",
    "pricing.starter.cta": "스타터 시작하기",
    "pricing.pro.name": "프로",
    "pricing.pro.description": "전문가를 위한 플랜",
    "pricing.pro.freeTrial": "30일 무료체험",
    "pricing.pro.cta": "프로 시작하기",
    "pricing.popular": "인기",
    "pricing.perMonth": "월",
    "pricing.perYear": "년",
    "pricing.billing.monthly": "월간",
    "pricing.billing.yearly": "연간",
    // Pricing limits (dynamic count)
    "pricing.limitPerMonth": "매 월 최대 {{count}}개 문서 충전",
    "pricing.limitUnlimitedPerMonth": "문서 무제한 생성",

    // Pricing Page Specific Keys
    "pricingPage.title": "요금제 선택",
    "pricingPage.description":
      "필요에 맞는 플랜을 선택하고 더 많은 기능을 이용하세요",
    "pricingPage.currentPlan": "현재 {{planName}} 플랜을 이용 중입니다",
    "pricingPage.popular": "인기",
    "pricingPage.currentBadge": "현재 플랜",
    "pricingPage.free": "무료",
    "pricingPage.contact": "문의",
    "pricingPage.perMonth": "/월",
    "pricingPage.perYear": "/년",
    "pricingPage.unlimited": "무제한",
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
    "pricingPage.plans.basic.description": "개인 사용자를 위한 베이직 플랜",
    "pricingPage.plans.starter.description": "개인 또는 소규모 팀을 위한 플랜",
    "pricingPage.plans.pro.description": "전문가를 위한 플랜",

    // Checkout Page
    "checkout.backButton": "요금제 페이지로 돌아가기",
    "checkout.paymentDetails": "결제하기",
    "checkout.orderSummary": "주문 요약",
    "checkout.subtotal": "소계",
    "checkout.tax": "세금",
    "checkout.dueToday": "오늘 결제",
    "checkout.then": "이후",
    "checkout.incTax": "세금 포함",
    "checkout.billing.daily": "매일",
    "checkout.billing.weekly": "매주",
    "checkout.billing.monthly": "매월",
    "checkout.billing.yearly": "매년",
    "checkout.billing.days": "일마다",
    "checkout.billing.weeks": "주마다",
    "checkout.billing.months": "개월마다",
    "checkout.billing.years": "년마다",
    "checkout.billing.every": "매",

    // Checkout Success
    "checkout.success.title": "결제가 완료되었습니다!",
    "checkout.success.message":
      "구독해 주셔서 감사합니다. 결제가 성공적으로 처리되었습니다.",
    "checkout.success.emailInfo":
      "구독 세부 정보가 포함된 확인 이메일이 곧 발송됩니다.",
    "checkout.success.dashboard": "대시보드로 이동",

    "home.cta.title": "궁금한 점이 있으신가요?",
    "home.cta.description":
      "슥슥 팀이 도와드리겠습니다. 언제든지 문의해 주세요.",
    "home.cta.button": "문의하기",
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

    // Register Success
    "register.success.title": "회원가입이 완료되었습니다!",
    "register.success.subtitle": "이메일 인증",
    "register.success.emailSent": "이메일 인증 메일이 발송되었습니다",
    "register.success.description":
      "가입하신 이메일 주소로 인증 메일이 발송되었습니다. 이메일을 확인하여 계정을 활성화해주세요.",
    "register.success.checkSpam":
      "메일이 보이지 않으면 스팸 폴더를 확인해주세요.",
    "register.success.goToLogin": "로그인 화면으로",

    // Consent Page
    "consent.title": "서비스 이용을 위해 약관에 동의해주세요",
    "consent.subtitle":
      "카카오 계정으로 로그인하셨다면 슥슥 이용약관과 개인정보 처리방침에 대한 동의가 추가로 필요합니다.",
    "consent.linksDescription": "아래 문서를 확인한 뒤 동의 여부를 선택해주세요.",
    "consent.viewTerms": "슥슥 이용약관 보기",
    "consent.viewPrivacy": "개인정보 처리방침 보기",
    "consent.checkbox": "슥슥 이용약관과 개인정보 처리방침을 모두 읽었으며 이에 동의합니다.",
    "consent.agreeButton": "동의하고 계속하기",
    "consent.declineNotice":
      "동의하지 않을 경우 서비스를 이용할 수 없습니다. 동의하지 않는다면 로그아웃 후 이용을 중단해주세요.",
    "consent.declineButton": "동의하지 않고 로그아웃",
    "consent.error": "약관 동의 처리 중 문제가 발생했습니다. 다시 시도해주세요.",

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
    "sign.completed.message": "이 문서는 이미 서명이 완료되어 제출되었습니다. 서명 완료된 문서가 필요한 경우 문서 발행자에게 문의 부탁드립니다.",
    "sign.completed.noEdit": "더 이상 수정할 수 없습니다.",
    "sign.completed.status": "서명 완료됨",
    "sign.expired.title": "서명 기간 만료",
    "sign.expired.message": "죄송합니다. 이 문서의 서명 기간이 만료되었습니다.",
    "sign.expired.instruction":
      "문서 발행자에게 연락하여 새로운 서명 요청을 받아주세요.",
    "sign.expired.date": "만료일:",
    "sign.savingSignature": "서명 저장 중...",
    "sign.documentList.title": "서명할 문서 목록",
    "sign.documentList.description": "아래 문서를 선택하여 서명을 시작하세요",
    "sign.documentList.signaturesCompleted": "{{completed}}/{{total}} 서명 완료",
    "sign.documentList.allSigned": "모든 서명 완료",
    "sign.documentList.startSigning": "서명 시작",
    "sign.documentList.continueSign": "서명 계속하기",
    "sign.documentList.viewDocument": "문서 보기",
    "sign.documentList.backToList": "문서 목록으로 돌아가기",

    // Authentication
    "auth.signOut": "로그아웃",
    "auth.signingOut": "로그아웃 중...",

    // Dashboard
    "dashboard.title": "내 문서",
    "dashboard.description": "총 {{total}}개의 문서를 관리하고 있습니다.",
    "dashboard.header.title": "내 문서",
    "dashboard.header.description": "문서를 관리하고 서명을 수집하세요",
    "dashboard.publish": "문서 발행",
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
    "dashboard.filter.published": "발행",
    "dashboard.filter.completed": "완료",
    "dashboard.tabs.documents": "문서",
    "dashboard.tabs.publications": "발행",
    "dashboard.publications.empty.title": "발행된 문서가 없습니다",
    "dashboard.publications.empty.description": "초안 문서를 발행하여 다른 사람과 공유해보세요.",
    "dashboard.publications.empty.action": "문서 발행하기",
    "dashboard.publications.status.active": "활성",
    "dashboard.publications.status.completed": "완료",
    "dashboard.publications.status.expired": "만료",
    "dashboard.publications.card.documentCount": "개 문서",
    "dashboard.publications.card.copied": "복사됨",
    "dashboard.publications.card.copyLink": "링크",
    "dashboard.publications.card.cannotDelete": "완료된 발행은 삭제할 수 없습니다",
    "dashboard.publications.delete.title": "발행 삭제",
    "dashboard.publications.delete.description": "\"{name}\" 발행을 삭제하시겠습니까?",
    "dashboard.publications.delete.warning": "이 발행에 포함된 모든 문서는 초안 상태로 돌아갑니다.",
    "dashboard.publications.delete.cancel": "취소",
    "dashboard.publications.delete.confirm": "삭제",
    "dashboard.publications.delete.deleting": "삭제 중...",
    "dashboard.publications.bulkDelete.cannotDelete": "완료되지 않은 발행은 삭제할 수 없습니다",
    "dashboard.publications.bulkDelete.successMessage": "{{count}}개의 발행이 삭제되었습니다",
    "dashboard.publications.bulkDelete.errorMessage": "{{count}}개의 발행 삭제 실패: {{details}}",
    "dashboard.bulkDelete.selected": "{{count}}개 선택됨",
    "dashboard.bulkDelete.selectAll": "모두 선택",
    "dashboard.bulkDelete.deselectAll": "선택 해제",
    "dashboard.bulkDelete.deleteSelected": "선택 항목 삭제",
    "dashboard.bulkDelete.deleting": "삭제 중...",
    "dashboard.bulkDelete.select": "선택",
    "dashboard.bulkDelete.deselect": "선택 해제",
    "dashboard.bulkDelete.cannotDelete": "발행된 문서는 삭제할 수 없습니다",
    "dashboard.bulkDelete.modalTitle": "문서 일괄 삭제",
    "dashboard.bulkDelete.modalWarning": "다음 문서들을 삭제하시겠습니까?",
    "dashboard.bulkDelete.andMore": "외 {{count}}개",
    "dashboard.bulkDelete.draftWarning": "초안 {{count}}개는 영구적으로 삭제됩니다",
    "dashboard.bulkDelete.completedWarning": "완료된 문서 {{count}}개는 보관됩니다",
    "dashboard.bulkDelete.irreversible": "이 작업은 되돌릴 수 없습니다.",
    "dashboard.bulkDelete.cancel": "취소",
    "dashboard.bulkDelete.confirmDelete": "삭제",
    "dashboard.bulkDelete.successMessage": "{{count}}개 문서가 삭제되었습니다",
    "dashboard.bulkDelete.errorMessage": "{{count}}개 문서 삭제 실패: {{details}}",

    // Selection Mode
    "dashboard.selectionMode.enter": "선택",
    "dashboard.selectionMode.exit": "선택 모드 종료",

    // Bills
    "bills.title": "결제 및 구독",
    "bills.description": "구독 정보와 결제 내역을 관리하세요",
    "bills.subscriptions": "구독",
    "bills.payments": "결제 내역",
    "bills.startedOn": "시작일:",
    "bills.nextPayment": "다음 결제일",
    "bills.subscriptionEnds": "구독 종료일",
    "bills.nextPaymentInfo": "다음 결제 정보",
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
    "bills.cancel.endsOn": "플랜 종료일:",
    "bills.noSubscription.title": "활성 구독이 없습니다",
    "bills.noSubscription.description":
      "프리미엄 플랜을 구독하여 더 많은 기능을 이용하세요",
    "bills.noSubscription.action": "플랜 보기",
    "bills.noTransactions": "결제 내역이 없습니다",
    "bills.paymentMethod": "결제 수단",
    "bills.card.update": "결제 카드 업데이트",
    "bills.card.updating": "업데이트 중...",
    "bills.noUpcomingPayment": "예정된 결제가 없습니다",
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
    "table.actions": "작업",
    "table.moreCount": "+{{count}}개 더",
    "table.pageOf": "페이지 {{current}} / {{total}}",
    "bills.error.loadSubscriptions": "구독 정보를 불러오지 못했습니다",
    "bills.error.loadTransactions": "결제 내역을 불러오지 못했습니다",
    "bills.error.loadSubscriptionDetail":
      "구독 상세 정보를 불러오지 못했습니다",
    "bills.error.downloadInvoice": "인보이스 다운로드 실패",

    // Document Status
    "status.draft": "초안",
    "status.published": "발행",
    "status.completed": "완료",
    "status.active": "활성",
    "status.paid": "결제 완료",
    "status.trialing": "체험 중",
    "status.ready": "준비됨",
    "status.canceled": "취소됨",
    "status.expired": "만료됨",
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
    "usage.active.title": "활성 문서 (발행 + 완료)",
    "usage.active.limit.reached": "활성 문서 제한에 도달했습니다",
    "usage.plan.free": "베이직",
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
    "breadcrumb.publish": "문서 발행",
    "breadcrumb.publicationDetail": "발행 상세",
    "breadcrumb.details": "문서 상세",
    "breadcrumb.sign": "서명",
    "breadcrumb.signDocument": "문서 서명",

    // Publication Detail
    "publicationDetail.header.title": "발행 상세",
    "publicationDetail.header.description":
      "발행된 문서의 상세 정보와 서명 진행 상황을 확인하세요.",
    "publicationDetail.status.active": "활성",
    "publicationDetail.status.completed": "완료",
    "publicationDetail.status.expired": "만료됨",
    "publicationDetail.status.unknown": "알 수 없음",
    "publicationDetail.createdAt": "생성일",
    "publicationDetail.expiresAt": "만료일",
    "publicationDetail.password": "비밀번호",
    "publicationDetail.passwordSet": "설정됨",
    "publicationDetail.passwordNotSet": "설정 안 됨",
    "publicationDetail.documentCount": "문서 개수",
    "publicationDetail.countUnit": "개",
    "publicationDetail.signatureLink": "서명 링크",
    "publicationDetail.copyLink": "링크 복사",
    "publicationDetail.openInNewTab": "새 탭에서 열기",
    "publicationDetail.shareLinkDescription":
      "이 링크를 서명자에게 공유하세요. 서명자는 이 링크를 통해 문서에 접근하고 서명할 수 있습니다.",
    "publicationDetail.documentsList": "문서 목록",
    "publicationDetail.signatures": "서명",
    "publicationDetail.documentStatus.completed": "완료",
    "publicationDetail.documentStatus.published": "발행됨",
    "publicationDetail.noDocuments": "문서가 없습니다.",
    "publicationDetail.edit": "수정",
    "publicationDetail.editTitle": "발행 정보 수정",
    "publicationDetail.editDescription":
      "발행 이름, 만료일, 비밀번호를 수정할 수 있습니다.",
    "publicationDetail.editName": "발행 이름",
    "publicationDetail.editExpiresAt": "만료일",
    "publicationDetail.editExpiresAtHint": "만료일을 비워두면 무기한으로 설정됩니다.",
    "publicationDetail.editPassword": "비밀번호",
    "publicationDetail.updatePassword": "비밀번호 변경",
    "publicationDetail.cancelPasswordUpdate": "변경 취소",
    "publicationDetail.editPasswordPlaceholder": "새 비밀번호 (비워두면 비밀번호 없음)",
    "publicationDetail.editPasswordHint":
      "비밀번호를 입력하면 기존 비밀번호를 덮어씁니다. 비워두면 비밀번호 보호가 제거됩니다.",
    "publicationDetail.cancel": "취소",
    "publicationDetail.save": "저장",
    "publicationDetail.saving": "저장 중...",
    "publicationDetail.cannotEditCompleted": "완료된 발행은 수정할 수 없습니다",

    // Document Detail
    "documentDetail.edit": "수정",
    "documentDetail.publish": "발행",
    "documentDetail.delete": "삭제",
    "documentDetail.download": "다운로드",
    "documentDetail.cancel": "취소",
    "documentDetail.addArea": "영역추가",
    "documentDetail.save": "저장",
    "documentDetail.saving": "저장중",
    "documentDetail.loading": "문서 로딩 중...",
    "documentDetail.signatureArea": "서명 영역",
    "documentDetail.errorUpdateArea": "서명 영역 업데이트 중 오류가 발생했습니다",
    "documentDetail.errorDownload": "다운로드 중 오류가 발생했습니다.",
    "documentDetail.errorDelete": "문서 삭제 중 오류가 발생했습니다",

    // Publish Page
    "publish.title": "문서 발행",
    "publish.errorName": "발행 이름을 입력해주세요.",
    "publish.errorPassword": "비밀번호를 입력해주세요.",
    "publish.errorExpiration": "만료일을 선택해주세요.",
    "publish.errorDocuments": "최소 1개 이상의 문서를 선택해주세요.",
    "publish.errorPublishing": "발행 중 오류가 발생했습니다.",
    "publish.name": "발행 이름",
    "publish.namePlaceholder": "예: 2024년 1분기 계약서",
    "publish.password": "비밀번호",
    "publish.passwordPlaceholder": "서명 페이지 접근 시 필요한 비밀번호",
    "publish.expiration": "만료일",
    "publish.expirationPlaceholder": "서명 만료 날짜를 선택하세요",
    "publish.expirationHint": "이 날짜까지 서명자가 문서에 접근할 수 있습니다.",
    "publish.documentSelection": "문서 선택",
    "publish.selectAll": "전체 선택",
    "publish.deselectAll": "전체 해제",
    "publish.cancel": "취소",
    "publish.submit": "발행하기",
    "publish.submitting": "발행 중...",
    "publish.noDrafts": "발행할 수 있는 초안 문서가 없습니다.",
    "publish.uploadDocument": "문서 업로드하기",
    "publish.existingPublications": "기존 발행 목록",

    // Footer
    "footer.terms": "이용약관",
    "footer.privacy": "개인정보 처리방침",

    // Terms of Service Page
    "term.backToHome": "홈으로 돌아가기",
    "term.title": "슥슥 이용약관",
    "term.intro":
      '본 약관은 운영자(이하 "운영자")가 제공하는 전자화문서 서명 및 관리 서비스(이하 "서비스") 이용과 관련하여 운영자와 회원 간의 권리, 의무 및 책임 사항을 규정하고, 전자문서법 등 관련 법령에 따라 요건을 갖춘 전자화문서가 종이 문서와 동일한 법적 효력을 가짐을 알리는 것을 목적으로 합니다.',

    // Chapter 1
    "term.chapter1.title": "제1장 총칙",
    "term.article1.title": "제1조 (목적)",
    "term.article1.content":
      "본 약관은 서비스 이용과 관련하여 운영자와 회원(또는 비회원) 간의 권리, 의무 및 책임, 기타 필요한 사항을 규정합니다. 서비스는 온라인에서 전자화문서를 생성·전달·서명·보관할 수 있는 도구를 제공하며, 관련 법령에 따른 요건을 갖춘 전자화문서가 서면과 동일한 법적 효력을 갖도록 지원합니다.",

    "term.article2.title": "제2조 (용어의 정의)",
    "term.article2.item1":
      "서비스: 회원이 종이 문서를 전자화하거나 전자화문서를 전송·서명·저장·열람할 수 있도록 운영자가 제공하는 플랫폼.",
    "term.article2.item2":
      "전자화문서: 종이 문서 또는 전자적으로 작성된 문서를 스캔·변환하여 전자적 형태로 저장하고, 내용을 열람·재현할 수 있는 문서.",
    "term.article2.item3":
      "서명 데이터: 회원 또는 서명자가 터치, 마우스 입력, 이미지 업로드 등으로 생성한 서명 필체 또는 서명 이미지 데이터.",
    "term.article2.item4":
      "회원: 본 약관과 개인정보처리방침에 동의하고 서비스 이용계약을 체결한 자.",
    "term.article2.item5":
      "비회원: 회원가입을 하지 않고 서비스를 이용하는 자.",
    "term.article2.item6":
      "서명 요청자: 전자화문서에 서명을 요청하는 회원.",
    "term.article2.item7":
      "서명자: 서명 요청자로부터 전자화문서 서명을 요청받거나 서명을 수행하는 이용자.",
    "term.article2.item8":
      "유료서비스: 저장 공간 추가, 서명 요청 한도 확대 등 요금을 결제한 후 이용할 수 있는 서비스 기능.",
    "term.article2.item9":
      "운영자: 본 서비스를 제공하는 자.",

    "term.article3.title": "제3조 (약관의 게시와 개정)",
    "term.article3.para1":
      "운영자는 본 약관의 내용과 사업자 정보를 회원이 쉽게 알 수 있도록 서비스 초기 화면 또는 별도의 연결화면에 게시합니다.",
    "term.article3.para2":
      "운영자는 관련 법령(개인정보 보호법, 전자문서 및 전자거래 기본법, 전자서명법, 전자상거래법 등)을 위반하지 않는 범위에서 본 약관을 개정할 수 있습니다.",
    "term.article3.para3":
      "운영자가 약관을 개정할 경우 적용일자와 개정 사유를 명시하여 현행 약관과 함께 적용일 7일 전부터 공지하며, 회원에게 불리하거나 중요한 변경사항은 적용일 30일 전부터 서비스 내 공지 또는 전자우편으로 알립니다.",
    "term.article3.para4":
      "회원이 개정 약관에 동의하지 않는 경우 서비스 이용을 중단하고 탈퇴할 수 있으며, 별도 거부 의사 표시 없이 서비스를 계속 이용할 경우 개정 약관에 동의한 것으로 간주합니다.",

    "term.article4.title": "제4조 (사업자 정보 및 약관의 해석)",
    "term.article4.content":
      "운영자의 사업자 정보는 서비스 하단 또는 약관의 별도 페이지에 게시합니다. 본 약관에 명시되지 않은 사항과 약관의 해석은 전자문서 및 전자거래 기본법, 전자서명법, 개인정보 보호법 등 관계 법령과 개별 운영정책 및 일반적인 상관례를 따르며, 약관과 개별 정책이 상충하는 경우 개별 정책이 우선합니다.",

    // Chapter 2
    "term.chapter2.title": "제2장 서비스 이용 계약",
    "term.article5.title": "제5조 (서비스 이용계약의 성립)",
    "term.article5.para1":
      '서비스 이용계약은 서비스를 이용하고자 하는 자(이하 "가입신청자")가 본 약관과 개인정보 처리방침에 동의하고 회원가입을 신청한 후, 운영자가 이를 승낙함으로써 체결됩니다.',
    "term.article5.para2":
      "가입신청자는 이름, 이메일, 비밀번호 등 운영자가 요구하는 필수 정보를 정확히 입력해야 하며, 타인의 정보를 도용하거나 허위 정보를 입력해서는 안 됩니다.",
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
      "만 14세 미만의 아동은 서비스를 이용할 수 없으며 사실 확인 시 법정대리인의 확인 후 즉시 회원 탈퇴 처리합니다. 14세 이상 미성년자가 유료서비스를 이용하려면 법정대리인의 동의를 받아야 하며, 관련 절차는 운영자가 별도로 안내합니다.",

    "term.article6.title": "제6조 (이용자 정보의 제공)",
    "term.article6.para1":
      "회원은 서비스 이용에 필요한 정보를 정확히 제공해야 하며, 다른 사람의 정보나 허위 정보를 사용할 경우 서비스 이용이 제한될 수 있습니다.",
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
      "운영자는 회원의 개인정보를 적법한 절차와 방법으로 수집·이용하며, 회원의 동의 없이 제3자에게 제공하지 않고 필요한 경우 법령이 정한 절차에 따라 동의를 받습니다.",

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
      "운영자는 회원 가입이 완료된 때부터 서비스를 제공합니다. 다만, 일부 기능은 별도의 신청 또는 결제 절차를 완료한 이후 제공될 수 있습니다.",
    "term.article10.para2":
      "서비스의 범위에는 전자화문서 생성·변환, 전송, 서명 데이터화, 서명 완료 문서의 안전한 보관 및 열람 기능이 포함됩니다.",
    "term.article10.para3":
      "서비스는 관계 법령과 본 약관이 정한 범위 내에서 무상으로 제공되며, 운영자는 안정적인 제공을 위해 설비를 점검·보수·교체할 수 있습니다. 운영자는 전자화문서와 서명 데이터의 기술적 중개자로서 서명 당사자 간 계약의 적법성·진정성·유효성을 보증하지 않습니다. 전자문서 및 전자거래 기본법에 따라 요건을 갖춘 전자화문서는 종이 문서와 동일한 효력을 가지며, 서비스는 문서를 안전한 포맷으로 저장해 동일한 형태로 열람할 수 있도록 지원합니다. 다만 공인전자서명, 공증 등 추가 요건이 필요한 경우 해당 요건을 충족할 책임은 이용자에게 있습니다.",

    "term.article11.title": "제11조 (서비스 내용의 변경)",
    "term.article11.para1":
      "운영자는 서비스의 내용(기능, UI 등)을 추가·변경·삭제할 수 있습니다. 무료로 제공되는 서비스의 전부 또는 일부를 운영상의 필요에 따라 변경하거나 중단할 수 있습니다.",
    "term.article11.para2":
      "서비스 변경으로 회원에게 불리한 사항이 있는 경우 운영자는 변경 내용과 사유를 사전에 공지하며, 회원은 변경된 서비스에 동의하지 않는 경우 이용계약을 해지할 수 있습니다.",
    "term.article11.para3":
      "유료서비스 변경 또는 중단으로 회원에게 손해가 발생하는 경우 운영자는 관련 법령이 정하는 범위 내에서 적절한 보상을 제공합니다.",

    "term.article12.title": "제12조 (정보의 제공 및 광고의 게재)",
    "term.article12.para1":
      "운영자는 서비스 운영에 필요한 각종 정보를 서비스 화면이나 이메일 등을 통해 회원에게 제공할 수 있으며, 법령상 고지 의무가 있는 정보를 제외하고 회원은 수신을 거절할 수 있습니다.",
    "term.article12.para2":
      "운영자는 서비스 화면, 이메일, 푸시 알림 등에 광고를 게재할 수 있으며, 회원은 서비스 이용 시 광고 노출에 동의하는 것으로 봅니다.",
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
      "회원이 본 약관을 위반하거나 서비스 운영을 방해하는 행위를 하는 경우 운영자는 사전 통지 후 서비스 이용을 경고, 제한 또는 중지할 수 있으며, 긴급한 사유가 있는 경우에는 사후 통지할 수 있습니다.",
    "term.article14.para4":
      "운영자가 이용계약을 해지하는 경우 운영자는 회원에게 해지 사유를 밝혀 통지하며, 회원은 통지일로부터 7일 이내에 이의를 제기할 수 있습니다.",

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
    "term.chapter4.title": "제4장 유료서비스",
    "term.chapter4.intro": "유료 서비스 이용 시 다음 규정이 적용됩니다.",

    "term.article16.title": "제16조 (유료서비스 이용 계약 및 요금제)",
    "term.article16.para1":
      "유료서비스 이용계약은 회원이 유료서비스를 신청하고 운영자가 승낙함으로써 성립합니다.",
    "term.article16.para2":
      "유료서비스의 종류, 이용 요금, 결제 방법, 환불 기준 등은 별도의 이용안내나 운영정책에 따르며, 운영자는 유료서비스의 내용을 변경하거나 종료할 수 있습니다.",
    "term.article16.para3":
      "회원은 유료서비스 이용에 필요한 대금을 신용카드, 계좌이체 등 운영자가 정한 방법으로 결제해야 합니다.",

    "term.article17.title": "제17조 (청약 철회 및 환불)",
    "term.article17.para1":
      "회원은 유료서비스 결제일 또는 제공 개시일로부터 7일 이내이며 서비스를 전혀 이용하지 않은 경우 청약 철회 및 환불을 요청할 수 있습니다.",
    "term.article17.para2":
      "구매 즉시 이용되거나 가치를 소비하는 디지털 콘텐츠 사용, 프로모션으로 무상 제공된 혜택의 사용, 전자상거래법 등 관련 법령에서 정한 제한 사유가 있는 경우에는 청약 철회가 제한될 수 있습니다.",
    "term.article17.para3":
      "환불이 필요한 경우 회원은 결제/구독 페이지에서 구독을 해지한 후 cs.seuk.seuk@gmail.com 등 운영자가 지정한 채널로 환불을 요청해야 하며, 운영자는 신청일로부터 영업일 기준 3일 이내에 환불 가능 여부를 안내합니다.",
    "term.article17.para4":
      "회원이 서비스를 일부 사용한 경우 사용 일수 또는 이용량을 기준으로 차감한 후 잔여 금액을 환불할 수 있으며, 구체적인 산정 기준은 운영정책에서 정합니다.",

    "term.article18.title": "제18조 (유료서비스 내용 변경 및 서비스 중지)",
    "term.article18.para1":
      "운영자는 운영상·기술상 필요에 따라 유료서비스의 내용(가격, 제공 수량 등)을 변경할 수 있으며, 변경 사항은 적용일 7일 전(회원에게 불리한 경우 30일 전) 유료회원에게 공지합니다.",
    "term.article18.para2":
      "유료서비스의 중지나 종료가 발생하는 경우 운영자는 중지 또는 종료 사유와 보상 방안을 사전에 통지하며, 회원은 공지된 내용에 따라 적절한 조치를 취할 수 있습니다.",

    // Chapter 5
    "term.chapter5.title": "제5장 손해배상 및 면책조항",
    "term.article19.title": "제19조 (손해배상)",
    "term.article19.para1":
      "운영자가 제공하는 유료서비스의 하자 등으로 회원에게 손해가 발생한 경우 운영자는 관련 법령이 정하는 범위 내에서 손해를 배상합니다.",
    "term.article19.para2":
      "회원이 본 약관 및 관계 법령을 위반하여 운영자에 손해가 발생한 경우 회원은 운영자가 입은 모든 손해를 배상해야 합니다.",

    "term.article20.title": "제20조 (책임의 한계)",
    "term.article20.para1":
      "운영자는 전자화문서 전달·서명 데이터화·저장 기능을 제공하는 기술적 중개자로서, 회원 간 체결된 계약의 내용, 적법성, 진정성, 유효성에 대하여 보증하거나 책임을 지지 않습니다.",
    "term.article20.para2":
      "운영자는 천재지변, 정전, 서버나 네트워크 장애, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.",
    "term.article20.para3":
      "운영자는 회원의 귀책사유로 발생한 서비스 이용 장애나 회원이 서비스를 통해 전송·게시한 정보의 신뢰도 및 정확성, 제3자 서비스와의 연동 과정에서 발생한 문제에 대해 책임을 지지 않습니다. 다만, 운영자의 고의 또는 중대한 과실이 있는 경우에는 예외로 합니다.",

    // Chapter 6
    "term.chapter6.title": "제6장 기타",
    "term.article21.title": "제21조 (준거법 및 재판관할)",
    "term.article21.para1":
      "본 약관과 서비스 이용에 관한 분쟁에는 대한민국 법을 적용합니다.",
    "term.article21.para2":
      "서비스 이용과 관련하여 운영자와 회원 사이에 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 성실히 협의합니다. 협의가 이루어지지 않을 경우 민사소송법상의 관할법원에 소를 제기할 수 있습니다.",

    "term.article23.title": "제22조 (개인정보 처리방침)",
    "term.article23.content":
      "개인정보의 수집·이용·제공·파기 등 처리에 관한 사항은 별도로 게시하는 개인정보처리방침에 따르며, 본 약관과 개인정보처리방침이 상충할 경우 개인정보처리방침이 우선합니다.",

    "term.article24.title": "제23조 (약관의 효력)",
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

    // My Page
    "mypage.title": "마이페이지",
    "mypage.profile.title": "프로필 정보",
    "mypage.profile.email": "이메일",
    "mypage.profile.name": "이름",
    "mypage.profile.joinedAt": "가입일",
    "mypage.subscription.title": "구독 정보",
    "mypage.subscription.plan": "플랜",
    "mypage.subscription.status": "상태",
    "mypage.subscription.startsAt": "시작일",
    "mypage.subscription.endsAt": "종료일",
    "mypage.subscription.documentsLimit": "문서 제한",
    "mypage.subscription.unlimited": "무제한",

    // Plan Names
    "plan.Basic": "베이직",
    "plan.Starter": "스타터",
    "plan.Pro": "프로",
    "plan.Enterprise": "엔터프라이즈",
    "mypage.usage.title": "사용량 현황",
    "mypage.usage.thisMonth": "이번 달",
    "mypage.usage.documents": "문서",
    "mypage.usage.activeDocuments": "활성 문서",
    "mypage.dangerZone.title": "위험 구역",
    "mypage.dangerZone.deleteAccount": "회원 탈퇴",
    "mypage.dangerZone.deleteWarning":
      "계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.",
    "mypage.dangerZone.deleteDescription":
      "회원 탈퇴 시 업로드한 모든 문서, 서명, 구독 정보가 즉시 삭제되며 복구할 수 없습니다. 이 작업은 되돌릴 수 없으니 신중하게 결정해주세요.",
    "mypage.dangerZone.confirmEmail": "계속하려면 이메일 주소를 입력하세요",
    "mypage.dangerZone.emailPlaceholder": "이메일 주소 입력",
    "mypage.dangerZone.confirmDelete": "계정 삭제",
    "mypage.dangerZone.deleting": "삭제 중...",
    "mypage.dangerZone.emailMismatch": "이메일 주소가 일치하지 않습니다.",
    "mypage.dangerZone.deleteSuccess": "계정이 성공적으로 삭제되었습니다.",
    "mypage.dangerZone.deleteError": "계정 삭제 중 오류가 발생했습니다.",
    "mypage.error.loadProfile": "프로필 정보를 불러올 수 없습니다.",
    "mypage.error.loadSubscription": "구독 정보를 불러올 수 없습니다.",
    "mypage.error.loadUsage": "사용량 정보를 불러올 수 없습니다.",

    // Credit System
    "pricing.credit.title": "추가문서 구매",
    "pricing.credit.description": "월 한도 초과 시 필요한 만큼만 구매하세요",
    "pricing.credit.name": "추가문서",
    "pricing.credit.unit": "1개 = 생성 1개 + 발행 1개",
    "pricing.credit.per": "개",
    "pricing.credit.quantity": "수량",
    "pricing.credit.quantityRange": "(최소 5개 ~ 최대 20개)",
    "pricing.credit.total": "총 금액",
    "pricing.credit.receive": "받는 추가문서",
    "pricing.credit.breakdown": "생성 {{count}}개 + 발행 {{count}}개",
    "pricing.credit.purchase": "추가문서 구매하기",

    // Dashboard Credit
    "dashboard.creditBalance": "+{{count}}개 보유",
    "dashboard.monthlyLimitReached": "월 문서 생성 한도 도달",
    "dashboard.rechargePrompt": "추가문서 구매하기 →",

    // Usage Widget Credit
    "usage.credit.unit": "개",
    "usage.credit.recharge": "추가문서 구매",
    "usage.credit.available": "추가문서로 생성 가능",
    "usage.credit.publishAvailable": "추가문서로 발행 가능",
    "usage.credit.needMore": "추가 문서가 필요하신가요?",
    "usage.credit.purchaseDesc": "추가문서를 구매하여 더 많이 이용하세요",

    // Checkout Credit
    "checkout.credit.title": "추가문서 구매",
    "checkout.credit.back": "요금제 페이지로 돌아가기",
    "checkout.credit.quantity": "수량",
    "checkout.credit.unitPrice": "단가",
    "checkout.credit.discount": "할인",
    "checkout.credit.total": "총 금액",
    "checkout.credit.receive": "받게 될 추가문서",
    "checkout.credit.breakdown": "문서 생성 {{count}}개 + 문서 발행 {{count}}개",
    "checkout.credit.pay": "결제하기",
    "checkout.credit.loading": "로딩 중...",

    // My Page Credit
    "mypage.creditTitle": "보유 추가문서",
    "mypage.creditDescription": "구매한 추가문서 현황",
    "mypage.createAvailable": "생성 가능",
    "mypage.publishAvailable": "발행 가능",
    "mypage.rechargeButton": "추가문서 구매",
    "mypage.creditPurchaseHint": "추가문서 구매",
    "mypage.countUnit": "개",
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
    "upload.save": "Save",
    "upload.saving": "Saving...",
    "upload.filename": "File Name",
    "upload.alias": "Document Name",
    "upload.aliasOptional": "Optional",
    "upload.aliasPlaceholder": "Enter a document name (e.g., Contract, Meeting Notes)",
    "upload.aliasDescription": "You can specify an alias to easily identify the document. If not provided, the file name will be displayed.",

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
      "Your document has been successfully signed and securely saved. If you need the signed document, please contact the document issuer.",

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
    "pricing.free.name": "Basic",
    "pricing.free.description": "Free plan for individual users",
    "pricing.basic.name": "Basic",
    "pricing.basic.description": "Basic plan for individual users",
    "pricing.free.price": "Free",
    "pricing.free.cta": "Get Started",
    "pricing.basic.cta": "Get Started",
    "pricing.starter.name": "Starter",
    "pricing.starter.description": "For individuals and small teams",
    "pricing.starter.cta": "Get Started",
    "pricing.pro.name": "Pro",
    "pricing.pro.description": "For professionals and small teams",
    "pricing.pro.freeTrial": "30-Day Free Trial",
    "pricing.pro.cta": "Go Pro",
    "pricing.popular": "Popular",
    "pricing.perMonth": "/month",
    "pricing.perYear": "/year",
    "pricing.billing.monthly": "monthly",
    "pricing.billing.yearly": "yearly",
    // Pricing limits (dynamic count)
    "pricing.limitPerMonth": "Up to {{count}} documents charged per month",
    "pricing.limitUnlimitedPerMonth": "Unlimited documents per month",

    // Pricing Page Specific Keys
    "pricingPage.title": "Choose Your Plan",
    "pricingPage.description":
      "Select a plan that fits your needs and unlock more features",
    "pricingPage.currentPlan": "Currently using {{planName}} plan",
    "pricingPage.popular": "Popular",
    "pricingPage.currentBadge": "Current Plan",
    "pricingPage.free": "Free",
    "pricingPage.contact": "Contact Us",
    "pricingPage.perMonth": "/month",
    "pricingPage.perYear": "/year",
    "pricingPage.unlimited": "Unlimited",
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
    "pricingPage.plans.basic.description": "Basic plan for individual users",
    "pricingPage.plans.starter.description": "For individuals and small teams",
    "pricingPage.plans.pro.description": "Enhanced features for professionals",

    // Checkout Page
    "checkout.backButton": "Go Back",
    "checkout.paymentDetails": "Payment details",
    "checkout.orderSummary": "Order summary",
    "checkout.subtotal": "Subtotal",
    "checkout.tax": "Tax",
    "checkout.dueToday": "Due today",
    "checkout.then": "then",
    "checkout.incTax": "inc. tax",
    "checkout.billing.daily": "daily",
    "checkout.billing.weekly": "weekly",
    "checkout.billing.monthly": "monthly",
    "checkout.billing.yearly": "yearly",
    "checkout.billing.days": "days",
    "checkout.billing.weeks": "weeks",
    "checkout.billing.months": "months",
    "checkout.billing.years": "years",
    "checkout.billing.every": "every",

    // Checkout Success
    "checkout.success.title": "Payment Successful!",
    "checkout.success.message":
      "Thank you for subscribing. Your payment has been processed successfully.",
    "checkout.success.emailInfo":
      "You will receive a confirmation email shortly with your subscription details.",
    "checkout.success.dashboard": "Go to Dashboard",

    "home.cta.title": "Have Questions?",
    "home.cta.description":
      "Our team is here to help. Feel free to reach out anytime.",
    "home.cta.button": "Contact Us",
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

    // Register Success
    "register.success.title": "Registration Complete!",
    "register.success.subtitle": "Email Verification",
    "register.success.emailSent": "Verification email has been sent",
    "register.success.description":
      "A verification email has been sent to your registered email address. Please check your email to activate your account.",
    "register.success.checkSpam":
      "If you don't see the email, please check your spam folder.",
    "register.success.goToLogin": "Go to Login",

    // Consent Page
    "consent.title": "Please accept our terms to continue",
    "consent.subtitle":
      "Even after signing in with Kakao, you need to agree to the SeukSeuk Terms of Service and Privacy Policy before using the service.",
    "consent.linksDescription": "Review the documents below and choose how you’d like to proceed.",
    "consent.viewTerms": "View Terms of Service",
    "consent.viewPrivacy": "View Privacy Policy",
    "consent.checkbox": "I have read and agree to the SeukSeuk Terms of Service and Privacy Policy.",
    "consent.agreeButton": "Agree and continue",
    "consent.declineNotice":
      "You won’t be able to use the service unless you agree. If you choose not to agree, you’ll be signed out.",
    "consent.declineButton": "Sign out without agreeing",
    "consent.error": "We couldn’t record your consent. Please try again.",

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
      "This document has already been signed and submitted. If you need the signed document, please contact the document issuer.",
    "sign.completed.noEdit": "No further changes can be made.",
    "sign.completed.status": "Signature Completed",
    "sign.expired.title": "Signature Period Expired",
    "sign.expired.message":
      "Sorry, the signing period for this document has expired.",
    "sign.expired.instruction":
      "Please contact the document issuer to request a new signature request.",
    "sign.expired.date": "Expired on:",
    "sign.savingSignature": "Saving signature...",
    "sign.documentList.title": "Documents to Sign",
    "sign.documentList.description": "Select a document below to start signing",
    "sign.documentList.signaturesCompleted": "{{completed}}/{{total}} signatures completed",
    "sign.documentList.allSigned": "All signatures completed",
    "sign.documentList.startSigning": "Start Signing",
    "sign.documentList.continueSign": "Continue Signing",
    "sign.documentList.viewDocument": "View Document",
    "sign.documentList.backToList": "Back to Document List",

    // Authentication
    "auth.signOut": "Sign Out",
    "auth.signingOut": "Signing out...",

    // Dashboard
    "dashboard.title": "My Documents",
    "dashboard.description": "You are managing a total of {{total}} documents.",
    "dashboard.header.title": "My Documents",
    "dashboard.header.description":
      "Manage your documents and collect signatures",
    "dashboard.publish": "Publish",
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
    "dashboard.tabs.documents": "Documents",
    "dashboard.tabs.publications": "Publications",
    "dashboard.publications.empty.title": "No Published Documents",
    "dashboard.publications.empty.description": "Publish draft documents to share with others.",
    "dashboard.publications.empty.action": "Publish Documents",
    "dashboard.publications.status.active": "Active",
    "dashboard.publications.status.completed": "Completed",
    "dashboard.publications.status.expired": "Expired",
    "dashboard.publications.card.documentCount": " documents",
    "dashboard.publications.card.copied": "Copied",
    "dashboard.publications.card.copyLink": "Link",
    "dashboard.publications.card.cannotDelete": "Cannot delete completed publications",
    "dashboard.publications.delete.title": "Delete Publication",
    "dashboard.publications.delete.description": "Are you sure you want to delete \"{name}\"?",
    "dashboard.publications.delete.warning": "All documents in this publication will return to draft status.",
    "dashboard.publications.delete.cancel": "Cancel",
    "dashboard.publications.delete.confirm": "Delete",
    "dashboard.publications.delete.deleting": "Deleting...",
    "dashboard.publications.bulkDelete.cannotDelete": "Cannot delete non-completed publications",
    "dashboard.publications.bulkDelete.successMessage": "{{count}} publication(s) deleted successfully",
    "dashboard.publications.bulkDelete.errorMessage": "Failed to delete {{count}} publication(s): {{details}}",
    "dashboard.bulkDelete.selected": "{{count}} selected",
    "dashboard.bulkDelete.selectAll": "Select All",
    "dashboard.bulkDelete.deselectAll": "Deselect All",
    "dashboard.bulkDelete.deleteSelected": "Delete Selected",
    "dashboard.bulkDelete.deleting": "Deleting...",
    "dashboard.bulkDelete.select": "Select",
    "dashboard.bulkDelete.deselect": "Deselect",
    "dashboard.bulkDelete.cannotDelete": "Published documents cannot be deleted",
    "dashboard.bulkDelete.modalTitle": "Bulk Delete Documents",
    "dashboard.bulkDelete.modalWarning": "Are you sure you want to delete the following documents?",
    "dashboard.bulkDelete.andMore": "and {{count}} more",
    "dashboard.bulkDelete.draftWarning": "{{count}} draft document(s) will be permanently deleted",
    "dashboard.bulkDelete.completedWarning": "{{count}} completed document(s) will be archived",
    "dashboard.bulkDelete.irreversible": "This action cannot be undone.",
    "dashboard.bulkDelete.cancel": "Cancel",
    "dashboard.bulkDelete.confirmDelete": "Delete",
    "dashboard.bulkDelete.successMessage": "{{count}} document(s) deleted successfully",
    "dashboard.bulkDelete.errorMessage": "Failed to delete {{count}} document(s): {{details}}",

    // Selection Mode
    "dashboard.selectionMode.enter": "Select",
    "dashboard.selectionMode.exit": "Exit Selection Mode",

    // Bills
    "bills.title": "Billing & Subscriptions",
    "bills.description": "Manage your subscriptions and payment history",
    "bills.subscriptions": "Subscriptions",
    "bills.payments": "Payment History",
    "bills.startedOn": "Started on:",
    "bills.nextPayment": "Next Payment",
    "bills.subscriptionEnds": "Subscription ends",
    "bills.nextPaymentInfo": "Next Payment Info",
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
    "bills.cancel.endsOn": "Subscription ends on:",
    "bills.noSubscription.title": "No active subscription",
    "bills.noSubscription.description":
      "Subscribe to a premium plan to unlock more features",
    "bills.noSubscription.action": "View Plans",
    "bills.noTransactions": "No payment history available",
    "bills.paymentMethod": "Payment Method",
    "bills.card.update": "Update card",
    "bills.card.updating": "Updating...",
    "bills.noUpcomingPayment": "No upcoming payment",
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
    "table.actions": "Actions",
    "table.moreCount": "+{{count}} more",
    "table.pageOf": "Page {{current}} of {{total}}",
    "bills.error.loadSubscriptions": "Failed to load subscriptions",
    "bills.error.loadTransactions": "Failed to load transactions",
    "bills.error.loadSubscriptionDetail": "Failed to load subscription details",
    "bills.error.downloadInvoice": "Failed to download invoice",

    // Document Status
    "status.draft": "Draft",
    "status.published": "Published",
    "status.completed": "Completed",
    "status.active": "Active",
    "status.paid": "Paid",
    "status.trialing": "Trialing",
    "status.ready": "Ready",
    "status.canceled": "Canceled",
    "status.expired": "Expired",
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
    "usage.active.title": "Active Documents\n(Published + Completed)",
    "usage.active.limit.reached": "Active document limit reached",
    "usage.plan.free": "Basic",
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
    "breadcrumb.publish": "Publish Document",
    "breadcrumb.publicationDetail": "Publication Details",
    "breadcrumb.details": "Document Details",
    "breadcrumb.sign": "Sign",
    "breadcrumb.signDocument": "Sign Document",

    // Publication Detail
    "publicationDetail.header.title": "Publication Details",
    "publicationDetail.header.description":
      "View detailed information and signature progress for published documents.",
    "publicationDetail.status.active": "Active",
    "publicationDetail.status.completed": "Completed",
    "publicationDetail.status.expired": "Expired",
    "publicationDetail.status.unknown": "Unknown",
    "publicationDetail.createdAt": "Created",
    "publicationDetail.expiresAt": "Expires",
    "publicationDetail.password": "Password",
    "publicationDetail.passwordSet": "Set",
    "publicationDetail.passwordNotSet": "Not Set",
    "publicationDetail.documentCount": "Document Count",
    "publicationDetail.countUnit": " documents",
    "publicationDetail.signatureLink": "Signature Link",
    "publicationDetail.copyLink": "Copy Link",
    "publicationDetail.openInNewTab": "Open in New Tab",
    "publicationDetail.shareLinkDescription":
      "Share this link with signers. They can access and sign documents through this link.",
    "publicationDetail.documentsList": "Documents List",
    "publicationDetail.signatures": "Signatures",
    "publicationDetail.documentStatus.completed": "Completed",
    "publicationDetail.documentStatus.published": "Published",
    "publicationDetail.noDocuments": "No documents available.",
    "publicationDetail.edit": "Edit",
    "publicationDetail.editTitle": "Edit Publication",
    "publicationDetail.editDescription":
      "Update publication name, expiration date, and password.",
    "publicationDetail.editName": "Publication Name",
    "publicationDetail.editExpiresAt": "Expiration Date",
    "publicationDetail.editExpiresAtHint": "Leave empty for no expiration.",
    "publicationDetail.editPassword": "Password",
    "publicationDetail.updatePassword": "Change Password",
    "publicationDetail.cancelPasswordUpdate": "Cancel",
    "publicationDetail.editPasswordPlaceholder": "New password (leave empty for no password)",
    "publicationDetail.editPasswordHint":
      "Enter a password to overwrite the existing one. Leave empty to remove password protection.",
    "publicationDetail.cancel": "Cancel",
    "publicationDetail.save": "Save",
    "publicationDetail.saving": "Saving...",
    "publicationDetail.cannotEditCompleted": "Cannot edit completed publications",

    // Document Detail
    "documentDetail.edit": "Edit",
    "documentDetail.publish": "Publish",
    "documentDetail.delete": "Delete",
    "documentDetail.download": "Download",
    "documentDetail.cancel": "Cancel",
    "documentDetail.addArea": "Add Area",
    "documentDetail.save": "Save",
    "documentDetail.saving": "Saving",
    "documentDetail.loading": "Loading document...",
    "documentDetail.signatureArea": "Signature area",
    "documentDetail.errorUpdateArea": "Failed to update signature area",
    "documentDetail.errorDownload": "Failed to download document.",
    "documentDetail.errorDelete": "Failed to delete document",

    // Publish Page
    "publish.title": "Publish Documents",
    "publish.errorName": "Please enter a publication name.",
    "publish.errorPassword": "Please enter a password.",
    "publish.errorExpiration": "Please select an expiration date.",
    "publish.errorDocuments": "Please select at least one document.",
    "publish.errorPublishing": "An error occurred while publishing.",
    "publish.name": "Publication Name",
    "publish.namePlaceholder": "e.g., Q1 2024 Contracts",
    "publish.password": "Password",
    "publish.passwordPlaceholder": "Required password to access signature page",
    "publish.expiration": "Expiration Date",
    "publish.expirationPlaceholder": "Select signature expiration date",
    "publish.expirationHint": "Signers can access documents until this date.",
    "publish.documentSelection": "Select Documents",
    "publish.selectAll": "Select All",
    "publish.deselectAll": "Deselect All",
    "publish.cancel": "Cancel",
    "publish.submit": "Publish",
    "publish.submitting": "Publishing...",
    "publish.noDrafts": "No draft documents available to publish.",
    "publish.uploadDocument": "Upload Document",
    "publish.existingPublications": "Existing Publications",

    // Footer
    "footer.terms": "Terms of Service",
    "footer.privacy": "Privacy Policy",

    // Terms of Service Page
    "term.backToHome": "Back to Home",
    "term.title": "SeukSeuk Terms of Service",
    "term.intro":
      'These Terms of Service govern the rights, obligations, responsibilities, and other necessary matters between the operator ("Operator") and members when using the electronic document signing and management services ("Service"), and clarify that properly formed electronic documents have the same legal effect as paper documents under applicable laws.',

    // Chapter 1
    "term.chapter1.title": "Chapter 1: General Provisions",
    "term.article1.title": "Article 1 (Purpose)",
    "term.article1.content":
      "These Terms establish the rights, obligations, responsibilities, and other necessary matters between the Operator and members (or non-members) regarding use of the Service. The Service provides tools to create, deliver, sign, and store electronic documents online and helps ensure that electronic documents meeting legal requirements carry the same legal effect as paper documents.",

    "term.article2.title": "Article 2 (Definition of Terms)",
    "term.article2.item1":
      "Service: A platform provided by the Operator that allows members to digitize paper documents and transmit, request signatures on, store, and view electronic documents.",
    "term.article2.item2":
      "Electronic Document: A document that is scanned or converted from paper, or created electronically, stored in electronic form, and capable of being viewed or reproduced.",
    "term.article2.item3":
      "Signature Data: Signature strokes or signature images generated by members or signers through touch, mouse input, or image uploads.",
    "term.article2.item4":
      "Member: A person who agrees to these Terms and the Privacy Policy and concludes a service agreement.",
    "term.article2.item5":
      "Non-member: A person who uses the Service without registering as a member.",
    "term.article2.item6":
      "Signature Requester: A member who requests signatures on an electronic document.",
    "term.article2.item7":
      "Signer: A user who receives a request to sign an electronic document from a signature requester or provides the signature.",
    "term.article2.item8":
      "Paid Service: Features that can be used after paying a fee, such as added storage or increased signature request limits.",
    "term.article2.item9":
      "Operator: The provider of the Service.",

    "term.article3.title": "Article 3 (Publication and Amendment of Terms)",
    "term.article3.para1":
      "The Operator posts these Terms and business information where members can easily find them on the initial service screen or a linked page.",
    "term.article3.para2":
      "The Operator may amend these Terms to the extent permitted by relevant laws, including the Personal Information Protection Act, the Framework Act on Electronic Documents and Transactions, the Electronic Signature Act, and the Electronic Commerce Act.",
    "term.article3.para3":
      "When the Operator amends the Terms, the effective date and reasons for amendment are announced together with the current Terms at least 7 days in advance, and at least 30 days in advance if the changes are disadvantageous or material to members.",
    "term.article3.para4":
      "If a member does not agree with the amended Terms, they may stop using the Service and withdraw. Continued use of the Service without expressing refusal constitutes consent to the amended Terms.",

    "term.article4.title": "Article 4 (Business Information and Interpretation of Terms)",
    "term.article4.content":
      "The Operator posts its business information at the bottom of the Service or on a dedicated terms page. Matters not specified in these Terms and their interpretation follow applicable laws, operational policies, and general commercial practices, and specific policies take precedence if they conflict with these Terms.",

    // Chapter 2
    "term.chapter2.title": "Chapter 2: Service Use Agreement",
    "term.article5.title": "Article 5 (Formation of Service Use Agreement)",
    "term.article5.para1":
      'A service use agreement is formed when a person wishing to use the Service (hereinafter referred to as the "Applicant") agrees to these Terms and Privacy Policy, applies for membership, and the Operator accepts it.',
    "term.article5.para2":
      "Applicants must accurately enter required information such as name, email, and password, and must not use another person's information or submit false details.",
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
      "Children under 14 cannot use the Service, and if their use is confirmed the account is deleted after guardian confirmation. Minors aged 14 or older must obtain guardian consent to use paid services, and detailed procedures are guided separately by the Operator.",

    "term.article6.title": "Article 6 (Provision of User Information)",
    "term.article6.para1":
      "Members must provide accurate information required for service use, and use may be restricted if false or third-party information is supplied.",
    "term.article6.para2":
      "The Operator may require email verification or social login for identity verification.",
    "term.article6.para3":
      "Members must properly manage their account information (email, password, etc.) and are responsible for any leaks or misuse resulting from negligence.",

    "term.article7.title":
      "Article 7 (Protection and Management of Personal Information)",
    "term.article7.para1":
      "The Operator strives to protect members' personal information in accordance with relevant laws and a separately posted Privacy Policy. Specific details regarding personal information processing shall follow the Privacy Policy.",
    "term.article7.para2":
      "The Operator's responsibility does not apply if members use the signature function through external links other than the official service site.",
    "term.article7.para3":
      "The Operator allows members to download electronic documents after signature completion and may destroy original documents after a certain period. Members must properly back up completed signed documents.",
    "term.article7.para4":
      "The Operator collects and uses personal information lawfully and does not provide it to third parties without consent, unless consent is obtained in accordance with statutory procedures.",

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
      "The Operator provides the Service once membership registration is complete, while certain features may require additional application or payment procedures.",
    "term.article10.para2":
      "The Service encompasses electronic document creation and conversion, transmission to designated signers, signature data capture, and secure storage and viewing of signed documents.",
    "term.article10.para3":
      "The Service is provided free of charge within the scope permitted by law and these Terms, and the Operator may temporarily suspend it for equipment inspection, maintenance, or replacement. The Operator acts as a technical intermediary for electronic documents and signature data and does not guarantee the legality, authenticity, or validity of agreements between members. Electronic documents that satisfy statutory requirements under the Framework Act on Electronic Documents and Transactions have the same legal effect as paper documents, and the Service stores them in secure formats so they can be viewed in the same form as when created. Members are responsible for satisfying any additional requirements such as accredited electronic signatures or notarization required by specific laws or contracts.",

    "term.article11.title": "Article 11 (Changes to Service Content)",
    "term.article11.para1":
      "The Operator may add, change, or delete service content (features, UI, etc.) and may change or discontinue all or part of free services as needed.",
    "term.article11.para2":
      "If changes are unfavorable to members, the Operator announces the details and reasons in advance, and members who do not agree with the changes may terminate the agreement.",
    "term.article11.para3":
      "If changes or discontinuation of paid services cause damages to members, the Operator provides appropriate remedies within the scope permitted by law.",

    "term.article12.title":
      "Article 12 (Provision of Information and Advertisement Placement)",
    "term.article12.para1":
      "The Operator may provide various information necessary for service operation through service screens, email, or other channels. Members may refuse to receive information except where notification is required by law.",
    "term.article12.para2":
      "The Operator may display advertisements on service screens, email, or push notifications, and members are deemed to consent to advertisement exposure when using the Service.",
    "term.article12.para3":
      "The Operator is not responsible for any loss or damage arising from members' participation in advertisements provided by the Operator or third parties.",

    "term.article13.title": "Article 13 (Attribution of Rights)",
    "term.article13.para1":
      "Copyrights and intellectual property rights for the Service and content provided by the Operator belong to the Operator.",
    "term.article13.para2":
      "Members shall not reproduce, transmit, publish, distribute, broadcast, or otherwise use information obtained during the use of the Service or allow third parties to use it without the Operator's prior consent.",

    "term.article14.title":
      "Article 14 (Member's Contract Termination and Suspension of Use)",
    "term.article14.para1":
      "Members may terminate the service agreement at any time through the withdrawal menu, and the Operator processes the request immediately in accordance with relevant laws.",
    "term.article14.para2":
      "When a member withdraws, the Operator may retain the member's information within the scope required by law and the Privacy Policy and destroys it thereafter.",
    "term.article14.para3":
      "If a member violates these Terms or interferes with service operation, the Operator may warn, restrict, or suspend service use after prior notice, or notify afterwards in urgent cases.",
    "term.article14.para4":
      "If the Operator terminates the agreement, it notifies the member of the reason for termination, and the member may raise objections within seven days from the notification date.",

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
      "The following provisions apply when using paid services.",

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
      "Members may request withdrawal and a refund within seven days from the payment date or service commencement date, provided that the service has not been used at all.",
    "term.article17.para2":
      "Withdrawal may be limited when digital content is consumed immediately upon purchase, promotional benefits provided free of charge have been used, or other restrictions under the Electronic Commerce Act and related laws apply.",
    "term.article17.para3":
      "To request a refund, members must cancel the subscription on the subscription/payment page and contact cs.seuk.seuk@gmail.com or another channel designated by the Operator. The Operator confirms eligibility and responds within three business days of the request.",
    "term.article17.para4":
      "If a member has partially used the service, the Operator may deduct fees based on usage period or amount before refunding the remaining balance, in accordance with the operational policy.",

    "term.article18.title":
      "Article 18 (Changes to Paid Service Content and Service Suspension)",
    "term.article18.para1":
      "The Operator may change paid service content (price, quantity provided, etc.) for operational or technical reasons and notifies paid members at least seven days in advance, or thirty days in advance if the change is unfavorable.",
    "term.article18.para2":
      "If a paid service is suspended or terminated, the Operator informs members in advance of the reason and compensation plan so that members can take appropriate action.",

    // Chapter 5
    "term.chapter5.title": "Chapter 5: Damages and Disclaimer",
    "term.article19.title": "Article 19 (Damages)",
    "term.article19.para1":
      "If damages occur to members due to defects in paid services provided by the Operator, the Operator shall compensate for damages within the scope determined by relevant laws.",
    "term.article19.para2":
      "If damages occur to the Operator due to members' violations of these Terms and relevant laws, members must compensate for all damages incurred by the Operator.",

    "term.article20.title": "Article 20 (Limitation of Liability)",
    "term.article20.para1":
      "The Operator provides technical intermediation for delivering electronic documents, capturing signatures, and storing them, and does not guarantee the legality, authenticity, or validity of agreements between members.",
    "term.article20.para2":
      "The Operator is not responsible for service disruption due to force majeure such as natural disasters, power outages, server or network failures, or suspension by telecommunications carriers.",
    "term.article20.para3":
      "The Operator is not responsible for service failures caused by members' negligence, for the reliability or accuracy of information members transmit or post, or for issues arising from integration with third-party services, unless caused by the Operator's willful misconduct or gross negligence.",

    // Chapter 6
    "term.chapter6.title": "Chapter 6: Miscellaneous",
    "term.article21.title": "Article 21 (Governing Law and Jurisdiction)",
    "term.article21.para1":
      "Korean law shall apply to disputes regarding these Terms and service use.",
    "term.article21.para2":
      "If a dispute arises between the Operator and members regarding service use, both parties shall sincerely consult for amicable resolution. If consultation is not reached, lawsuits may be filed with the competent court under the Civil Procedure Act.",

    "term.article23.title": "Article 22 (Privacy Policy)",
    "term.article23.content":
      "Matters concerning the collection, use, provision, and destruction of personal information shall follow the separately posted Privacy Policy, and if these Terms conflict with the Privacy Policy, the Privacy Policy shall take precedence.",

    "term.article24.title": "Article 23 (Effectiveness of Terms)",
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

    // My Page
    "mypage.title": "My Page",
    "mypage.profile.title": "Profile Information",
    "mypage.profile.email": "Email",
    "mypage.profile.name": "Name",
    "mypage.profile.joinedAt": "Joined",
    "mypage.subscription.title": "Subscription",
    "mypage.subscription.plan": "Plan",
    "mypage.subscription.status": "Status",
    "mypage.subscription.startsAt": "Start Date",
    "mypage.subscription.endsAt": "End Date",
    "mypage.subscription.documentsLimit": "Document Limit",
    "mypage.subscription.unlimited": "Unlimited",

    // Plan Names
    "plan.Basic": "Basic",
    "plan.Starter": "Starter",
    "plan.Pro": "Pro",
    "plan.Enterprise": "Enterprise",
    "mypage.usage.title": "Usage",
    "mypage.usage.thisMonth": "This Month",
    "mypage.usage.documents": "Documents",
    "mypage.usage.activeDocuments": "Active Documents",
    "mypage.dangerZone.title": "Danger Zone",
    "mypage.dangerZone.deleteAccount": "Delete Account",
    "mypage.dangerZone.deleteWarning":
      "Deleting your account will permanently delete all your data.",
    "mypage.dangerZone.deleteDescription":
      "When you delete your account, all uploaded documents, signatures, and subscription information will be immediately deleted and cannot be recovered. This action cannot be undone, so please consider carefully.",
    "mypage.dangerZone.confirmEmail": "Enter your email address to continue",
    "mypage.dangerZone.emailPlaceholder": "Enter email address",
    "mypage.dangerZone.confirmDelete": "Delete Account",
    "mypage.dangerZone.deleting": "Deleting...",
    "mypage.dangerZone.emailMismatch": "Email address does not match.",
    "mypage.dangerZone.deleteSuccess": "Account deleted successfully.",
    "mypage.dangerZone.deleteError": "An error occurred while deleting account.",
    "mypage.error.loadProfile": "Failed to load profile information.",
    "mypage.error.loadSubscription": "Failed to load subscription information.",
    "mypage.error.loadUsage": "Failed to load usage information.",

    // Credit System
    "pricing.credit.title": "Additional Documents",
    "pricing.credit.description": "Buy only what you need when you exceed monthly limits",
    "pricing.credit.name": "Additional Documents",
    "pricing.credit.unit": "1 doc = 1 create + 1 publish",
    "pricing.credit.per": "",
    "pricing.credit.quantity": "Quantity",
    "pricing.credit.quantityRange": "(min 5 ~ max 20)",
    "pricing.credit.total": "Total",
    "pricing.credit.receive": "Documents to receive",
    "pricing.credit.breakdown": "Create {{count}} + Publish {{count}}",
    "pricing.credit.purchase": "Purchase",

    // Dashboard Credit
    "dashboard.creditBalance": "+{{count}} available",
    "dashboard.monthlyLimitReached": "Monthly document creation limit reached",
    "dashboard.rechargePrompt": "Recharge credits →",

    // Usage Widget Credit
    "usage.credit.unit": " docs",
    "usage.credit.recharge": "Buy More",
    "usage.credit.available": "Additional creation available",
    "usage.credit.publishAvailable": "Additional publish available",
    "usage.credit.needMore": "Need more documents?",
    "usage.credit.purchaseDesc": "Purchase additional documents to use more",

    // Checkout Credit
    "checkout.credit.title": "Purchase Additional Documents",
    "checkout.credit.back": "Go back",
    "checkout.credit.quantity": "Quantity",
    "checkout.credit.unitPrice": "Unit Price",
    "checkout.credit.discount": "Discount",
    "checkout.credit.total": "Total",
    "checkout.credit.receive": "Documents to receive",
    "checkout.credit.breakdown": "Create {{count}} + Publish {{count}}",
    "checkout.credit.pay": "Pay Now",
    "checkout.credit.loading": "Loading...",

    // My Page Credit
    "mypage.creditTitle": "Additional Docs",
    "mypage.creditDescription": "Purchased additional docs",
    "mypage.createAvailable": "Create Available",
    "mypage.publishAvailable": "Publish Available",
    "mypage.rechargeButton": "Buy More",
    "mypage.creditPurchaseHint": "Buy additional docs",
    "mypage.countUnit": " docs",
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
  // Supports: t(key), t(key, params), t(key, fallback), t(key, fallback, params)
  const t = (
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ): string => {
    let translation: string | undefined = translations[language][key];
    let actualParams: Record<string, string | number> | undefined;

    // Determine fallback and params based on argument types
    if (typeof fallbackOrParams === "string") {
      // t(key, fallback) or t(key, fallback, params)
      if (translation === undefined) {
        translation = fallbackOrParams;
      }
      actualParams = params;
    } else if (typeof fallbackOrParams === "object" && fallbackOrParams !== null) {
      // t(key, params)
      if (translation === undefined) {
        translation = key;
      }
      actualParams = fallbackOrParams;
    } else {
      // t(key)
      if (translation === undefined) {
        translation = key;
      }
    }

    // Replace parameters in the translation string (supports {{param}} format)
    if (actualParams) {
      Object.keys(actualParams).forEach((param) => {
        translation = translation.replace(
          new RegExp(`\\{\\{${param}\\}\\}`, "g"),
          String(actualParams![param])
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
