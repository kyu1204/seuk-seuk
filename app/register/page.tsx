import type { Metadata } from "next"
import RegisterPage from "./RegisterPage"

export const metadata: Metadata = {
  title: "DocSign - Register",
  description: "Create a new DocSign account",
}

export default function Register() {
  return <RegisterPage />
}

