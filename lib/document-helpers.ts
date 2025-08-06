import { createClient } from './supabase/server'
import type { Database } from './database-types'

type Document = Database['public']['Tables']['documents']['Row']
type SignatureArea = Database['public']['Tables']['signature_areas']['Row']
type Signature = Database['public']['Tables']['signatures']['Row']

export interface DocumentWithAreas extends Document {
  signature_areas: SignatureArea[]
  signatures?: Signature[]
}

export interface CreateDocumentData {
  title: string
  filePath: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface CreateSignatureAreaData {
  documentId: string
  x: number
  y: number
  width: number
  height: number
  orderIndex?: number
  required?: boolean
  signerName?: string
  signerEmail?: string
}

// Get documents for current user
export async function getUserDocuments(
  userId: string,
  status?: Document['status']
): Promise<{ documents: DocumentWithAreas[]; error?: string }> {
  try {
    let query = (await createClient())
      .from('documents')
      .select(`
        *,
        signature_areas (*),
        signatures (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return { documents: data as DocumentWithAreas[] }
  } catch (error: any) {
    return {
      documents: [],
      error: error.message || 'Failed to fetch documents'
    }
  }
}

// Get single document with areas and signatures
export async function getDocument(
  documentId: string,
  userId?: string
): Promise<{ document: DocumentWithAreas | null; error?: string }> {
  try {
    let query = (await createClient())
      .from('documents')
      .select(`
        *,
        signature_areas (*),
        signatures (*)
      `)
      .eq('id', documentId)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.single()

    if (error) {
      throw error
    }

    return { document: data as DocumentWithAreas }
  } catch (error: any) {
    return {
      document: null,
      error: error.message || 'Failed to fetch document'
    }
  }
}

// Create new document
export async function createDocument(
  data: CreateDocumentData,
  userId: string
): Promise<{ document: Document | null; error?: string }> {
  try {
    const { data: document, error } = await (await createClient())
      .from('documents')
      .insert({
        user_id: userId,
        title: data.title,
        file_name: data.fileName,
        file_path: data.filePath,
        file_size: data.fileSize,
        mime_type: data.mimeType,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { document }
  } catch (error: any) {
    return {
      document: null,
      error: error.message || 'Failed to create document'
    }
  }
}

// Update document
export async function updateDocument(
  documentId: string,
  updates: Partial<Document>,
  userId: string
): Promise<{ document: Document | null; error?: string }> {
  try {
    const { data: document, error } = await (await createClient())
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { document }
  } catch (error: any) {
    return {
      document: null,
      error: error.message || 'Failed to update document'
    }
  }
}

// Delete document
export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (await createClient())
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete document'
    }
  }
}

// Create signature area
export async function createSignatureArea(
  data: CreateSignatureAreaData
): Promise<{ signatureArea: SignatureArea | null; error?: string }> {
  try {
    const { data: signatureArea, error } = await (await createClient())
      .from('signature_areas')
      .insert({
        document_id: data.documentId,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        order_index: data.orderIndex || 0,
        required: data.required !== false,
        signer_name: data.signerName,
        signer_email: data.signerEmail
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { signatureArea }
  } catch (error: any) {
    return {
      signatureArea: null,
      error: error.message || 'Failed to create signature area'
    }
  }
}

// Update signature area
export async function updateSignatureArea(
  areaId: string,
  updates: Partial<SignatureArea>
): Promise<{ signatureArea: SignatureArea | null; error?: string }> {
  try {
    const { data: signatureArea, error } = await (await createClient())
      .from('signature_areas')
      .update(updates)
      .eq('id', areaId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { signatureArea }
  } catch (error: any) {
    return {
      signatureArea: null,
      error: error.message || 'Failed to update signature area'
    }
  }
}

// Delete signature area
export async function deleteSignatureArea(
  areaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (await createClient())
      .from('signature_areas')
      .delete()
      .eq('id', areaId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete signature area'
    }
  }
}

// Create signature
export async function createSignature(
  documentId: string,
  signatureAreaId: string,
  signatureData: string,
  signerInfo?: {
    name?: string
    email?: string
    ip?: string
  }
): Promise<{ signature: Signature | null; error?: string }> {
  try {
    const { data: signature, error } = await (await createClient())
      .from('signatures')
      .insert({
        document_id: documentId,
        signature_area_id: signatureAreaId,
        signature_data: signatureData,
        signer_name: signerInfo?.name,
        signer_email: signerInfo?.email,
        signer_ip: signerInfo?.ip,
        status: 'signed'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { signature }
  } catch (error: any) {
    return {
      signature: null,
      error: error.message || 'Failed to create signature'
    }
  }
}

// Check if all signature areas are signed
export async function checkDocumentComplete(
  documentId: string
): Promise<{ complete: boolean; error?: string }> {
  try {
    // Get required signature areas count
    const { count: requiredCount, error: areasError } = await (await createClient())
      .from('signature_areas')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .eq('required', true)

    if (areasError) {
      throw areasError
    }

    // Get signed areas count
    const { count: signedCount, error: signaturesError } = await (await createClient())
      .from('signatures')
      .select('signature_area_id', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .eq('status', 'signed')
      .in('signature_area_id', 
        (await createClient())
          .from('signature_areas')
          .select('id')
          .eq('document_id', documentId)
          .eq('required', true)
      )

    if (signaturesError) {
      throw signaturesError
    }

    const complete = (requiredCount || 0) > 0 && (signedCount || 0) >= (requiredCount || 0)

    return { complete }
  } catch (error: any) {
    return {
      complete: false,
      error: error.message || 'Failed to check document completion'
    }
  }
}

// Get document statistics for dashboard
export async function getDocumentStats(
  userId: string
): Promise<{
  stats: {
    total: number
    draft: number
    published: number
    completed: number
    expired: number
  }
  error?: string
}> {
  try {
    const { data, error } = await (await createClient())
      .from('documents')
      .select('status')
      .eq('user_id', userId)

    if (error) {
      throw error
    }

    const stats = {
      total: data.length,
      draft: data.filter(d => d.status === 'draft').length,
      published: data.filter(d => d.status === 'published').length,
      completed: data.filter(d => d.status === 'completed').length,
      expired: data.filter(d => d.status === 'expired').length,
    }

    return { stats }
  } catch (error: any) {
    return {
      stats: { total: 0, draft: 0, published: 0, completed: 0, expired: 0 },
      error: error.message || 'Failed to get document statistics'
    }
  }
}