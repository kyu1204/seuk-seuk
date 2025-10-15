import { notFound } from "next/navigation";
import { getPublicationByShortUrl } from "@/app/actions/publication-actions";
import SignDocumentList from "./components/SignDocumentList";

// This is now a Server Component that fetches data and shows document list
interface PageProps {
  params: { id: string };
}

export default async function SignPage({ params }: PageProps) {
  const { id } = params;

  // Fetch publication data server-side (includes all documents)
  const { publication, requiresPassword, error } =
    await getPublicationByShortUrl(id);

  // Only show 404 if publication doesn't exist
  if (!publication) {
    notFound();
  }

  // Log non-fatal errors for monitoring
  if (error && publication) {
    console.warn(`Non-fatal error for publication ${id}:`, error);
  }

  // Pass data to document list component (shows multiple documents)
  return (
    <SignDocumentList
      publicationData={publication}
      requiresPassword={requiresPassword || false}
    />
  );
}
