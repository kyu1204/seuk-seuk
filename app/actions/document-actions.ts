"use server"

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Document, DocumentInsert, Signature, SignatureInsert, SignatureArea } from '@/lib/supabase/database.types'

import { randomUUID } from 'crypto'

// Generate a random short URL
function generateShortUrl(): string {
  return Math.random().toString(36).substring(2, 15)
}

/**
 * Upload a file to Supabase Storage and create a document record
 */
export async function uploadDocument(formData: FormData) {
  try {
    const supabase = createServerClient()
    const file = formData.get('file') as File
    const filename = formData.get('filename') as string

    if (!file || !filename) {
      return { error: 'File and filename are required' }
    }

    // Generate unique filename using UUID
    const fileExtension = file.name.split('.').pop() || ''
    const uniqueFilename = `${randomUUID()}.${fileExtension}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(uniqueFilename, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Failed to upload file' }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uniqueFilename)

    // Generate short URL
    const shortUrl = generateShortUrl()

    // Create document record (without signature areas)
    const documentData: DocumentInsert = {
      filename,
      file_url: publicUrl,
      short_url: shortUrl,
      status: 'draft'
    }

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return { error: 'Failed to create document record' }
    }

    return { success: true, document, shortUrl }
  } catch (error) {
    console.error('Upload document error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get document by short URL
 */
export async function getDocumentByShortUrl(shortUrl: string): Promise<{ document: Document | null; signatures: Signature[]; error?: string }> {
  try {
    const supabase = createServerClient()

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('short_url', shortUrl)
      .single()

    if (docError || !document) {
      return { document: null, signatures: [], error: 'Document not found' }
    }

    // Get existing signatures
    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', document.id)
      .order('area_index')

    if (sigError) {
      console.error('Signatures error:', sigError)
      return { document, signatures: [], error: 'Failed to load signatures' }
    }

    return { document, signatures: signatures || [] }
  } catch (error) {
    console.error('Get document error:', error)
    return { document: null, signatures: [], error: 'An unexpected error occurred' }
  }
}

/**
 * Save a signature for a specific signature area
 */
export async function saveSignature(documentId: string, areaIndex: number, signatureData: string) {
  try {
    const supabase = createServerClient()

    // Update signature with data, status, and signed_at
    const { error: updateError } = await supabase
      .from('signatures')
      .update({
        signature_data: signatureData,
        status: 'signed',
        signed_at: new Date().toISOString()
      })
      .eq('document_id', documentId)
      .eq('area_index', areaIndex)

    if (updateError) {
      console.error('Update signature error:', updateError)
      return { error: 'Failed to update signature' }
    }

    // Revalidate the signing page
    revalidatePath(`/sign/[id]`, 'page')

    return { success: true }
  } catch (error) {
    console.error('Save signature error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Mark document as completed
 */
export async function markDocumentCompleted(documentId: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (error) {
      console.error('Mark completed error:', error)
      return { error: 'Failed to mark document as completed' }
    }

    return { success: true }
  } catch (error) {
    console.error('Mark completed error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Create signature areas for a document
 */
export async function createSignatureAreas(
  documentId: string,
  signatureAreas: SignatureArea[]
) {
  try {
    const supabase = createServerClient()

    const signatureInserts: SignatureInsert[] = signatureAreas.map((area, index) => ({
      document_id: documentId,
      area_index: index,
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      status: 'pending',
      signature_data: null
    }))

    const { error } = await supabase
      .from('signatures')
      .insert(signatureInserts)

    if (error) {
      console.error('Create signature areas error:', error)
      return { error: 'Failed to create signature areas' }
    }

    return { success: true }
  } catch (error) {
    console.error('Create signature areas error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get document by ID (for server components)
 */
export async function getDocumentById(id: string): Promise<{ document: Document | null; signatures: Signature[]; error?: string }> {
  try {
    const supabase = createServerClient()

    // Get document
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (docError || !document) {
      return { document: null, signatures: [], error: 'Document not found' }
    }

    // Get existing signatures (including signature areas)
    const { data: signatures, error: sigError } = await supabase
      .from('signatures')
      .select('*')
      .eq('document_id', document.id)
      .order('area_index')

    if (sigError) {
      console.error('Signatures error:', sigError)
      return { document, signatures: [], error: 'Failed to load signatures' }
    }

    return { document, signatures: signatures || [] }
  } catch (error) {
    console.error('Get document by ID error:', error)
    return { document: null, signatures: [], error: 'An unexpected error occurred' }
  }
}