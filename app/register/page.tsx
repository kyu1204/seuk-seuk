import type { Metadata } from "next"
import { Suspense } from "react"
import RegisterPage from "./RegisterPage"

export const metadata: Metadata = {
  title: "Seuk - Register",
  description: "Create a new Seuk account",
}

export default function Register() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterPage />
    </Suspense>
  )
}

