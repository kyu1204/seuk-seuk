import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getUserDocuments } from "@/app/actions/document-actions";
import PublishPageContent from "./components/PublishPageContent";

export default async function PublishPage() {
  // Check authentication (request-cached; shared with getUserDocuments below)
  const { user, error: authError } = await getCachedUser();

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

  return <PublishPageContent documents={documents} />;
}
