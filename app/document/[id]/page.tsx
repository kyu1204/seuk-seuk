import { notFound } from "next/navigation"
import { getDocumentById } from "@/app/actions/document-actions"
import DocumentDetailClient from "./DocumentDetailClient"

// This is a Server Component that fetches document data
interface PageProps {
  params: { id: string }
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = params

  // Fetch document data server-side
  const { document, signatures, error } = await getDocumentById(id)

  if (error || !document) {
    notFound()
  }

  // Pass data to client component
  return <DocumentDetailClient documentData={document} signatures={signatures} />
}