import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentUpload from "@/components/document-upload";

export const metadata: Metadata = {
  title: "Seuk - Edit Document",
  description: "Edit document and signature areas",
};

export default async function UploadEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/login?redirect=/upload/${params.id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-5xl mx-auto">
        <DocumentUpload documentId={params.id} />
      </div>
    </div>
  );
}
