"use server"

import { createClient, createServiceRoleClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { Database, Tables, TablesInsert } from "@/lib/database-types"
import bcrypt from 'bcryptjs'

type Document = Tables<'documents'>
type DocumentInsert = TablesInsert<'documents'>
type SignatureArea = Tables<'signature_areas'>
type SignatureAreaInsert = TablesInsert<'signature_areas'>

export async function createDocument(
  formData: FormData
): Promise<{ success: boolean; data?: Document; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const file = formData.get('file') as File
    const title = formData.get('title') as string || file.name

    if (!file) {
      return { success: false, error: "File is required" }
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type. Only images and PDFs are allowed." }
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      return { success: false, error: "File size must be less than 50MB" }
    }

    // Generate unique file path
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `${user.id}/${fileName}`

    // Use Service Role client for Storage upload to bypass RLS
    const serviceRoleSupabase = createServiceRoleClient()

    // Upload file to storage using Service Role client
    const { data: uploadData, error: uploadError } = await serviceRoleSupabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return { success: false, error: `Upload failed: ${uploadError.message}` }
    }

    // Create document record using regular client (user context)
    const documentData: DocumentInsert = {
      user_id: user.id,
      title,
      file_name: file.name,
      file_path: uploadData.path,
      file_size: file.size,
      mime_type: file.type,
      status: 'draft'
    }

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await serviceRoleSupabase.storage.from('documents').remove([uploadData.path])
      return { success: false, error: `Database error: ${dbError.message}` }
    }

    revalidatePath('/dashboard')
    return { success: true, data: document }
  } catch (error) {
    console.error('Create document error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function getDocuments(): Promise<{ success: boolean; data?: Document[]; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: documents || [] }
  } catch (error) {
    console.error('Get documents error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function getDocumentById(
  id: string
): Promise<{ success: boolean; data?: Document & { signature_areas: SignatureArea[] }; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        signature_areas (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (docError) {
      return { success: false, error: docError.message }
    }

    return { success: true, data: document as any }
  } catch (error) {
    console.error('Get document error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function updateDocument(
  id: string,
  updates: Partial<Pick<Document, 'title' | 'status' | 'expires_at'>>
): Promise<{ success: boolean; data?: Document; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: document, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard')
    return { success: true, data: document }
  } catch (error) {
    console.error('Update document error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function deleteDocument(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get document to find file path
    const { data: document, error: getError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (getError || !document) {
      return { success: false, error: "Document not found" }
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.file_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete document record (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Delete document error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function saveSignatureAreas(
  documentId: string,
  areas: Array<{ x: number; y: number; width: number; height: number }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return { success: false, error: "Document not found or access denied" }
    }

    // Delete existing signature areas
    await supabase
      .from('signature_areas')
      .delete()
      .eq('document_id', documentId)

    // Insert new signature areas
    if (areas.length > 0) {
      const signatureAreasData: SignatureAreaInsert[] = areas.map((area, index) => ({
        document_id: documentId,
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
        order_index: index,
        required: true
      }))

      const { error: insertError } = await supabase
        .from('signature_areas')
        .insert(signatureAreasData)

      if (insertError) {
        return { success: false, error: insertError.message }
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Save signature areas error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function getDocumentSignedUrl(
  documentId: string
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Get document to find file path
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return { success: false, error: "Document not found" }
    }

    // Generate signed URL
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (urlError) {
      return { success: false, error: urlError.message }
    }

    return { success: true, data: signedUrl.signedUrl }
  } catch (error) {
    console.error('Get signed URL error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function createDocumentShare(
  documentId: string,
  options: {
    password?: string;
    expiresInDays?: number;
    maxUses?: number;
  } = {}
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return { success: false, error: "Document not found or access denied" }
    }

    // Generate unique short URL using nanoid
    // Use custom alphabet for URL-safe characters: A-Z, a-z, 0-9, _, -
    const { customAlphabet } = await import('nanoid')
    const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-', 12)
    let shortUrl = nanoid()
    
    // Ensure uniqueness by checking existing shares
    let isUnique = false
    let attempts = 0
    const maxAttempts = 5
    
    while (!isUnique && attempts < maxAttempts) {
      const { data: existingShare } = await supabase
        .from('document_shares')
        .select('id')
        .eq('short_url', shortUrl)
        .single()
      
      if (!existingShare) {
        isUnique = true
      } else {
        shortUrl = nanoid()
        attempts++
      }
    }
    
    if (!isUnique) {
      return { success: false, error: "Failed to generate unique URL after multiple attempts" }
    }

    // Hash password if provided
    let passwordHash: string | null = null
    if (options.password) {
      passwordHash = await bcrypt.hash(options.password, 10)
    }

    // Calculate expiry date
    let expiresAt: string | null = null
    if (options.expiresInDays) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + options.expiresInDays)
      expiresAt = expiry.toISOString()
    }

    // Create document share
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        short_url: shortUrl,
        password_hash: passwordHash,
        expires_at: expiresAt,
        max_uses: options.maxUses || null,
        created_by: user.id
      })
      .select()
      .single()

    if (shareError) {
      return { success: false, error: shareError.message }
    }

    // Update document status to published
    await supabase
      .from('documents')
      .update({ status: 'published' })
      .eq('id', documentId)
      .eq('user_id', user.id)

    console.log('📋 [createDocumentShare] 단축URL 생성 성공:', {
      documentId,
      shortUrl,
      hasPassword: !!options.password,
      expiresInDays: options.expiresInDays,
      maxUses: options.maxUses
    })

    return { success: true, data: shortUrl }
  } catch (error) {
    console.error('❌ [createDocumentShare] Create document share error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Get document shares for a user
export async function getDocumentShares(): Promise<{ 
  success: boolean; 
  data?: Array<{
    id: string;
    short_url: string;
    created_at: string;
    expires_at: string | null;
    max_uses: number | null;
    used_count: number;
    has_password: boolean;
    document: {
      id: string;
      title: string;
      status: string;
    };
  }>; 
  error?: string;
}> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    const { data: shares, error } = await supabase
      .from('document_shares')
      .select(`
        id,
        short_url,
        created_at,
        expires_at,
        max_uses,
        used_count,
        password_hash,
        documents (
          id,
          title,
          status
        )
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    const formattedShares = shares?.map(share => ({
      id: share.id,
      short_url: share.short_url,
      created_at: share.created_at,
      expires_at: share.expires_at,
      max_uses: share.max_uses,
      used_count: share.used_count || 0,
      has_password: !!share.password_hash,
      document: (share as any).documents
    })) || []

    return { success: true, data: formattedShares }
  } catch (error) {
    console.error('Get document shares error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// Delete a document share
export async function deleteDocumentShare(shareId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "Authentication required" }
    }

    // Verify ownership
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select('created_by')
      .eq('id', shareId)
      .single()

    if (shareError || !share) {
      return { success: false, error: "Share not found" }
    }

    if (share.created_by !== user.id) {
      return { success: false, error: "Access denied" }
    }

    // Delete the share
    const { error: deleteError } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete document share error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}
