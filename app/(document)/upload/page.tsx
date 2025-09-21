import type { Metadata } from "next";
import UploadPageComponent from "./components/UploadPage";

export const metadata: Metadata = {
  title: "SeukSeuk - Upload",
  description: "Upload and manage your documents",
};

export default function UploadPage() {
  return <UploadPageComponent />;
}
