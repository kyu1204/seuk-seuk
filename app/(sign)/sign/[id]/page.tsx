import { notFound } from "next/navigation";
import { getDocumentByShortUrl } from "@/app/actions/document-actions";
import SignPageComponent from "./components/SignPage";

// This is now a Server Component that fetches data
interface PageProps {
  params: { id: string };
}

export default async function SignPage({ params }: PageProps) {
  const { id } = params;

  // Fetch document data server-side
  const { document, signatures, error, isExpired, isCompleted } =
    await getDocumentByShortUrl(id);

  // Only show 404 if document doesn't exist, not for expired/error states
  if (!document) {
    notFound();
  }

  // Log non-fatal errors for monitoring
  if (error && document) {
    console.warn(`Non-fatal error for document ${id}:`, error);
  }

  // Pass data to client component, including expiration status and error
  return (
    <SignPageComponent
      documentData={document}
      signatures={signatures}
      isExpired={isExpired}
      isCompleted={isCompleted}
    />
  );
}
