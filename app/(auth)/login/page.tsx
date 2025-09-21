import type { Metadata } from "next"
import LoginPage from "./LoginPage"

export const metadata: Metadata = {
  title: "SeukSeuk - Login",
  description: "Log in to your SeukSeuk account",
}

export default function Login() {
  return <LoginPage />
}

