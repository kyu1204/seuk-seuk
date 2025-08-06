import { createClient } from './supabase/server'
import bcrypt from 'bcryptjs'
import type { Database } from './database-types'

type DocumentShare = Database['public']['Tables']['document_shares']['Row']

export interface CreateShareLinkData {
  documentId: string
  password?: string
  maxUses?: number
  expiresAt?: string
  createdBy: string
}

export interface ShareLinkWithDocument extends DocumentShare {
  document: {
    id: string
    title: string
    file_name: string
    status: string
    user_id: string
  }
}

export interface ValidateShareResult {
  valid: boolean
  share?: DocumentShare
  document?: any
  error?: string
}

// Generate unique short URL
async function generateUniqueShortUrl(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let shortUrl: string
  let attempts = 0
  const maxAttempts = 10

  do {
    shortUrl = ''
    const length = 8 + Math.floor(attempts / 3) // Increase length if too many collisions
    
    for (let i = 0; i < length; i++) {
      shortUrl += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Check if URL already exists
    const { data } = await supabase
      .from('document_shares')
      .select('id')
      .eq('short_url', shortUrl)
      .single()

    if (!data) break

    attempts++
  } while (attempts < maxAttempts)

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique short URL')
  }

  return shortUrl
}

// Hash password for storage
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Verify password against hash
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create share link
export async function createShareLink(
  data: CreateShareLinkData
): Promise<{ shareLink: DocumentShare | null; shortUrl?: string; error?: string }> {
  try {
    // Generate unique short URL
    const shortUrl = await generateUniqueShortUrl()

    // Hash password if provided
    let passwordHash: string | undefined
    if (data.password) {
      passwordHash = await hashPassword(data.password)
    }

    // Create share record
    const { data: shareLink, error } = await supabase
      .from('document_shares')
      .insert({
        document_id: data.documentId,
        short_url: shortUrl,
        password_hash: passwordHash,
        max_uses: data.maxUses,
        expires_at: data.expiresAt,
        created_by: data.createdBy
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return { shareLink, shortUrl }
  } catch (error: any) {
    return {
      shareLink: null,
      error: error.message || 'Failed to create share link'
    }
  }
}

// Get share link by short URL
export async function getShareLink(
  shortUrl: string
): Promise<{ share: ShareLinkWithDocument | null; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select(`
        *,
        document:documents (
          id,
          title,
          file_name,
          status,
          user_id
        )
      `)
      .eq('short_url', shortUrl)
      .single()

    if (error) {
      throw error
    }

    return { share: data as ShareLinkWithDocument }
  } catch (error: any) {
    return {
      share: null,
      error: error.message || 'Share link not found'
    }
  }
}

// Validate share link access
export async function validateShareLink(
  shortUrl: string,
  password?: string
): Promise<ValidateShareResult> {
  try {
    // Get share link with document info
    const { share, error: shareError } = await getShareLink(shortUrl)
    
    if (shareError || !share) {
      return {
        valid: false,
        error: 'Share link not found'
      }
    }

    // Check if share link has expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'Share link has expired'
      }
    }

    // Check if share link has exceeded max uses
    if (share.max_uses && share.used_count >= share.max_uses) {
      return {
        valid: false,
        error: 'Share link has exceeded maximum uses'
      }
    }

    // Check if document is in published state
    if (share.document.status !== 'published') {
      return {
        valid: false,
        error: 'Document is not available for signing'
      }
    }

    // Verify password if required
    if (share.password_hash && !password) {
      return {
        valid: false,
        error: 'Password required'
      }
    }

    if (share.password_hash && password) {
      const passwordValid = await verifyPassword(password, share.password_hash)
      if (!passwordValid) {
        return {
          valid: false,
          error: 'Invalid password'
        }
      }
    }

    return {
      valid: true,
      share,
      document: share.document
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || 'Failed to validate share link'
    }
  }
}

// Increment share link usage count
export async function incrementShareUsage(
  shortUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_shares')
      .update({ 
        used_count: (await createClient()).sql`used_count + 1` 
      })
      .eq('short_url', shortUrl)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to increment usage count'
    }
  }
}

// Get share links for a document
export async function getDocumentShares(
  documentId: string,
  userId: string
): Promise<{ shares: DocumentShare[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return { shares: data }
  } catch (error: any) {
    return {
      shares: [],
      error: error.message || 'Failed to fetch share links'
    }
  }
}

// Update share link
export async function updateShareLink(
  shareId: string,
  updates: {
    password?: string | null
    maxUses?: number | null
    expiresAt?: string | null
  },
  userId: string
): Promise<{ share: DocumentShare | null; error?: string }> {
  try {
    let updateData: any = {}
    
    if (updates.password !== undefined) {
      updateData.password_hash = updates.password ? await hashPassword(updates.password) : null
    }
    
    if (updates.maxUses !== undefined) {
      updateData.max_uses = updates.maxUses
    }
    
    if (updates.expiresAt !== undefined) {
      updateData.expires_at = updates.expiresAt
    }

    const { data, error } = await supabase
      .from('document_shares')
      .update(updateData)
      .eq('id', shareId)
      .eq('created_by', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return { share: data }
  } catch (error: any) {
    return {
      share: null,
      error: error.message || 'Failed to update share link'
    }
  }
}

// Delete share link
export async function deleteShareLink(
  shareId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId)
      .eq('created_by', userId)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete share link'
    }
  }
}

// Get share link statistics
export async function getShareStats(
  documentId: string,
  userId: string
): Promise<{
  stats: {
    totalShares: number
    activeShares: number
    totalViews: number
  }
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('document_shares')
      .select('expires_at, used_count')
      .eq('document_id', documentId)
      .eq('created_by', userId)

    if (error) {
      throw error
    }

    const now = new Date()
    const activeShares = data.filter(share => 
      !share.expires_at || new Date(share.expires_at) > now
    ).length

    const totalViews = data.reduce((sum, share) => sum + share.used_count, 0)

    return {
      stats: {
        totalShares: data.length,
        activeShares,
        totalViews
      }
    }
  } catch (error: any) {
    return {
      stats: { totalShares: 0, activeShares: 0, totalViews: 0 },
      error: error.message || 'Failed to get share statistics'
    }
  }
}

// Generate full share URL
export function generateShareUrl(shortUrl: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/sign/${shortUrl}`
}