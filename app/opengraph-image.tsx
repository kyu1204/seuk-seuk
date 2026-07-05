import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "슥슥 SeukSeuk";

// Icon-only brand image: no text means no Korean font to load,
// so this renders with zero external dependencies.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "linear-gradient(135deg, #ffffff 0%, #eff6ff 55%, #dbeafe 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 380,
            height: 380,
            backgroundColor: "#ffffff",
            borderRadius: 88,
            border: "1px solid #e2e8f0",
            boxShadow: "0 24px 64px rgba(37, 99, 235, 0.16)",
          }}
        >
          <svg
            width={220}
            height={220}
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
        </div>
      </div>
    ),
    size
  );
}
