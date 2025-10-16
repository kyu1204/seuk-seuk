import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUserDocuments } from "@/app/actions/document-actions";
import PublishPageContent from "./components/PublishPageContent";

export default async function PublishPage() {
  const supabase = await createServerSupabase();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's draft documents
  const { documents, error } = await getUserDocuments(1, 100, "draft");

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">문서 발행</h1>
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">문서 발행</h1>
          <div className="bg-muted px-4 py-8 rounded-lg text-center">
            <p className="text-muted-foreground mb-4">
              발행할 수 있는 문서가 없습니다.
            </p>
            <a
              href="/upload"
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              문서 업로드하기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <PublishPageContent documents={documents} />;
}
