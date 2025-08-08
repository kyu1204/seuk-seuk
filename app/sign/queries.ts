import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database-types'

type SignatureArea = Database['public']['Tables']['signature_areas']['Row']
type SignatureAreaInsert = Database['public']['Tables']['signature_areas']['Insert']
type Signature = Database['public']['Tables']['signatures']['Row']
type SignatureInsert = Database['public']['Tables']['signatures']['Insert']
type DocumentShare = Database['public']['Tables']['document_shares']['Row']

export async function getDocumentByShareUrl(shortUrl: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('document_shares')
    .select(`
      *,
      documents (
        id,
        title,
        file_name,
        file_path,
        status,
        created_at
      )
    `)
    .eq('short_url', shortUrl)
    .single()
  
  if (error) {
    console.error('Error fetching document by share URL:', error)
    throw error
  }
  
  // Check if share is still valid
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error('Share link has expired')
  }
  
  if (data.max_uses && data.used_count >= data.max_uses) {
    throw new Error('Share link usage limit exceeded')
  }
  
  return data
}

export async function getSignatureAreas(documentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('signature_areas')
    .select('*')
    .eq('document_id', documentId)
    .order('order_index', { ascending: true })
  
  if (error) {
    console.error('Error fetching signature areas:', error)
    throw error
  }
  
  return data
}

export async function createSignatureAreas(signatureAreas: SignatureAreaInsert[]) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('signature_areas')
    .insert(signatureAreas)
    .select()
  
  if (error) {
    console.error('Error creating signature areas:', error)
    throw error
  }
  
  return data
}

export async function getSignatures(documentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('signatures')
    .select(`
      *,
      signature_areas (
        id,
        x,
        y,
        width,
        height,
        order_index,
        signer_name,
        signer_email
      )
    `)
    .eq('document_id', documentId)
    .order('signed_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching signatures:', error)
    throw error
  }
  
  return data
}

export async function createSignature(signature: SignatureInsert) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase
    .from('signatures')
    .insert(signature)
    .select()
    .single()
  
  if (error) {
    console.error('Error creating signature:', error)
    throw error
  }
  
  return data
}

export async function incrementShareUsage(shareId: string) {
  const supabase = await createClient()
  
  // First get the current used_count
  const { data: currentShare, error: fetchError } = await supabase
    .from('document_shares')
    .select('used_count')
    .eq('id', shareId)
    .single()
  
  if (fetchError) {
    console.error('Error fetching current share:', fetchError)
    throw fetchError
  }
  
  // Then increment it
  const { data, error } = await supabase
    .from('document_shares')
    .update({ used_count: (currentShare.used_count || 0) + 1 })
    .eq('id', shareId)
    .select()
    .single()
  
  if (error) {
    console.error('Error incrementing share usage:', error)
    throw error
  }
  
  return data
}

export async function createDocumentShare(documentId: string, options: {
  shortUrl: string
  password?: string
  maxUses?: number
  expiresAt?: string
}) {
  const supabase = createBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')
  
  const { data, error } = await supabase
    .from('document_shares')
    .insert({
      document_id: documentId,
      short_url: options.shortUrl,
      password_hash: options.password, // Should be hashed before calling this function
      max_uses: options.maxUses,
      expires_at: options.expiresAt,
      created_by: user.id
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error creating document share:', error)
    throw error
  }
  
  return data
}

export async function getDocumentShare(documentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('document_shares')
    .select('*')
    .eq('document_id', documentId)
    .single()
  
  if (error) {
    console.error('Error fetching document share:', error)
    throw error
  }
  
  return data
}