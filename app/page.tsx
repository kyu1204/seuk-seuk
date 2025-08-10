import type { Metadata } from "next"
import HomePage from "./HomePage"

export const metadata: Metadata = {
  title: "Seuk - Online Document Signing",
  description: "Upload, sign, and share documents online with ease",
}

export default function Home() {
  return <HomePage />
}

