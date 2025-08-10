import type { Metadata } from "next"
import { Suspense } from "react"
import LoginPage from "./LoginPage"

export const metadata: Metadata = {
  title: "Seuk - Login",
  description: "Log in to your Seuk account",
}

export default function Login() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPage />
    </Suspense>
  )
}

