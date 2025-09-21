import { notFound } from "next/navigation";
import { getDocumentById } from "@/app/actions/document-actions";
import DocumentDetailComponent from "./components/DocumentDetailPage";

// This is a Server Component that fetches document data
interface PageProps {
  params: { id: string };
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = params;

  // Fetch document data server-side
  const { document, signatures, error } = await getDocumentById(id);

  if (error || !document) {
    notFound();
  }

  // Pass data to client component
  return (
    <DocumentDetailComponent documentData={document} signatures={signatures} />
  );
}
