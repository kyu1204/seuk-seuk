import { redirect } from "next/navigation";
import { getCachedUser } from "@/lib/supabase/server";
import { getUserDocuments, getDocumentSignatureCounts } from "@/app/actions/document-actions";
import PublishPageContent from "./components/PublishPageContent";

export default async function PublishPage({
  searchParams,
}: {
  searchParams: { doc?: string };
}) {
  // Check authentication (request-cached; shared with getUserDocuments below)
  const { user, error: authError } = await getCachedUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Get user's draft documents
  const { documents, error } = await getUserDocuments(1, 100, "draft");
  const signatureCounts = await getDocumentSignatureCounts(
    documents.map((document) => document.id)
  );

  return (
    <PublishPageContent
      documents={documents}
      error={error}
      signatureCounts={signatureCounts}
      preselectedDocumentId={searchParams.doc}
    />
  );
}
