import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database-types'

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