import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "슥슥 SeukSeuk - 온라인 문서 서명 · Online Document Signing";

const BRAND_KO = "슥슥";
const BRAND_EN = "SeukSeuk";
const TAGLINE = "온라인 문서 서명 · Online Document Signing";
const DESCRIPTION = "링크 하나로 서명까지 · Collect signatures with a single link";
const DOMAIN = "seuk-seuk.com";

// Fetch a Korean font subset containing only the glyphs we render.
// Google Fonts' css2 endpoint returns a TTF subset when the `text` param is used.
async function loadKoreanFont(text: string, weight: 400 | 700) {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(
    text
  )}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/
  );
  if (!resource) {
    throw new Error("Failed to resolve font resource");
  }
  const res = await fetch(resource[1]);
  if (!res.ok) {
    throw new Error("Failed to download font");
  }
  return res.arrayBuffer();
}

export default async function Image() {
  const glyphs = `${BRAND_KO}${BRAND_EN}${TAGLINE}${DESCRIPTION}${DOMAIN}`;
  const [regular, bold] = await Promise.all([
    loadKoreanFont(glyphs, 400),
    loadKoreanFont(glyphs, 700),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          backgroundColor: "#ffffff",
          backgroundImage:
            "linear-gradient(135deg, #ffffff 0%, #eff6ff 55%, #dbeafe 100%)",
          fontFamily: "Noto Sans KR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg
            width={120}
            height={120}
            viewBox="-3 -3 30 30"
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 5-2.414-2.414A2 2 0 0 0 14.172 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2" />
            <path d="M21.378 12.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
            <path d="M8 18h1" />
          </svg>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 24,
            }}
          >
            <div style={{ fontSize: 110, fontWeight: 700, color: "#1e3a8a" }}>
              {BRAND_KO}
            </div>
            <div style={{ fontSize: 56, fontWeight: 700, color: "#2563eb" }}>
              {BRAND_EN}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: "#0f172a" }}>
          {TAGLINE}
        </div>
        <div style={{ fontSize: 30, fontWeight: 400, color: "#64748b" }}>
          {DESCRIPTION}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 48,
            fontSize: 26,
            color: "#94a3b8",
          }}
        >
          {DOMAIN}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Noto Sans KR", data: regular, weight: 400, style: "normal" },
        { name: "Noto Sans KR", data: bold, weight: 700, style: "normal" },
      ],
    }
  );
}
