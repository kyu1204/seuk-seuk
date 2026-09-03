"use client";

/**
 * 홈 전용 CSS 일러스트. WebGL 없이 CSS 3D 변환과 scroll-driven 애니메이션만 쓴다.
 * 모든 모션은 globals.css 의 prefers-reduced-motion 게이트 뒤에 있고,
 * 기본 상태는 "완성된 모습"이라 모션이 꺼져도 그림은 온전히 보인다.
 */

import { Check, FileText, Link2, Lock, CalendarDays, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";

/** 아이소메트릭 문서 스택. 스크롤에 따라 세 장이 위로 펼쳐진다(3D). */
export function IsoDocStack({ className }: { className?: string }) {
  const { t } = useLanguage();
  const sheet =
    "absolute left-1/2 top-1/2 h-40 w-32 -translate-x-1/2 -translate-y-1/2 rounded-md border bg-card shadow-[0_18px_40px_-18px_hsl(var(--foreground)/0.35)]";
  return (
    <div className={cn("home-iso relative h-64 w-full [perspective:1000px]", className)} aria-hidden>
      <div className="home-iso-scene absolute inset-0 [transform-style:preserve-3d]">
        {/* 바닥: 원본 문서 */}
        <div className={cn(sheet, "home-iso-sheet")} style={{ "--z": "0px" } as React.CSSProperties}>
          <div className="space-y-2 p-4">
            <div className="h-2 w-3/4 rounded bg-muted" />
            <div className="h-2 rounded bg-muted" />
            <div className="h-2 w-5/6 rounded bg-muted" />
            <div className="h-2 w-2/3 rounded bg-muted" />
          </div>
        </div>
        {/* 중간: 서명 칸 레이어 */}
        <div className={cn(sheet, "home-iso-sheet border-primary/40 bg-primary/5")} style={{ "--z": "44px" } as React.CSSProperties}>
          <div className="absolute bottom-5 left-4 right-4 flex h-10 items-center justify-center rounded border-2 border-dashed border-primary/60 bg-background/70 text-[10px] font-medium text-primary">
            {t("home.art.sign")}
          </div>
        </div>
        {/* 위: 완료 도장 */}
        <div className={cn(sheet, "home-iso-sheet border-seal/40 bg-seal-soft/60")} style={{ "--z": "88px" } as React.CSSProperties}>
          <div className="home-seal absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-seal text-seal">
            <Check className="h-6 w-6" strokeWidth={3} />
          </div>
          <svg viewBox="0 0 120 40" className="absolute bottom-6 left-4 h-8 w-20" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 30 C 14 8, 22 8, 26 22 S 34 36, 40 22 S 50 6, 58 20 S 70 34, 80 20 C 88 10, 98 14, 112 22" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** 1단계: 파일이 드롭존으로 떠오른다. */
export function StepUploadArt() {
  return (
    <div className="home-art relative flex h-36 items-end justify-center overflow-hidden rounded-lg bg-muted/60" aria-hidden>
      <div className="mb-4 flex h-20 w-44 items-center justify-center rounded-md border-2 border-dashed border-primary/40 bg-background/70">
        <Upload className="h-5 w-5 text-primary/70" />
      </div>
      <div className="home-float-file absolute left-1/2 top-6 flex h-14 w-11 -translate-x-1/2 items-center justify-center rounded border bg-card shadow-md">
        <FileText className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
    </div>
  );
}

/** 2단계: 문서 위에 서명 칸이 그려진다. */
export function StepFieldsArt() {
  return (
    <div className="home-art relative flex h-36 items-center justify-center overflow-hidden rounded-lg bg-muted/60" aria-hidden>
      <div className="relative h-28 w-24 rounded border bg-card p-3 shadow-sm">
        <div className="space-y-1.5">
          <div className="h-1.5 w-3/4 rounded bg-muted" />
          <div className="h-1.5 rounded bg-muted" />
          <div className="h-1.5 w-5/6 rounded bg-muted" />
        </div>
        <div className="home-draw-field absolute bottom-3 left-3 h-7 w-16 origin-top-left rounded-sm border-2 border-primary bg-primary/10" />
      </div>
      <div className="home-cursor absolute bottom-7 left-1/2 h-4 w-4 translate-x-6 rounded-full border-2 border-foreground/70 bg-background" />
    </div>
  );
}

/** 3단계: 메시지 말풍선에 링크가 실려 나간다. */
export function StepSendArt() {
  const { t } = useLanguage();
  return (
    <div className="home-art relative flex h-36 flex-col items-start justify-center gap-2 overflow-hidden rounded-lg bg-muted/60 px-6" aria-hidden>
      <div className="h-8 w-28 rounded-2xl rounded-bl-sm bg-card shadow-sm" />
      <div className="home-bubble ml-auto flex items-center gap-2 rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground shadow-md">
        <Link2 className="h-3.5 w-3.5" />
        <span className="font-medium">seukseuk.com/s/9kx2</span>
      </div>
      <div className="home-bubble-check ml-auto mr-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <Check className="h-3 w-3 text-seal" /> {t("home.art.viewed")}
      </div>
    </div>
  );
}

/** 벤토: 템플릿 카드 3장이 부채꼴로 겹친다. */
export function ArtTemplates() {
  return (
    <div className="home-art relative h-28 w-full" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="home-fan absolute left-1/2 top-2 h-24 w-20 rounded-md border bg-card p-2.5 shadow-sm"
          style={{ "--i": i } as React.CSSProperties}
        >
          <div className="space-y-1">
            <div className="h-1.5 w-2/3 rounded bg-muted" />
            <div className="h-1.5 rounded bg-muted" />
          </div>
          <div className="absolute bottom-2 left-2.5 right-2.5 h-4 rounded-sm border border-dashed border-primary/50 bg-primary/5" />
        </div>
      ))}
    </div>
  );
}

/** 벤토: 링크 하나에 문서 여러 개가 묶인다. */
export function ArtBundle() {
  const { t } = useLanguage();
  return (
    <div className="home-art flex h-28 w-full items-center justify-center gap-3" aria-hidden>
      <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium shadow-sm">
        <Link2 className="h-3.5 w-3.5 text-primary" /> {t("home.art.oneLink")}
      </div>
      <div className="h-px w-6 bg-border" />
      <div className="flex flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="home-slide-in flex items-center gap-1.5 rounded border bg-card px-2 py-1 text-[10px] text-muted-foreground shadow-sm" style={{ "--i": i } as React.CSSProperties}>
            <FileText className="h-3 w-3" /> {t("home.art.doc", { n: i + 1 })}
          </div>
        ))}
      </div>
    </div>
  );
}

/** 벤토: 자물쇠와 유효기간. */
export function ArtLock() {
  return (
    <div className="home-art flex h-24 w-full items-center justify-center gap-4" aria-hidden>
      <div className="home-lock flex h-14 w-14 items-center justify-center rounded-xl border bg-card text-primary shadow-sm">
        <Lock className="h-6 w-6" />
      </div>
      <div className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs shadow-sm">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="tabular-nums">D-14</span>
      </div>
    </div>
  );
}

/** 벤토: 서명본 PDF 위에 도장이 찍힌다. */
export function ArtSealPdf() {
  return (
    <div className="home-art relative flex h-24 w-full items-center justify-center" aria-hidden>
      <div className="relative flex h-20 w-16 flex-col items-center justify-end rounded-md border bg-card pb-2 shadow-sm">
        <span className="text-[9px] font-semibold tracking-wider text-muted-foreground">PDF</span>
        <div className="home-stamp absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-seal bg-seal-soft text-seal">
          <Check className="h-5 w-5" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}

/** 벤토: 진행 상황 막대 세 개가 채워진다. */
export function ArtProgress() {
  const rows = [
    { w: "100%", done: true },
    { w: "66%", done: false },
    { w: "33%", done: false },
  ];
  return (
    <div className="home-art flex h-24 w-full flex-col justify-center gap-2.5 px-2" aria-hidden>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="home-bar h-full rounded-full bg-primary" style={{ "--w": r.w, "--i": i } as React.CSSProperties} />
          </div>
          {r.done ? <Check className="h-3.5 w-3.5 text-seal" /> : <span className="h-3.5 w-3.5" />}
        </div>
      ))}
    </div>
  );
}
