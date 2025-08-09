import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import SignPageClient from './SignPageClient'
import { validateDocumentShare } from '@/app/actions/sharing'

// Generate metadata for SEO and social sharing
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}): Promise<Metadata> {
  try {
    const { id } = await params
    
    // Try to get document info for metadata (without password)
    const result = await validateDocumentShare(id)
    
    if (result.success && result.data) {
      return {
        title: `Sign Document: ${result.data.document.title}`,
        description: `Sign the document "${result.data.document.title}" securely online`,
        robots: 'noindex, nofollow', // Don't index signing pages
      }
    }
    
    return {
      title: 'Sign Document',
      description: 'Secure document signing',
      robots: 'noindex, nofollow',
    }
  } catch (error) {
    return {
      title: 'Document Not Found',
      description: 'The requested document could not be found',
      robots: 'noindex, nofollow',
    }
  }
}

// Server Component for initial data loading
async function DocumentLoader({ shortUrl }: { shortUrl: string }) {
  try {
    // Attempt to load document without password first
    const result = await validateDocumentShare(shortUrl)
    
    if (result.success && result.data) {
      // Document loaded successfully
      return (
        <SignPageClient 
          shortUrl={shortUrl}
          initialData={result.data}
        />
      )
    } else if (result.requiresPassword) {
      // Password required
      return (
        <SignPageClient 
          shortUrl={shortUrl}
          requiresPassword={true}
          error={result.error}
        />
      )
    } else {
      // Document not found or other error
      return (
        <SignPageClient 
          shortUrl={shortUrl}
          error={result.error || 'Document not found'}
        />
      )
    }
  } catch (error) {
    console.error('Server-side document loading error:', error)
    return (
      <SignPageClient 
        shortUrl={shortUrl}
        error="Failed to load document"
      />
    )
  }
}

// Loading component for Suspense
function DocumentLoading() {
  return (
    <div className="container mx-auto px-4 py-16 flex justify-center items-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading document...</p>
      </div>
    </div>
  )
}

// Main page component (Server Component)
export default async function SignPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: shortUrl } = await params
  
  // Validate short URL format
  if (!shortUrl || shortUrl.length < 6 || shortUrl.length > 20) {
    notFound()
  }
  
  // Check for invalid characters in URL
  if (!/^[a-zA-Z0-9]+$/.test(shortUrl)) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<DocumentLoading />}>
        <DocumentLoader shortUrl={shortUrl} />
      </Suspense>
    </div>
  )
}