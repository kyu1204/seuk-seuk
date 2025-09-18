import type { Metadata } from "next"
import UploadPage from "./UploadPage"

export const metadata: Metadata = {
  title: "DocSign - Upload",
  description: "Upload and manage your documents",
}

export default function Upload() {
  return <UploadPage />
}

