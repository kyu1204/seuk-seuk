import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database-types'
import { 
  DocumentWithStats, 
  DocumentFilter, 
  DocumentCounts, 
  SortOptions
} from './types/dashboard'

type Document = Database['public']['Tables']['documents']['Row']
type DocumentInsert = Database['public']['Tables']['documents']['Insert']
type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export async function getUserDocuments(userId?: string) {
  const supabase = await createClient()
  
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    userId = user.id
  }
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user documents:', error)
    throw error
  }
  
  return data
}

export async function getUserDocumentsClient() {
  const supabase = createBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching user documents:', error)
    throw error
  }
  
  return data
}

export async function getDocumentById(documentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()
  
  if (error) {
    console.error('Error fetching document:', error)
    throw error
  }
  
  return data
}

export async function createDocument(document: DocumentInsert) {
  const supabase = createBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('documents')
    .insert({
      ...document,
      user_id: user.id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating document:', error)
    throw error
  }
  
  return data
}

export async function updateDocument(documentId: string, updates: DocumentUpdate) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating document:', error)
    throw error
  }
  
  return data
}

export async function deleteDocument(documentId: string) {
  const supabase = createBrowserClient()
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
  
  if (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

export async function getDocumentsByStatus(status: Database['public']['Enums']['document_status']) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching documents by status:', error)
    throw error
  }
  
  return data
}

// Enhanced queries for dashboard with statistics
export async function getDocumentsWithStats(
  filter: DocumentFilter = 'all',
  searchQuery?: string,
  sortOptions: SortOptions = { field: 'created_at', order: 'desc' }
): Promise<{ data: DocumentWithStats[]; counts: DocumentCounts }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Base query with all relations
  let query = supabase
    .from('documents')
    .select(`
      *,
      signature_areas (
        id, x, y, width, height, order_index, required, 
        signer_name, signer_email, created_at
      ),
      signatures (
        id, signature_area_id, signer_name, signer_email, 
        signed_at, status
      ),
      document_shares (
        id, short_url, expires_at, used_count, max_uses, created_at
      )
    `)
    .eq('user_id', user.id)

  // Apply status filter
  if (filter !== 'all') {
    query = query.eq('status', filter)
  }

  // Apply search filter
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%, file_name.ilike.%${searchQuery}%`)
  }

  // Apply sorting
  query = query.order(sortOptions.field, { ascending: sortOptions.order === 'asc' })

  const { data: documents, error } = await query

  if (error) {
    console.error('Error fetching documents with stats:', error)
    throw error
  }

  // Transform documents to include statistics
  const documentsWithStats: DocumentWithStats[] = (documents || []).map(doc => {
    const signatureAreas = doc.signature_areas || []
    const signatures = doc.signatures || []
    const documentShares = doc.document_shares || []

    // Calculate signature statistics
    const total = signatureAreas.length
    const completed = signatures.filter(sig => sig.status === 'signed').length
    const pending = total - completed
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0

    // Calculate share information
    const activeShares = documentShares.filter(share => 
      !share.expires_at || new Date(share.expires_at) > new Date()
    )
    const hasActiveShare = activeShares.length > 0
    const shareCount = documentShares.length
    const lastAccessed = documentShares.length > 0 
      ? new Date(Math.max(...documentShares.map(share => new Date(share.created_at || '').getTime())))
      : undefined

    return {
      ...doc,
      signatureStats: {
        total,
        completed,
        pending,
        progress
      },
      shareInfo: {
        hasActiveShare,
        shareCount,
        lastAccessed
      },
      signature_areas: signatureAreas,
      signatures: signatures,
      document_shares: documentShares
    }
  })

  // Get counts for all statuses
  const { data: allDocs, error: countError } = await supabase
    .from('documents')
    .select('status')
    .eq('user_id', user.id)

  if (countError) {
    console.error('Error fetching document counts:', countError)
    throw countError
  }

  const counts: DocumentCounts = {
    all: allDocs?.length || 0,
    draft: allDocs?.filter(d => d.status === 'draft').length || 0,
    published: allDocs?.filter(d => d.status === 'published').length || 0,
    completed: allDocs?.filter(d => d.status === 'completed').length || 0,
    expired: allDocs?.filter(d => d.status === 'expired').length || 0
  }

  return { data: documentsWithStats, counts }
}