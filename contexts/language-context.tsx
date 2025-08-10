"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// Define available languages
export type Language = "ko" | "en";

// Define the context type
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number | boolean>) => string;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "ko",
  setLanguage: () => {},
  t: (key, params) => key,
});

// Translation data
const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Header
    "app.title": "DocSign",
    "app.description": "문서를 쉽게 업로드하고, 서명하고, 공유하세요",

    // Document Upload
    "upload.title": "문서 업로드",
    "upload.description": "문서를 드래그 앤 드롭하거나 클릭하여 찾아보기",
    "upload.button": "문서 선택",
    "upload.clear": "지우기",
    "upload.addSignatureArea": "서명 영역 추가",
    "upload.getSignature": "서명 받기",
    "upload.generating": "생성 중...",
    "upload.signature": "서명",
    "upload.supportedFormats": "지원 형식: JPG, PNG, WebP, PDF",
    "upload.maxSize": "최대 50MB",
    "upload.invalidFileType": "지원하지 않는 파일 형식입니다",
    "upload.fileTooLarge": "파일 크기가 너무 큽니다 (최대 50MB)",
    "upload.missingRequiredFields": "제목을 입력해주세요",
    "upload.success": "문서가 성공적으로 업로드되었습니다",
    "upload.failed": "문서 업로드에 실패했습니다",
    "upload.documentTitle": "문서 제목",
    "upload.titlePlaceholder": "문서 제목을 입력하세요",
    "upload.uploadDocument": "문서 업로드",
    "upload.uploading": "업로드 중...",
    "upload.status": "상태",
    "upload.uploadFirst": "먼저 문서를 업로드해주세요",
    "upload.saveAreasFailed": "서명 영역 저장에 실패했습니다",
    "upload.noSignatureAreas": "서명 영역을 추가해주세요",
    "upload.linkGenerated": "서명 링크가 생성되었습니다",
    "upload.linkGenerationFailed": "링크 생성에 실패했습니다",
    "upload.clickToRemove": "클릭하여 제거",
    "upload.documentAlt": "업로드된 문서",
    "upload.saveSignatureAreas": "저장하기",
    "upload.signatureAreasSaved": "서명 영역이 저장되었습니다",
    "upload.areaSelectorInstructions": "클릭 후 드래그하여 서명 영역을 선택하세요",
    "upload.areaSelectorEscHint": "ESC 키 또는 취소 버튼으로 종료할 수 있습니다",
    "upload.cancel": "취소",
    
    // Signature Request
    "signatureRequest.title": "서명 요청 생성",
    "signatureRequest.description": "서명받을 사람들을 지정하고 보안 설정을 구성하세요",
    "signatureRequest.recipients": "서명자 정보",
    "signatureRequest.addRecipient": "서명자 추가",
    "signatureRequest.removeRecipient": "제거",
    "signatureRequest.recipientName": "이름",
    "signatureRequest.recipientEmail": "이메일",
    "signatureRequest.recipientNamePlaceholder": "서명자 이름을 입력하세요",
    "signatureRequest.recipientEmailPlaceholder": "서명자 이메일을 입력하세요",
    "signatureRequest.security": "보안 설정",
    "signatureRequest.enablePassword": "비밀번호 보호 사용",
    "signatureRequest.password": "비밀번호",
    "signatureRequest.passwordPlaceholder": "비밀번호를 입력하세요",
    "signatureRequest.confirmPassword": "비밀번호 확인",
    "signatureRequest.confirmPasswordPlaceholder": "비밀번호를 다시 입력하세요",
    "signatureRequest.expiry": "만료 설정",
    "signatureRequest.expiryDays": "만료 기간 (일)",
    "signatureRequest.expiryDaysPlaceholder": "30",
    "signatureRequest.maxUses": "최대 사용 횟수",
    "signatureRequest.maxUsesPlaceholder": "제한 없음",
    "signatureRequest.generateLink": "서명 링크 생성",
    "signatureRequest.cancel": "취소",
    "signatureRequest.creating": "생성 중...",
    "signatureRequest.validationError": "필수 항목을 모두 입력해주세요",
    "signatureRequest.passwordMismatch": "비밀번호가 일치하지 않습니다",
    "signatureRequest.invalidEmail": "올바른 이메일을 입력해주세요",
    "signatureRequest.success": "서명 요청이 성공적으로 생성되었습니다",
    "signatureRequest.linkCopied": "서명 링크가 클립보드에 복사되었습니다",
    "signatureRequest.linkGenerated": "서명 링크가 생성되었습니다",
    "signatureRequest.error": "서명 요청 생성에 실패했습니다",
    "signatureRequest.assignToArea": "영역에 서명자 지정",
    "signatureRequest.unassigned": "지정되지 않음",

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
    "sign.documentNotFound": "문서를 찾을 수 없습니다",
    "sign.loadError": "문서 로딩 중 오류가 발생했습니다",
    "sign.invalidPassword": "잘못된 비밀번호입니다",
    "sign.passwordRequired": "비밀번호가 필요합니다",
    "sign.passwordRequiredDesc": "이 문서에 접근하려면 비밀번호를 입력해주세요",
    "sign.password": "비밀번호",
    "sign.enterPassword": "비밀번호를 입력하세요",
    "sign.checking": "확인 중...",
    "sign.submit": "확인",
    "sign.alreadySigned": "이미 서명된 영역입니다",
    "sign.signatureSubmitted": "서명이 성공적으로 제출되었습니다",
    "sign.signatureError": "서명 제출 중 오류가 발생했습니다",
    "sign.documentGenerated": "서명된 문서가 생성되었습니다",
    "sign.generationError": "문서 생성 중 오류가 발생했습니다",
    "sign.downloadStarted": "다운로드가 시작되었습니다",
    "sign.downloadError": "다운로드 중 오류가 발생했습니다",
    "sign.progress": "진행 상황: {signed}/{total} 완료",
    "sign.signerName": "서명자 이름",
    "sign.signerNamePlaceholder": "이름을 입력하세요",
    "sign.signerEmail": "서명자 이메일",
    "sign.signerEmailPlaceholder": "이메일을 입력하세요",
    "sign.signedArea": "서명 완료된 영역",
    "sign.signed": "서명됨",
    "sign.downloadDocument": "서명된 문서 다운로드",
    "sign.completionStatus": "서명 진행 상황: {signed}/{total} 영역 완료",
    "sign.documentAlt": "서명할 문서",
    "sign.signedDocumentAlt": "서명 완료된 문서",

    // Signature Modal
    "signature.title": "서명 추가",
    "signature.instruction": "위에 마우스나 손가락으로 서명을 그리세요",
    "signature.clear": "지우기",
    "signature.sign": "문서 서명",
    "signature.submitting": "제출 중...",

    // Language Selector
    "language.ko": "한국어",
    "language.en": "English",

    // Dashboard
    "dashboard.title": "문서 관리",
    "dashboard.description": "문서를 업로드하고 서명 영역을 지정하세요",
    "dashboard.backToHome": "홈으로 돌아가기",
    "dashboard.loading": "로딩 중...",
    "dashboard.welcome": "안녕하세요, {name}님!",
    "dashboard.profile": "프로필",
    "dashboard.settings": "설정",
    "dashboard.signOut": "로그아웃",
    
    // Dashboard Filters & Actions
    "dashboard.searchPlaceholder": "문서 제목이나 파일명으로 검색...",
    "dashboard.activeFilters": "활성 필터",
    "dashboard.search": "검색",
    "dashboard.filters.all": "전체",
    "dashboard.filters.draft": "초안",
    "dashboard.filters.published": "진행중",
    "dashboard.filters.completed": "완료",
    "dashboard.filters.expired": "만료",
    "dashboard.sort.createdAt": "생성일",
    "dashboard.sort.updatedAt": "수정일",
    "dashboard.sort.title": "제목",
    "dashboard.sort.status": "상태",
    "dashboard.sort.ascending": "오름차순",
    "dashboard.sort.descending": "내림차순",
    
    // Document Status
    "dashboard.status.draft": "초안",
    "dashboard.status.published": "진행중",
    "dashboard.status.completed": "완료",
    "dashboard.status.expired": "만료",
    "dashboard.shared": "공유됨",
    
    // Document Actions
    "dashboard.actions.view": "보기",
    "dashboard.actions.edit": "편집",
    "dashboard.actions.share": "공유",
    "dashboard.actions.delete": "삭제",
    "dashboard.actions.download": "다운로드",
    
    // Document Info
    "dashboard.signatureProgress": "서명 진행률",
    "dashboard.signaturesRemaining": "{count}개 서명 대기",
    "dashboard.created": "생성",
    "dashboard.updated": "수정",
    "dashboard.lastAccessed": "최근 접근",
    
    // Document List
    "dashboard.documentsCount": "{count}개 문서",
    "dashboard.searchResultsCount": "'{query}' 검색 결과: {count}개",
    
    // Empty States
    "dashboard.noDocuments": "문서가 없습니다",
    "dashboard.noDocumentsDescription": "첫 번째 문서를 업로드하여 서명 프로세스를 시작하세요.",
    "dashboard.createFirstDocument": "첫 문서 만들기",
    "dashboard.noDraftDocuments": "초안 문서가 없습니다",
    "dashboard.noDraftDocumentsDescription": "새 문서를 만들어 작업을 시작하세요.",
    "dashboard.createNewDocument": "새 문서 만들기",
    "dashboard.noPublishedDocuments": "진행 중인 문서가 없습니다",
    "dashboard.noPublishedDocumentsDescription": "서명 요청을 보낸 문서가 여기에 표시됩니다.",
    "dashboard.noCompletedDocuments": "완료된 문서가 없습니다",
    "dashboard.noCompletedDocumentsDescription": "모든 서명이 완료된 문서가 여기에 표시됩니다.",
    "dashboard.noExpiredDocuments": "만료된 문서가 없습니다",
    "dashboard.noExpiredDocumentsDescription": "만료된 문서가 여기에 표시됩니다.",
    "dashboard.noSearchResults": "검색 결과가 없습니다",
    "dashboard.noSearchResultsDescription": "'{query}'에 대한 검색 결과를 찾을 수 없습니다.",
    "dashboard.clearSearch": "검색 초기화",
    
    // Delete Dialog
    "dashboard.deleteDialog.title": "문서를 삭제하시겠습니까?",
    "dashboard.deleteDialog.description": "'{title}' 문서와 관련된 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.",
    "dashboard.deleteDialog.cancel": "취소",
    "dashboard.deleteDialog.confirm": "삭제",
    
    // Dashboard Navigation
    "dashboard.myDocuments": "내 문서",
    "dashboard.newDocument": "새 문서",
    "dashboard.deleting": "삭제 중...",
    "dashboard.deleteSuccess": "문서가 성공적으로 삭제되었습니다",
    "dashboard.deleteError": "문서 삭제에 실패했습니다",
    "dashboard.loadError": "문서 목록을 불러오는데 실패했습니다",

    // Signer Onboarding
    "signer.onboarding.title": "서명 가이드",
    "signer.onboarding.subtitle": '"{title}" 문서의 서명 과정을 안내해드립니다',
    "signer.onboarding.step1.title": "문서 검토",
    "signer.onboarding.step1.description": "먼저 문서 내용을 확인하세요",
    "signer.onboarding.step1.detail": "서명이 필요한 영역이 빨간색으로 표시됩니다",
    "signer.onboarding.step2.title": "서명하기",
    "signer.onboarding.step2.description": "총 {count}개 영역에 서명해주세요",
    "signer.onboarding.step2.detail": "빨간색 영역을 클릭하면 서명 패드가 열립니다",
    "signer.onboarding.step3.title": "제출하기",
    "signer.onboarding.step3.description": "모든 서명 완료 후 문서를 제출합니다",
    "signer.onboarding.step3.detail": "제출 후에는 문서를 다시 수정할 수 없습니다",
    "signer.onboarding.skipGuide": "가이드 건너뛰기",
    "signer.onboarding.startSigning": "서명 시작",

    // Submit Document
    "submit.confirmTitle": "문서 제출 확인",
    "submit.confirmDescription": '"{title}" 문서를 제출하시겠습니까?',
    "submit.signatureStatus": "서명 상태",
    "submit.completed": "완료",
    "submit.incompleteWarning": "아직 서명이 완료되지 않았습니다",
    "submit.incompleteWarningDetail": "일부 영역에 서명하지 않은 상태로 제출하시겠습니까?",
    "submit.finalWarning": "제출 후 수정 불가",
    "submit.finalWarningDetail": "문서를 제출하면 더 이상 수정할 수 없습니다. 신중히 결정해 주세요.",
    "submit.submitting": "제출 중...",
    "submit.confirm": "제출하기",
    "submit.success": "문서가 성공적으로 제출되었습니다",
    "submit.error": "문서 제출에 실패했습니다",
    "submit.document": "문서 제출",
    "submit.documentComplete": "모든 서명이 완료되어 문서를 제출할 수 있습니다",
    "submit.submitted": "제출 완료",
    "submit.submittedDescription": "문서가 성공적으로 제출되었습니다. 더 이상 수정할 수 없습니다.",
    "submit.backToHome": "홈으로 돌아가기",

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
      "DocSign으로 종이 없는 문서 워크플로우를 경험하세요. 어디서나 안전하게 문서에 서명하고 공유할 수 있습니다.",
    "home.hero.cta": "지금 시작하기",
    "home.hero.learnMore": "더 알아보기",
    "home.hero.trustedBy": "수천 명의 사용자가 신뢰하는 서비스",
    "home.featuresTitle": "강력한 기능",
    "home.featuresDescription":
      "DocSign은 문서 서명 프로세스를 간소화하는 다양한 기능을 제공합니다.",
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
      "DocSign을 사용하는 고객들의 생생한 후기를 확인해보세요.",
    "home.testimonials.quote1":
      "DocSign은 우리 회사의 계약 프로세스를 완전히 바꿔놓았습니다. 이전에는 서류 작업에 며칠이 걸렸지만, 이제는 몇 분 만에 완료됩니다.",
    "home.testimonials.author1": "김민수",
    "home.testimonials.role1": "스타트업 CEO",
    "home.testimonials.quote2":
      "사용하기 쉽고 안전한 서명 솔루션을 찾고 있었는데, DocSign이 완벽했습니다. 고객들도 사용하기 쉽다고 좋아합니다.",
    "home.testimonials.author2": "이지현",
    "home.testimonials.role2": "프리랜서 디자이너",
    "home.testimonials.quote3":
      "원격 근무 환경에서 문서 서명이 큰 문제였는데, DocSign 덕분에 이제는 걱정이 없습니다. 강력히 추천합니다!",
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
    "home.cta.description":
      "DocSign으로 문서 서명 프로세스를 간소화하고 시간과 비용을 절약하세요.",
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
      "DocSign에 로그인하여 문서 서명 및 관리를 시작하세요. 안전하고 빠른 서명 경험을 제공합니다.",
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
    "register.joinUs": "DocSign에 가입하세요",
    "register.joinMessage":
      "DocSign에 가입하여 문서 서명 및 관리를 시작하세요. 간편하고 안전한 서명 경험을 제공합니다.",
    "register.kakaoTalk": "카카오",
    
    // Auth Errors - Server Actions
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
    // Header
    "app.title": "DocSign",
    "app.description": "Upload, sign, and share documents online with ease",

    // Document Upload
    "upload.title": "Upload your document",
    "upload.description": "Drag and drop your document or click to browse",
    "upload.button": "Select Document",
    "upload.clear": "Clear",
    "upload.addSignatureArea": "Add Signature Area",
    "upload.getSignature": "Get Signature",
    "upload.generating": "Generating...",
    "upload.signature": "Signature",
    "upload.supportedFormats": "Supported: JPG, PNG, WebP, PDF",
    "upload.maxSize": "Max 50MB",
    "upload.invalidFileType": "Unsupported file type",
    "upload.fileTooLarge": "File too large (max 50MB)",
    "upload.missingRequiredFields": "Please enter a title",
    "upload.success": "Document uploaded successfully",
    "upload.failed": "Document upload failed",
    "upload.documentTitle": "Document Title",
    "upload.titlePlaceholder": "Enter document title",
    "upload.uploadDocument": "Upload Document",
    "upload.uploading": "Uploading...",
    "upload.status": "Status",
    "upload.uploadFirst": "Please upload document first",
    "upload.saveAreasFailed": "Failed to save signature areas",
    "upload.noSignatureAreas": "Please add signature areas",
    "upload.linkGenerated": "Signing link generated successfully",
    "upload.linkGenerationFailed": "Failed to generate link",
    "upload.clickToRemove": "Click to remove",
    "upload.documentAlt": "Uploaded document",
    "upload.saveSignatureAreas": "Save",
    "upload.signatureAreasSaved": "Signature areas saved successfully",
    "upload.areaSelectorInstructions": "Click and drag to select signature area",
    "upload.areaSelectorEscHint": "Press ESC or click Cancel to exit",
    "upload.cancel": "Cancel",
    
    // Signature Request
    "signatureRequest.title": "Create Signature Request",
    "signatureRequest.description": "Specify signers and configure security settings",
    "signatureRequest.recipients": "Signer Information",
    "signatureRequest.addRecipient": "Add Signer",
    "signatureRequest.removeRecipient": "Remove",
    "signatureRequest.recipientName": "Name",
    "signatureRequest.recipientEmail": "Email",
    "signatureRequest.recipientNamePlaceholder": "Enter signer name",
    "signatureRequest.recipientEmailPlaceholder": "Enter signer email",
    "signatureRequest.security": "Security Settings",
    "signatureRequest.enablePassword": "Enable password protection",
    "signatureRequest.password": "Password",
    "signatureRequest.passwordPlaceholder": "Enter password",
    "signatureRequest.confirmPassword": "Confirm Password",
    "signatureRequest.confirmPasswordPlaceholder": "Re-enter password",
    "signatureRequest.expiry": "Expiry Settings",
    "signatureRequest.expiryDays": "Expiry (days)",
    "signatureRequest.expiryDaysPlaceholder": "30",
    "signatureRequest.maxUses": "Max Uses",
    "signatureRequest.maxUsesPlaceholder": "Unlimited",
    "signatureRequest.generateLink": "Generate Signing Link",
    "signatureRequest.cancel": "Cancel",
    "signatureRequest.creating": "Creating...",
    "signatureRequest.validationError": "Please fill in all required fields",
    "signatureRequest.passwordMismatch": "Passwords do not match",
    "signatureRequest.invalidEmail": "Please enter a valid email",
    "signatureRequest.success": "Signature request created successfully",
    "signatureRequest.linkCopied": "Signature link copied to clipboard",
    "signatureRequest.linkGenerated": "Signature link generated",
    "signatureRequest.error": "Failed to create signature request",
    "signatureRequest.assignToArea": "Assign signer to area",
    "signatureRequest.unassigned": "Unassigned",

    // Sign Page
    "sign.loading": "Loading document...",
    "sign.notFound": "Document Not Found",
    "sign.notFoundDesc":
      "The document you're looking for doesn't exist or has expired.",
    "sign.returnHome": "Return to Home",
    "sign.clickAreas": "Click on the highlighted areas to add your signature",
    "sign.clickToSign": "Click to sign",
    "sign.generating": "Generating...",
    "sign.saveDocument": "Save Document",
    "sign.signedDocument": "Your Signed Document",
    "sign.close": "Close",
    "sign.download": "Download",
    "sign.documentNotFound": "Document not found",
    "sign.loadError": "Error loading document",
    "sign.invalidPassword": "Invalid password",
    "sign.passwordRequired": "Password Required",
    "sign.passwordRequiredDesc": "Please enter the password to access this document",
    "sign.password": "Password",
    "sign.enterPassword": "Enter password",
    "sign.checking": "Checking...",
    "sign.submit": "Submit",
    "sign.alreadySigned": "This area has already been signed",
    "sign.signatureSubmitted": "Signature submitted successfully",
    "sign.signatureError": "Error submitting signature",
    "sign.documentGenerated": "Signed document generated successfully",
    "sign.generationError": "Error generating document",
    "sign.downloadStarted": "Download started",
    "sign.downloadError": "Error downloading file",
    "sign.progress": "Progress: {signed}/{total} completed",
    "sign.signerName": "Signer Name",
    "sign.signerNamePlaceholder": "Enter your name",
    "sign.signerEmail": "Signer Email",
    "sign.signerEmailPlaceholder": "Enter your email",
    "sign.signedArea": "Signed area",
    "sign.signed": "Signed",
    "sign.downloadDocument": "Download Signed Document",
    "sign.completionStatus": "Signing progress: {signed}/{total} areas completed",
    "sign.documentAlt": "Document to sign",
    "sign.signedDocumentAlt": "Signed document",

    // Signer Onboarding (English)
    "signer.onboarding.title": "Signing Guide",
    "signer.onboarding.subtitle": 'We will guide you through the signing process for "{title}" document',
    "signer.onboarding.step1.title": "Review Document",
    "signer.onboarding.step1.description": "First, review the document content",
    "signer.onboarding.step1.detail": "Areas requiring signatures are highlighted in red",
    "signer.onboarding.step2.title": "Add Signatures",
    "signer.onboarding.step2.description": "Please sign in {count} areas total",
    "signer.onboarding.step2.detail": "Click on red areas to open the signature pad",
    "signer.onboarding.step3.title": "Submit Document",
    "signer.onboarding.step3.description": "Submit the document after completing all signatures",
    "signer.onboarding.step3.detail": "The document cannot be modified after submission",
    "signer.onboarding.skipGuide": "Skip Guide",
    "signer.onboarding.startSigning": "Start Signing",

    // Submit Document (English)
    "submit.confirmTitle": "Confirm Document Submission",
    "submit.confirmDescription": 'Are you sure you want to submit "{title}" document?',
    "submit.signatureStatus": "Signature Status",
    "submit.completed": "Completed",
    "submit.incompleteWarning": "Signatures are not complete yet",
    "submit.incompleteWarningDetail": "Do you want to submit with some areas unsigned?",
    "submit.finalWarning": "Cannot modify after submission",
    "submit.finalWarningDetail": "Once submitted, the document cannot be modified. Please decide carefully.",
    "submit.submitting": "Submitting...",
    "submit.confirm": "Submit",
    "submit.success": "Document submitted successfully",
    "submit.error": "Failed to submit document",
    "submit.document": "Submit Document",
    "submit.documentComplete": "All signatures completed. You can now submit the document",
    "submit.submitted": "Submitted",
    "submit.submittedDescription": "Document has been successfully submitted. It can no longer be modified.",
    "submit.backToHome": "Back to Home",

    // Signature Modal
    "signature.title": "Add Your Signature",
    "signature.instruction":
      "Draw your signature above using your mouse or finger",
    "signature.clear": "Clear",
    "signature.sign": "Sign Document",
    "signature.submitting": "Submitting...",

    // Language Selector
    "language.ko": "한국어",
    "language.en": "English",

    // Dashboard
    "dashboard.title": "Document Management",
    "dashboard.description": "Upload documents and define signature areas",
    "dashboard.backToHome": "Back to Home",
    "dashboard.loading": "Loading...",
    "dashboard.welcome": "Hello, {name}!",
    "dashboard.profile": "Profile",
    "dashboard.settings": "Settings",
    "dashboard.signOut": "Sign Out",
    
    // Dashboard Filters & Actions
    "dashboard.searchPlaceholder": "Search by document title or filename...",
    "dashboard.activeFilters": "Active filters",
    "dashboard.search": "Search",
    "dashboard.filters.all": "All",
    "dashboard.filters.draft": "Draft",
    "dashboard.filters.published": "In Progress",
    "dashboard.filters.completed": "Completed",
    "dashboard.filters.expired": "Expired",
    "dashboard.sort.createdAt": "Created",
    "dashboard.sort.updatedAt": "Updated",
    "dashboard.sort.title": "Title",
    "dashboard.sort.status": "Status",
    "dashboard.sort.ascending": "Ascending",
    "dashboard.sort.descending": "Descending",
    
    // Document Status
    "dashboard.status.draft": "Draft",
    "dashboard.status.published": "In Progress",
    "dashboard.status.completed": "Completed",
    "dashboard.status.expired": "Expired",
    "dashboard.shared": "Shared",
    
    // Document Actions
    "dashboard.actions.view": "View",
    "dashboard.actions.edit": "Edit",
    "dashboard.actions.share": "Share",
    "dashboard.actions.delete": "Delete",
    "dashboard.actions.download": "Download",
    
    // Document Info
    "dashboard.signatureProgress": "Signature Progress",
    "dashboard.signaturesRemaining": "{count} signatures pending",
    "dashboard.created": "Created",
    "dashboard.updated": "Updated",
    "dashboard.lastAccessed": "Last accessed",
    
    // Document List
    "dashboard.documentsCount": "{count} documents",
    "dashboard.searchResultsCount": "Search results for '{query}': {count}",
    
    // Empty States
    "dashboard.noDocuments": "No documents yet",
    "dashboard.noDocumentsDescription": "Upload your first document to start the signing process.",
    "dashboard.createFirstDocument": "Create First Document",
    "dashboard.noDraftDocuments": "No draft documents",
    "dashboard.noDraftDocumentsDescription": "Create a new document to get started.",
    "dashboard.createNewDocument": "Create New Document",
    "dashboard.noPublishedDocuments": "No documents in progress",
    "dashboard.noPublishedDocumentsDescription": "Documents with signature requests will appear here.",
    "dashboard.noCompletedDocuments": "No completed documents",
    "dashboard.noCompletedDocumentsDescription": "Fully signed documents will appear here.",
    "dashboard.noExpiredDocuments": "No expired documents",
    "dashboard.noExpiredDocumentsDescription": "Expired documents will appear here.",
    "dashboard.noSearchResults": "No search results",
    "dashboard.noSearchResultsDescription": "No results found for '{query}'.",
    "dashboard.clearSearch": "Clear Search",
    
    // Delete Dialog
    "dashboard.deleteDialog.title": "Delete Document?",
    "dashboard.deleteDialog.description": "'{title}' and all related data will be permanently deleted. This action cannot be undone.",
    "dashboard.deleteDialog.cancel": "Cancel",
    "dashboard.deleteDialog.confirm": "Delete",
    
    // Dashboard Navigation
    "dashboard.myDocuments": "My Documents",
    "dashboard.newDocument": "New Document",
    "dashboard.deleting": "Deleting...",
    "dashboard.deleteSuccess": "Document deleted successfully",
    "dashboard.deleteError": "Failed to delete document",
    "dashboard.loadError": "Failed to load documents",

    // Homepage
    "home.notification": "🎉 New features just released! Check them out now.",
    "home.nav.features": "Features",
    "home.nav.pricing": "Pricing",
    "home.nav.testimonials": "Testimonials",
    "home.dashboard": "Dashboard",
    "home.getStarted": "Get Started",
    "home.hero.title": "Document Signing Made Simple",
    "home.hero.description":
      "Experience paperless document workflows with DocSign. Sign and share documents securely from anywhere.",
    "home.hero.cta": "Start Now",
    "home.hero.learnMore": "Learn More",
    "home.hero.trustedBy": "Trusted by thousands of users",
    "home.featuresTitle": "Powerful Features",
    "home.featuresDescription":
      "DocSign offers a range of features to streamline your document signing process.",
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
      "See what our customers are saying about DocSign.",
    "home.testimonials.quote1":
      "DocSign completely transformed our contract process. What used to take days now takes minutes.",
    "home.testimonials.author1": "John Smith",
    "home.testimonials.role1": "Startup CEO",
    "home.testimonials.quote2":
      "I was looking for an easy-to-use and secure signing solution, and DocSign was perfect. My clients love how easy it is to use.",
    "home.testimonials.author2": "Sarah Johnson",
    "home.testimonials.role2": "Freelance Designer",
    "home.testimonials.quote3":
      "Document signing was a major pain point in our remote work environment, but DocSign solved that. Highly recommended!",
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
    "home.cta.title": "Get Started Today",
    "home.cta.description":
      "Streamline your document signing process and save time and money with DocSign.",
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
      "Sign in to DocSign to start signing and managing your documents. We provide a secure and fast signing experience.",
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
    "register.joinUs": "Join DocSign Today",
    "register.joinMessage":
      "Sign up for DocSign to start signing and managing your documents. We provide a simple and secure signing experience.",
    "register.kakaoTalk": "Kakao",
    
    // Auth Errors - Server Actions
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
};

// Provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with Korean as default
  const [language, setLanguageState] = useState<Language>("ko");

  // Load saved language preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("docSignLanguage") as Language;
    if (savedLanguage && (savedLanguage === "ko" || savedLanguage === "en")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Save language preference when it changes
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem("docSignLanguage", newLanguage);
  };

  // Translation function with placeholder support
  const t = (key: string, params?: Record<string, string | number | boolean>): string => {
    let translation = translations[language][key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{${paramKey}}`, String(paramValue));
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
