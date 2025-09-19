import { notFound } from "next/navigation"
import { getDocumentByShortUrl } from "@/app/actions/document-actions"
import SignPageClient from "./SignPageClient"

// This is now a Server Component that fetches data
interface PageProps {
  params: { id: string }
}

export default async function SignPage({ params }: PageProps) {
  const { id } = params

  // Fetch document data server-side
  const { document, signatures, error, isExpired } = await getDocumentByShortUrl(id)

  if (error || !document) {
    notFound()
  }

  // Pass data to client component, including expiration status
  return <SignPageClient documentData={document} signatures={signatures} isExpired={isExpired} />
}