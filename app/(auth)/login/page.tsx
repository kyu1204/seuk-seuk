import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "로그인",
  description: "슥슥에 로그인하여 문서 서명을 관리하세요.",
  alternates: { canonical: "/login" },
};

export default function Login() {
  return <LoginPage />;
}
