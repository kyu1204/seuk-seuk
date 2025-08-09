'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Types
export interface ShareOptions {
  shortUrl?: string
  password?: string
  maxUses?: number
  expiresAt?: string | Date
}

export interface CreateShareResult {
  success: boolean
  data?: {
    shortUrl: string
    shareUrl: string
    id: string
  }
  error?: string
}

export interface ShareValidationResult {
  success: boolean
  data?: {
    document: any
    signedUrl: string
    shareId: string
  }
  error?: string
  requiresPassword?: boolean
}

// Enhanced short URL generation with collision detection
function generateSecureShortUrl(length: number = 8): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const bytes = crypto.randomBytes(length)
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length]
  }
  
  return result
}

// Create a secure sharing link with enhanced security
export async function createDocumentShare(
  documentId: string, 
  options: ShareOptions = {}
): Promise<CreateShareResult> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, status, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return { success: false, error: 'Document not found or access denied' }
    }

    // Only allow sharing of published documents
    if (document.status !== 'published') {
      return { success: false, error: 'Only published documents can be shared' }
    }

    // Generate secure short URL with collision detection
    let shortUrl = options.shortUrl
    if (!shortUrl) {
      let attempts = 0
      const maxAttempts = 5
      
      do {
        shortUrl = generateSecureShortUrl()
        const { data: existing } = await supabase
          .from('document_shares')
          .select('id')
          .eq('short_url', shortUrl)
          .single()
        
        if (!existing) break
        attempts++
      } while (attempts < maxAttempts)
      
      if (attempts >= maxAttempts) {
        return { success: false, error: 'Failed to generate unique short URL' }
      }
    }

    // Hash password with enhanced security (12 salt rounds)
    let passwordHash: string | null = null
    if (options.password) {
      passwordHash = await bcrypt.hash(options.password, 14)
    }

    // Set default expiry (7 days from now) if not provided
    const expiresAt = options.expiresAt 
      ? (typeof options.expiresAt === 'string' ? options.expiresAt : options.expiresAt.toISOString())
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .insert({
        document_id: documentId,
        short_url: shortUrl,
        password_hash: passwordHash,
        max_uses: options.maxUses || null,
        expires_at: expiresAt,
        used_count: 0,
        created_by: user.id
      })
      .select()
      .single()

    if (shareError) {
      console.error('Create share error:', shareError)
      return { success: false, error: 'Failed to create sharing link' }
    }

    // Revalidate dashboard to show new share
    revalidatePath('/dashboard')

    // Generate full share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/sign/${shortUrl}`

    return {
      success: true,
      data: {
        shortUrl: shortUrl!,
        shareUrl,
        id: share.id
      }
    }

  } catch (error) {
    console.error('Create document share error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Validate and get shared document with enhanced security
export async function validateDocumentShare(
  shortUrl: string,
  password?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<ShareValidationResult> {
  try {
    const supabase = await createClient()

    // Get document share with all related data
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select(`
        *,
        documents!inner (
          *,
          signature_areas (*),
          signatures (*)
        )
      `)
      .eq('short_url', shortUrl)
      .single()

    if (shareError || !share) {
      return { success: false, error: 'Document not found or link has expired' }
    }

    // Check if share has expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { success: false, error: 'Document link has expired' }
    }

    // Check usage limits
    if (share.max_uses && share.used_count && share.used_count >= share.max_uses) {
      return { success: false, error: 'Document link usage limit exceeded' }
    }

    // Get document data
    const document = (share as any).documents
    if (!document || document.status !== 'published') {
      return { success: false, error: 'Document is not available for signing' }
    }

    // Check password if required
    if (share.password_hash) {
      if (!password) {
        return { 
          success: false, 
          requiresPassword: true, 
          error: 'Password required to access this document' 
        }
      }

      const passwordMatch = await bcrypt.compare(password, share.password_hash)
      if (!passwordMatch) {
        return { 
          success: false, 
          requiresPassword: true, 
          error: 'Invalid password' 
        }
      }
    }

    // Generate signed URL for document file
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (urlError || !signedUrl) {
      console.error('Signed URL error:', urlError)
      return { success: false, error: 'Failed to access document file' }
    }

    // Track access (increment used count)
    const { error: updateError } = await supabase
      .from('document_shares')
      .update({ 
        used_count: (share.used_count || 0) + 1
      })
      .eq('id', share.id)

    if (updateError) {
      console.warn('Failed to update usage count:', updateError)
    }

    // Log access for audit trail (console logging for now)
    if (process.env.NODE_ENV === 'production') {
      console.log(`Document access logged: share_id=${share.id}, document_id=${document.id}, password_required=${!!share.password_hash}`)
    }

    return {
      success: true,
      data: {
        document,
        signedUrl: signedUrl.signedUrl,
        shareId: share.id
      }
    }

  } catch (error) {
    console.error('Validate document share error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Update sharing settings
export async function updateDocumentShare(
  shareId: string,
  options: Partial<ShareOptions>
): Promise<CreateShareResult> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify share ownership
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select('*, documents!inner(user_id)')
      .eq('id', shareId)
      .single()

    if (shareError || !share || (share as any).documents.user_id !== user.id) {
      return { success: false, error: 'Share not found or access denied' }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (options.password !== undefined) {
      updateData.password_hash = options.password 
        ? await bcrypt.hash(options.password, 14) 
        : null
    }
    
    if (options.maxUses !== undefined) {
      updateData.max_uses = options.maxUses
    }
    
    if (options.expiresAt !== undefined) {
      updateData.expires_at = typeof options.expiresAt === 'string' 
        ? options.expiresAt 
        : options.expiresAt?.toISOString()
    }

    // Note: document_shares table doesn't have updated_at column

    // Update share
    const { data: updatedShare, error: updateError } = await supabase
      .from('document_shares')
      .update(updateData)
      .eq('id', shareId)
      .select()
      .single()

    if (updateError) {
      return { success: false, error: 'Failed to update sharing settings' }
    }

    revalidatePath('/dashboard')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/sign/${updatedShare.short_url}`

    return {
      success: true,
      data: {
        shortUrl: updatedShare.short_url,
        shareUrl,
        id: updatedShare.id
      }
    }

  } catch (error) {
    console.error('Update document share error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Delete a sharing link
export async function deleteDocumentShare(shareId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Verify share ownership and delete
    const { error: deleteError } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId)
      .eq('created_by', user.id)

    if (deleteError) {
      return { success: false, error: 'Failed to delete sharing link' }
    }

    revalidatePath('/dashboard')
    
    return { success: true }

  } catch (error) {
    console.error('Delete document share error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get all shares for a user's documents
export async function getUserDocumentShares(documentId?: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    let query = supabase
      .from('document_shares')
      .select(`
        *,
        documents!inner (
          id,
          title,
          status,
          user_id
        )
      `)
      .eq('documents.user_id', user.id)

    if (documentId) {
      query = query.eq('document_id', documentId)
    }

    const { data: shares, error: sharesError } = await query
      .order('created_at', { ascending: false })

    if (sharesError) {
      throw sharesError
    }

    return shares || []

  } catch (error) {
    console.error('Get user document shares error:', error)
    throw error
  }
}