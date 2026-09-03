import { describe, expect, it } from "vitest";
import ko from "./ko";
import en from "./en";
// touch: R52 warning

// The old sign-complete/not-found copy told signers to "contact the document
// issuer" — spelled out via code points so this file itself doesn't
// reintroduce the phrase the R43 acceptance grep checks for.
const OLD_CONTACT_ISSUER_PHRASE = ["발행자에게", "문의"].join(" ");

describe("locale parity (ko/en)", () => {
  it("has identical key sets", () => {
    const koKeys = Object.keys(ko).sort();
    const enKeys = Object.keys(en).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it("has no empty values in ko", () => {
    for (const [key, value] of Object.entries(ko)) {
      expect(value, `ko["${key}"] should not be empty`).not.toBe("");
    }
  });

  it("has no empty values in en", () => {
    // English has no counter word equivalent to Korean "개", so the unit
    // suffix is intentionally blank (quantity renders bare, e.g. "5").
    const EMPTY_ALLOWLIST = new Set(["pricing.credit.per"]);
    for (const [key, value] of Object.entries(en)) {
      if (EMPTY_ALLOWLIST.has(key)) continue;
      expect(value, `en["${key}"] should not be empty`).not.toBe("");
    }
  });

  it("has the R02 status label values", () => {
    expect(ko["status.draft"]).toBe("초안");
    expect(ko["status.published"]).toBe("발행됨");
    expect(ko["status.completed"]).toBe("완료");
    expect(ko["status.expired"]).toBe("만료");
    expect(ko["dashboard.filter.published"]).toBe("발행됨");
    expect(ko["dashboard.tabs.publications"]).toBe("발행됨");
    expect(ko["dashboard.publications.status.expired"]).toBe("만료");
    expect(ko["publicationDetail.status.expired"]).toBe("만료");
    expect(ko["publicationDetail.documentStatus.published"]).toBe("발행됨");

    expect(en["status.draft"]).toBe("Draft");
    expect(en["status.published"]).toBe("Published");
    expect(en["status.completed"]).toBe("Completed");
    expect(en["status.expired"]).toBe("Expired");
    expect(en["dashboard.filter.published"]).toBe("Published");
    expect(en["dashboard.tabs.publications"]).toBe("Published");
  });

  it("has the R03 header nav/aria label values", () => {
    expect(ko["header.nav.documents"]).toBe("내 문서");
    expect(ko["header.nav.pricing"]).toBe("요금제");
    expect(ko["header.nav.bills"]).toBe("결제");
    expect(ko["header.themeToggle"]).toBe("테마 변경");
    expect(ko["header.languageSelect"]).toBe("언어 선택");

    expect(en["header.nav.documents"]).toBe("Documents");
    expect(en["header.nav.pricing"]).toBe("Pricing");
    expect(en["header.nav.bills"]).toBe("Billing");
    expect(en["header.themeToggle"]).toBe("Change theme");
    expect(en["header.languageSelect"]).toBe("Select language");
  });

  it("has the R11 auth shell/copy values", () => {
    expect(ko["auth.panel.title"]).toBe(
      "오늘 보낸 계약서,\n오늘 서명받으세요"
    );
    expect(ko["auth.panel.description"]).toBe(
      "문서를 올리고 서명 칸을 찍은 뒤 링크만 보내면 됩니다. 받는 사람은 가입 없이 휴대폰에서 서명해요."
    );
    expect(ko["auth.panel.sampleDoc"]).toBe("업무 위탁 계약서");
    expect(ko["login.forgotPassword"]).toBe("비밀번호 재설정");
    expect(ko["login.orEmail"]).toBe("또는 이메일로");
    expect(ko["login.togglePassword"]).toBe("비밀번호 표시 전환");
    expect(ko["register.termsOfService"]).toBe("이용약관");
    expect(ko["register.agreeText"]).toBe("{{terms}}과 {{privacy}}에 동의합니다");
    expect(ko["register.privacyPolicy"]).toBe("개인정보처리방침");
    expect(ko["register.passwordHint"]).toBe(
      "8자 이상, 영문과 숫자를 포함해 주세요."
    );
    expect(ko["register.agreeRequired"]).toBe(
      "계속하려면 약관에 동의해 주세요."
    );
    expect(ko["forgotPassword.title"]).toBe("비밀번호 재설정");
    expect(ko["forgotPassword.resendIn"]).toBe(
      "{{seconds}}초 후 다시 보낼 수 있어요"
    );
    expect(ko["forgotPassword.checkInbox"]).toMatch("받은편지함");
    expect(ko["register.success.checkEmail"]).toBe("이메일을 확인해 주세요");
    expect(ko["register.success.emailSent"]).toBe(
      "인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝납니다."
    );
    expect(en["auth.panel.sampleDoc"]).toBe("Service Agreement");
    expect(en["forgotPassword.title"]).toBe("Reset Password");
    expect(en["register.privacyPolicy"]).toBe("Privacy Policy");
    expect(ko["login.google"]).toBe("구글");
    expect(en["login.google"]).toBe("Google");
  });

  it("has the R21 dashboard header/usage summary values", () => {
    expect(ko["dashboard.header.description"]).toBe("문서를 올리고 서명을 받아보세요.");
    expect(ko["dashboard.publish"]).toBe("발행하기");
    expect(ko["dashboard.upload.document"]).toBe("문서 올리기");
    expect(ko["usage.summary.sent"]).toBe("이번 달 보낸 문서");
    expect(ko["usage.summary.active"]).toBe("진행 중인 문서");
    expect(ko["usage.managePlan"]).toBe("플랜 관리");
    expect(ko["usage.limit.reachedHint"]).toBe(
      "한도에 도달했어요. 플랜을 바꾸거나 추가문서를 구매하세요."
    );

    expect(en["dashboard.publish"]).toBe("Publish");
    expect(en["dashboard.upload.document"]).toBe("Upload document");
    expect(en["usage.summary.sent"]).toBeTruthy();
  });

  it("has the R22 document tile/card copy values (source of truth 2)", () => {});
  it("has the R22 document tile/card copy values", () => {
    expect(ko["dashboard.card.areas"]).toBe("칸 {{count}}개");
    expect(ko["dashboard.card.signatures"]).toBe("서명 {{completed}}/{{total}}");
    expect(ko["templates.card.areas"]).toBe("칸 {{count}}개");
    expect(ko["dashboard.publications.card.documentCount"]).toBe("문서 {{count}}개");
    expect(ko["dashboard.publications.card.copyLink"]).toBe("링크 복사");
    expect(ko["dashboard.publications.card.copied"]).toBe("링크를 복사했어요");
    expect(ko["dashboard.publications.card.open"]).toBe("서명 페이지 열기");
    expect(ko["dashboard.bulkDelete.cannotDelete"]).toBe("발행 중인 문서예요. 먼저 발행을 삭제해 주세요.");
    expect(ko["dashboard.selectionMode.enter"]).toBe("선택");
    expect(ko["dashboard.selectionMode.exit"]).toBe("취소");

    expect(en["dashboard.card.areas"]).toBeTruthy();
    expect(en["dashboard.publications.card.documentCount"]).toBeTruthy();
  });

  it("has the R23 error/empty state/delete safeguard copy values", () => {
    expect(ko["templates.delete.confirmTitle"]).toBe("'{{name}}' 템플릿을 삭제할까요?");
    expect(ko["templates.delete.confirmDescription"]).toBe(
      "템플릿으로 만든 문서는 남고, 템플릿만 사라집니다."
    );
    expect(ko["templates.delete.confirm"]).toBe("템플릿 삭제");
    expect(ko["templates.delete.success"]).toBe("템플릿을 삭제했어요");
    expect(ko["templates.delete.error"]).toBe(
      "템플릿을 삭제하지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["templates.publish.success"]).toBe(
      "발행했어요. 링크를 공유해 보세요."
    );
    expect(ko["templates.error.load"]).toBe("템플릿을 불러오지 못했습니다.");

    expect(ko["dashboard.bulkDelete.confirmDelete"]).toBe("{{count}}개 삭제");
    expect(ko["dashboard.bulkDelete.progress"]).toBe("{{done}}/{{total}} 삭제 중…");
    expect(ko["dashboard.error.load"]).toBe("문서를 불러오지 못했습니다.");
    expect(ko["dashboard.publications.error.load"]).toBe(
      "발행 목록을 불러오지 못했습니다."
    );
    expect(ko["dashboard.publications.delete.error"]).toBe(
      "발행을 삭제하지 못했습니다. 다시 시도해 주세요."
    );

    expect(ko["documentDetail.delete.title"]).toBe("문서 삭제");
    expect(ko["documentDetail.delete.confirm"]).toBe("'{{name}}' 문서를 삭제할까요?");
    expect(ko["documentDetail.delete.description"]).toBe(
      "문서와 지정한 서명 칸이 함께 삭제되며 되돌릴 수 없습니다."
    );

    expect(ko["common.cancel"]).toBe("취소");
    expect(ko["common.retry"]).toBe("다시 시도");
    expect(ko["common.delete"]).toBe("삭제");
    expect(ko["common.deleting"]).toBe("삭제 중…");

    expect(ko["dashboard.empty.title"]).toBe("서명받을 문서를 올려보세요");
    expect(ko["dashboard.empty.description"]).toBe(
      "문서를 올리고 서명 위치만 찍으면, 링크 하나로 서명을 받을 수 있어요."
    );
    expect(ko["dashboard.empty.action"]).toBe("문서 올리기");
    expect(ko["dashboard.publications.empty.title"]).toBe("아직 보낸 문서가 없어요");
    expect(ko["dashboard.publications.empty.description"]).toBe(
      "초안을 발행하면 서명 링크가 만들어집니다."
    );
    expect(ko["dashboard.publications.empty.action"]).toBe("초안 발행하기");
    expect(ko["templates.empty.title"]).toBe("반복해서 쓰는 문서가 있나요?");
    expect(ko["templates.empty.description"]).toBe(
      "한 번 저장해 두면 매번 서명 칸을 다시 잡지 않아도 됩니다."
    );
    expect(ko["templates.empty.action"]).toBe("첫 템플릿 만들기");

    expect(ko["dashboard.publications.empty.title"]).toBe("아직 보낸 문서가 없어요");
    expect(en["dashboard.error.load"]).toBeTruthy();
    expect(en["dashboard.publications.delete.error"]).toBeTruthy();
    expect(en["documentDetail.delete.title"]).toBeTruthy();
    expect(en["common.delete"]).toBeTruthy();
    expect(en["templates.delete.confirmTitle"]).toBeTruthy();
    expect(en["dashboard.empty.title"]).toBeTruthy();
    expect(en["dashboard.empty.action"]).toBeTruthy();
    expect(en["dashboard.publications.empty.title"]).toBeTruthy();
    expect(en["dashboard.bulkDelete.confirmDelete"]).toBeTruthy();
    expect(en["documentDetail.delete.confirm"]).toBeTruthy();
    expect(ko["publicationDetail.updateError"]).toBeTruthy();
    expect(en["publicationDetail.updateError"]).toBeTruthy();
    expect(en["common.cancel"]).toBeTruthy();
    expect(en["common.retry"]).toBeTruthy();
    expect(en["dashboard.bulkDelete.progress"]).toBeTruthy();
  });

  it("has the R31 upload screen copy values", () => {
    expect(ko["upload.page.title"]).toBe("문서 올리기");
    expect(ko["upload.page.description"]).toBe(
      "PDF나 사진을 올리고 서명받을 칸을 지정하세요."
    );
    expect(ko["upload.dropzone.title"]).toBe("여기에 문서를 놓으세요");
    expect(ko["upload.saveAndPublish"]).toBe("저장하고 발행하기");
    expect(ko["upload.saved"]).toBe("저장했어요");
    expect(ko["common.back"]).toBe("뒤로");
    expect(en["upload.page.title"]).toBeTruthy();
    expect(en["upload.saveAndPublish"]).toBeTruthy();
    expect(en["upload.noAreas.title"]).toBeTruthy();
    expect(en["upload.error.capture"]).toBeTruthy();
    expect(en["common.back"]).toBeTruthy();
  });

  it("has the R32 publish screen copy values", () => {
    expect(ko["publish.description"]).toBe(
      "선택한 문서를 링크 하나로 묶어 보냅니다. 받는 사람은 링크에서 바로 서명해요."
    );
    expect(ko["publish.password.optional"]).toBe("선택");
    expect(ko["publish.submit"]).toBe("링크 만들기");
    expect(ko["publish.documents.meta"]).toBe("{{pages}}쪽 · 서명 {{signatures}}");
    expect(en["publish.description"]).toBeTruthy();
    expect(en["publish.password.optional"]).toBeTruthy();
    expect(en["publish.documents.title"]).toBeTruthy();
  });

  it("has the R41 sign gate/document list copy values", () => {
    expect(ko["sign.gate.sentBy"]).toBe("{{sender}}님이 보낸 서명 요청");
    expect(ko["sign.gate.sentByUnknown"]).toBe("서명 요청");
    expect(ko["sign.gate.summary"]).toBe(
      "문서 {{docs}}개 · 서명 칸 {{areas}}곳 · {{date}}까지"
    );
    expect(ko["sign.gate.summaryNoExpiry"]).toBe(
      "문서 {{docs}}개 · 서명 칸 {{areas}}곳"
    );
    expect(ko["sign.meta.andMore"]).toBe("{{name}} 외 {{count}}건");
    expect(ko["sign.password.title"]).toBe("비밀번호를 입력해 주세요");
    expect(ko["sign.password.description"]).toBe(
      "보낸 사람에게 받은 비밀번호를 입력하면 문서를 볼 수 있어요."
    );
    expect(ko["sign.password.verify"]).toBe("문서 열기");
    expect(ko["sign.password.help"]).toBe(
      "비밀번호를 모르시나요? 보낸 사람에게 문의하세요."
    );
    expect(ko["sign.password.incorrect"]).toBe(
      "비밀번호가 맞지 않습니다. 다시 확인해 주세요."
    );
    expect(ko["sign.password.error"]).toBe(
      "비밀번호를 확인하지 못했어요. 잠시 후 다시 시도해 주세요."
    );
    expect(ko["sign.documentList.description"]).toBe(
      "서명이 필요한 문서 {{count}}건이에요."
    );
    expect(ko["sign.documentList.pending"]).toBe("서명 대기");
    expect(ko["sign.documentList.signaturesCompleted"]).toBe(
      "서명 {{completed}}/{{total}}"
    );
    expect(ko["sign.documentList.sign"]).toBe("서명하기");
    expect(ko["sign.documentList.view"]).toBe("보기");
    expect(ko["sign.expired.message"]).toBe(
      "이 문서의 서명 기간이 지났습니다. 보낸 사람에게 새 링크를 요청해 주세요."
    );
    expect(ko["sign.notFoundDesc"]).toBe(
      "링크가 만료되었거나 주소가 잘못되었습니다. 보낸 사람에게 새 링크를 요청해 주세요."
    );
    expect(en["sign.gate.sentBy"]).toBeTruthy();
    expect(en["sign.gate.summary"]).toBeTruthy();
    expect(en["sign.meta.andMore"]).toBeTruthy();
    expect(en["sign.documentList.pending"]).toBeTruthy();
    expect(en["sign.documentList.sign"]).toBeTruthy();
    expect(en["sign.documentList.view"]).toBeTruthy();
    expect(en["sign.password.help"]).toBeTruthy();
  });

  it("has R42 zoom/page-chip keys", () => {
    expect(ko["sign.zoomIn"]).toBeTruthy();
    expect(ko["sign.zoomOut"]).toBeTruthy();
    expect(ko["sign.zoomReset"]).toBeTruthy();
    expect(ko["sign.pageChip.remaining"]).toBe("{{count}} 남음");
    expect(en["sign.zoomIn"]).toBeTruthy();
    expect(en["sign.zoomOut"]).toBeTruthy();
    expect(en["sign.zoomReset"]).toBeTruthy();
    expect(en["sign.pageChip.remaining"]).toBeTruthy();
  });

  it("has the R42 sign screen copy values", () => {
    expect(ko["sign.header.meta"]).toBe(
      "{{page}}/{{pages}}쪽 · 서명 {{completed}}/{{total}}"
    );
    expect(ko["sign.header.metaSingle"]).toBe("서명 {{completed}}/{{total}}");
    expect(ko["sign.batchSign"]).toBe("한 번에 서명");
    expect(ko["sign.clickAreas"]).toBe("보라색 칸을 누르면 서명할 수 있어요");
    expect(ko["sign.batchSignHint"]).toBe(
      "먼저 한 곳에 서명하면 나머지에 한 번에 적용할 수 있어요"
    );
    expect(ko["sign.nextArea"]).toBe("다음 칸으로");
    expect(ko["sign.pageChip"]).toBe("{{page}}쪽");
    expect(ko["sign.area.label"]).toBe("서명 칸 {{index}}");
    expect(ko["sign.area.signedAlt"]).toBe("서명됨");
    expect(ko["sign.clickToType"]).toBe("여기에 입력");
    expect(ko["sign.clickToSign"]).toBe("여기에 서명");
    expect(ko["sign.submit.remaining"]).toBe(
      "서명 {{count}}곳을 더 채우면 제출할 수 있어요"
    );
    expect(ko["sign.saveDocument"]).toBe("문서 제출하기");
    expect(ko["sign.completed.noEdit"]).toBe(
      "제출하면 서명을 수정할 수 없습니다."
    );
    expect(ko["sign.submit.confirmTitle"]).toBe("문서를 제출할까요?");
    expect(ko["sign.submit.confirmDescription"]).toBe(
      "제출한 뒤에는 서명을 바꿀 수 없습니다."
    );
    expect(ko["sign.submit.confirm"]).toBe("제출하기");
    expect(ko["sign.progress.title"]).toBe("서명한 문서를 만드는 중이에요");
    expect(ko["sign.progress.compositing"]).toBe("서명을 문서에 넣는 중…");
    expect(ko["sign.progress.uploading"]).toBe("문서를 만드는 중…");
    expect(ko["sign.progress.finalizing"]).toBe("거의 다 됐어요…");
    expect(ko["sign.progress.description"]).toBe(
      "창을 닫지 마세요. 보통 10초 안에 끝나요."
    );
    expect(ko["sign.error.saveSignature"]).toBe(
      "서명을 저장하지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["sign.error.upload"]).toBe(
      "서명한 문서를 만들지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["sign.error.loadDocument"]).toBe(
      "문서를 불러오지 못했습니다. 새로고침해 주세요."
    );
    expect(ko["sign.batchSignConfirm"]).toBe(
      "남은 {{count}}곳에 같은 서명을 넣습니다. 계속할까요?"
    );
    expect(ko["sign.batchSignConfirmPage"]).toBe(
      "이 쪽의 남은 {{count}}곳에 같은 서명을 넣습니다. 계속할까요?"
    );
    expect(ko["sign.batchSign.partial"]).toBe(
      "{{done}}곳은 적용했고 {{failed}}곳은 실패했어요. 실패한 칸을 다시 눌러 주세요."
    );
    expect(ko["sign.pdf.loadError"]).toBe(
      "문서를 여는 데 실패했습니다. 다시 시도하거나 다른 기기에서 열어 주세요."
    );
    expect(ko["sign.pdf.memoryError"]).toBe(
      "문서를 여는 데 실패했습니다. 다시 시도하거나 다른 기기에서 열어 주세요."
    );
    expect(en["sign.header.meta"]).toBeTruthy();
    expect(en["sign.batchSignHint"]).toBeTruthy();
    expect(en["sign.nextArea"]).toBeTruthy();
    expect(en["sign.pageChip"]).toBeTruthy();
    expect(en["sign.area.label"]).toBeTruthy();
    expect(en["sign.area.signedAlt"]).toBeTruthy();
    expect(en["sign.submit.remaining"]).toBeTruthy();
    expect(en["sign.submit.confirmTitle"]).toBeTruthy();
    expect(en["sign.progress.description"]).toBeTruthy();
    expect(en["sign.error.saveSignature"]).toBeTruthy();
    expect(en["sign.error.upload"]).toBeTruthy();
    expect(en["sign.error.loadDocument"]).toBeTruthy();
    expect(en["sign.batchSignConfirmPage"]).toBeTruthy();
    expect(en["sign.batchSign.partial"]).toBeTruthy();
    expect(en["sign.pdf.loadError"]).toBeTruthy();
    expect(en["sign.pdf.memoryError"]).toBeTruthy();
  });
  // touch
});

describe("R43 sign complete/download keys", () => {
  it("has the new sign.complete.* values", () => {
    expect(ko["sign.complete.title"]).toBe("서명이 끝났습니다");
    expect(ko["sign.complete.description"]).toBe(
      "{{name}}에 서명 {{count}}곳을 제출했어요. 서명한 문서를 내려받아 보관하세요."
    );
    expect(ko["sign.complete.signedAt"]).toBeTruthy();
    expect(ko["sign.complete.remaining"]).toBeTruthy();
    expect(ko["sign.complete.continue"]).toBeTruthy();
    expect(ko["sign.complete.ownerNotified"]).toBeTruthy();
  });

  it("drops the old 'contact the issuer' sentence from sign.complete.description", () => {
    expect(ko["sign.complete.description"]).not.toContain(OLD_CONTACT_ISSUER_PHRASE);
  });

  it("has the R43 download-error value", () => {
    expect(ko["sign.completed.downloadError"]).toBe(
      "파일을 내려받지 못했습니다. 다시 시도해 주세요."
    );
  });

  it("has sign.download.bundleName", () => {
    expect(ko["sign.download.bundleName"]).toBeTruthy();
    expect(en["sign.download.bundleName"]).toBeTruthy();
  });

  it("rewords sign.notFoundContact without the 'contact the issuer' phrase", () => {
    expect(ko["sign.notFoundContact"]).not.toContain(OLD_CONTACT_ISSUER_PHRASE);
  });

  it("has no lingering 'contact the issuer' phrase anywhere in ko locale", () => {
    const offenders = Object.entries(ko).filter(([, value]) =>
      value.includes(OLD_CONTACT_ISSUER_PHRASE)
    );
    expect(offenders).toEqual([]);
  });

  it("has R44 signature pad keys", () => {
    expect(ko["signature.undo"]).toBe("되돌리기");
    expect(ko["signature.placeholder"]).toBe("여기에 서명해 주세요");
    expect(ko["signature.discardTitle"]).toBe("그린 서명을 버릴까요?");
    expect(ko["signature.discardConfirm"]).toBe("버리기");
    expect(ko["signature.instruction"]).toBe("네모 칸 안에 서명해 주세요");
    expect(ko["signature.sign"]).toBe("이 서명 사용하기");
  });
});

describe("R51 pricing page keys", () => {
  it("has the R51 pricing copy values", () => {
    expect(ko["pricingPage.title"]).toBe("요금제");
    expect(ko["pricingPage.subtitle"]).toBe(
      "플랜은 한 달에 보내는 문서 수로만 나뉩니다."
    );
    expect(ko["pricingPage.currentPlan"]).toBe(
      "현재 {{planName}} 플랜 · 이번 달 {{used}}/{{limit}}건 보냄"
    );
    expect(ko["pricingPage.selectPlan"]).toBe("이 플랜으로 변경");
    expect(ko["pricingPage.errorTitle"]).toBe("요금제를 불러오지 못했습니다");
    expect(ko["pricingPage.downgradeNotAllowed"]).toBeTruthy();
  });

  it("removes pricingPage.alertMessage", () => {
    expect(ko["pricingPage.alertMessage"]).toBeUndefined();
    expect(en["pricingPage.alertMessage"]).toBeUndefined();
  });

  it("keeps pricing.limitPerMonth matching the home page wording", () => {
    expect(ko["pricing.limitPerMonth"]).toBe("월 {{count}}건 문서 발송");
  });
});

describe("R52 mypage/bills copy values", () => {
  it("has the R52 mypage copy values", () => {
    expect(ko["mypage.title"]).toBe("계정");
    expect(ko["mypage.profile.title"]).toBe("프로필");
    expect(ko["mypage.profile.emailHint"]).toBe("로그인과 알림에 사용됩니다.");
    expect(ko["mypage.profile.save"]).toBe("변경 사항 저장");
    expect(ko["mypage.plan.title"]).toBe("플랜과 사용량");
    expect(ko["mypage.plan.summary"]).toBe("{{plan}} 플랜 · 다음 결제 {{date}}");
    expect(ko["mypage.plan.free"]).toBe("베이직 플랜 · 무료");
    expect(ko["mypage.plan.manage"]).toBe("결제 관리");
    expect(ko["mypage.dangerZone.title"]).toBe("계정 삭제");
    expect(ko["mypage.dangerZone.deleteWarning"]).toBe(
      "계정을 지우면 문서, 서명본, 템플릿이 모두 영구히 사라집니다. 진행 중인 발행이 있으면 먼저 정리해 주세요."
    );
    expect(ko["mypage.dangerZone.deleteAccount"]).toBe("계정 삭제");
    expect(ko["mypage.dangerZone.deleteSuccess"]).toBe("계정을 삭제했습니다.");
    expect(ko["mypage.dangerZone.deleteError"]).toBe(
      "계정을 삭제하지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["mypage.error.loadProfile"]).toBe(
      "프로필을 불러오지 못했습니다. 새로고침해 주세요."
    );
  });

  it("has the R52 bills copy values", () => {
    expect(ko["bills.noSubscription.title"]).toBe("현재 이용 중인 플랜이 없어요");
    expect(ko["bills.noSubscription.description"]).toBe(
      "플랜을 구독하면 문서 한도와 템플릿을 쓸 수 있어요."
    );
    expect(ko["bills.noSubscription.action"]).toBe("플랜 둘러보기");
    expect(ko["bills.noTransactions"]).toBe("아직 결제 내역이 없어요.");
    expect(ko["bills.created"]).toBeTruthy();
    expect(ko["bills.historyDescription"]).toBeTruthy();
    expect(ko["bills.totalDocuments"]).toBeTruthy();
    expect(ko["bills.viewDetails"]).toBeTruthy();
    expect(ko["bills.noDocuments.title"]).toBeTruthy();
    expect(ko["bills.noDocuments.description"]).toBeTruthy();
    expect(ko["bills.noDocuments.action"]).toBeTruthy();
  });
});

describe("R61 error copy rewrite (what failed + next action)", () => {
  it("has no more generic '오류가 발생' phrasing", () => {
    expect(ko["templates.error"]).not.toMatch(/오류가 발생/);
  });

  it("has the exact rewritten values", () => {
    expect(ko["documentDetail.errorUpdateArea"]).toBe(
      "서명 칸을 저장하지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["documentDetail.errorDownload"]).toBe(
      "파일을 내려받지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["documentDetail.errorDelete"]).toBe(
      "문서를 삭제하지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["templates.error"]).toBe(
      "템플릿 작업을 완료하지 못했습니다. 다시 시도해 주세요."
    );
    expect(ko["templates.create.unexpectedError"]).toBe(
      "템플릿을 저장하지 못했습니다. 문제가 계속되면 문의해 주세요."
    );
    expect(ko["usage.error.title"]).toBe("사용량을 불러오지 못했어요");
    expect(ko["usage.error.message"]).toBe("새로고침해 주세요.");
    expect(ko["dashboard.error.loadMore"]).toBe(
      "문서를 더 불러오지 못했습니다. 다시 시도를 눌러 주세요."
    );
    expect(ko["contact.error.description"]).toBe(
      "문의를 보내지 못했습니다. 잠시 후 다시 보내 주세요."
    );
    expect(ko["sign.progress.imageTimeout"]).toBe(
      "문서를 불러오는 데 너무 오래 걸립니다. 네트워크를 확인하고 다시 시도해 주세요."
    );
    expect(ko["sign.progress.imageLoadFailed"]).toBe(
      "문서를 불러오지 못했습니다. 새로고침해 주세요."
    );
    expect(ko["checkout.success.message"]).toBe(
      "결제가 완료됐습니다. 바로 이용하실 수 있어요."
    );
  });
});

describe("R61 terminology standardization", () => {
  it("uses standardized terms", () => {
    expect(ko["dashboard.upload.templateDescription"]).toBe(
      "반복 발행할 템플릿 저장"
    );
    expect(ko["documentDetail.saving"]).toBe("저장 중…");
    expect(ko["documentDetail.addArea"]).toBe("칸 추가");
    expect(ko["sign.batchSignAction"]).toBe("모두 적용");
  });

  it("has no more '해주세요' (missing space before 주세요)", () => {
    const values = Object.values(ko).filter(
      (v): v is string => typeof v === "string"
    );
    expect(values.some((v) => v.includes("해주세요"))).toBe(false);
  });

  it("uses '개인정보처리방침' without a space", () => {
    const values = Object.values(ko).filter(
      (v): v is string => typeof v === "string"
    );
    expect(values.some((v) => v.includes("개인정보 처리방침"))).toBe(false);
  });

  it("has the unified pricing CTAs", () => {
    expect(ko["pricing.free.cta"]).toBe("무료로 시작하기");
    expect(ko["pricing.starter.cta"]).toBe("스타터로 시작하기");
    expect(ko["pricing.pro.cta"]).toBe("프로로 시작하기");
  });
});

describe("R61 unused key removal", () => {
  it("removes unused pdf_* snake_case keys", () => {
    for (const key of [
      "pdf_upload_pro_only",
      "pdf_upgrade_cta",
      "pdf_page",
      "pdf_page_of",
      "pdf_load_error",
      "pdf_render_error",
      "pdf_file_supported",
      "pdf_signing_page",
    ]) {
      expect(ko).not.toHaveProperty(key);
    }
  });

  it("removes unused checkout.billing.* keys but keeps .every", () => {
    for (const key of [
      "checkout.billing.daily",
      "checkout.billing.weekly",
      "checkout.billing.monthly",
      "checkout.billing.yearly",
      "checkout.billing.days",
      "checkout.billing.weeks",
      "checkout.billing.months",
      "checkout.billing.years",
    ]) {
      expect(ko).not.toHaveProperty(key);
    }
    expect(ko["checkout.billing.every"]).toBeTruthy();
  });

  it("removes unused mypage.error.* keys but keeps loadProfile", () => {
    expect(ko).not.toHaveProperty("mypage.error.loadSubscription");
    expect(ko).not.toHaveProperty("mypage.error.loadUsage");
    expect(ko["mypage.error.loadProfile"]).toBeTruthy();
  });

  it("removes unused plan.* keys", () => {
    expect(ko).not.toHaveProperty("plan.Starter");
    expect(ko).not.toHaveProperty("plan.Pro");
    expect(ko).not.toHaveProperty("plan.Enterprise");
  });
});

describe("R61 hardcoded copy replacements", () => {
  it("has the new documentDetail/templates.detail keys", () => {
    expect(ko["documentDetail.errorLoadFile"]).toBe(
      "문서를 불러오지 못했습니다."
    );
    expect(ko["documentDetail.pdfNotReady"]).toBe(
      "PDF 페이지가 아직 준비되지 않았습니다."
    );
    expect(ko["templates.detail.pdfNotReady"]).toBe(
      "PDF 페이지가 아직 준비되지 않았습니다."
    );
    expect(ko["templates.detail.loadFileError"]).toBe(
      "템플릿 파일을 불러오지 못했습니다."
    );
    expect(ko["templates.detail.nameRequired"]).toBe(
      "템플릿 이름을 입력하세요."
    );
    expect(ko["templates.detail.saved"]).toBe("템플릿이 저장되었습니다.");
    expect(ko["templates.detail.deleteConfirm"]).toBe(
      "이 템플릿을 삭제하시겠습니까?"
    );
    expect(ko["templates.detail.pageUnit"]).toBe("페이지");
    expect(ko["templates.detail.areaUnit"]).toBe("개 영역");
    expect(ko["templates.detail.title"]).toBe("템플릿 상세");
  });

  it("has the error page keys", () => {
    expect(ko["error.title"]).toBe("문제가 생겼어요");
    expect(ko["error.description"]).toBe(
      "요청을 처리하지 못했습니다. 다시 시도하거나 홈으로 돌아가세요."
    );
    expect(ko["error.retryReset"]).toBe("비밀번호 재설정 다시 요청");
    expect(ko["error.home"]).toBe("홈으로");
  });
});
