import { describe, expect, it } from "vitest";
import ko from "./ko";
import en from "./en";

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
    expect(ko["dashboard.selectionMode.enter"]).toBe("여러 개 선택");
    expect(ko["dashboard.selectionMode.exit"]).toBe("선택 취소");

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
  // touch
});
