import { notFound } from "next/navigation";
import { getPublicationByShortUrl } from "@/app/actions/publication-actions";
import SignSingleDocument from "./components/SignSingleDocument";

interface PageProps {
  params: {
    id: string;
    documentId: string;
  };
}

export default async function SignDocumentPage({ params }: PageProps) {
  const { id, documentId } = params;

  // Fetch publication data server-side
  const { publication, requiresPassword, error } =
    await getPublicationByShortUrl(id);

  // Show 404 if publication doesn't exist
  if (!publication) {
    notFound();
  }

  // Find the specific document
  const document = publication.documents?.find(doc => doc.id === documentId);

  if (!document) {
    notFound();
  }

  // Log non-fatal errors for monitoring
  if (error && publication) {
    console.warn(`Non-fatal error for publication ${id}:`, error);
  }

  // Pass data to single document signing component
  return (
    <SignSingleDocument
      publicationData={publication}
      documentData={document}
      requiresPassword={requiresPassword || false}
    />
  );
}
