import type { Metadata } from "next";
import RegisterPage from "./RegisterPage";

export const metadata: Metadata = {
  title: "회원가입",
  description:
    "슥슥에 무료로 가입하고 온라인 문서 서명 서비스를 시작하세요.",
  alternates: { canonical: "/register" },
};

export default function Register() {
  return <RegisterPage />;
}
