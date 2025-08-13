import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentUpload from "@/components/document-upload";

export const metadata: Metadata = {
  title: "Seuk - Upload",
  description: "Upload and prepare a document for signing",
};

export default async function UploadPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?redirect=/upload");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-5xl mx-auto">
        <DocumentUpload />
      </div>
    </div>
  );
}
