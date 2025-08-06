import { createClient } from './supabase/server'
import { v4 as uuidv4 } from 'uuid'

export interface FileUploadResult {
  path: string
  publicUrl?: string
  error?: string
}

export interface FileUploadOptions {
  bucket: 'documents' | 'signed-documents' | 'signatures'
  userId?: string
  documentId?: string
  fileName?: string
  isPublic?: boolean
}

// Upload file to Supabase Storage
export async function uploadFile(
  file: File, 
  options: FileUploadOptions
): Promise<FileUploadResult> {
  try {
    const { bucket, userId, documentId, fileName, isPublic = false } = options
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const uniqueFileName = fileName || `${uuidv4()}.${fileExt}`
    
    // Construct file path based on bucket type
    let path: string
    switch (bucket) {
      case 'documents':
        if (!userId) throw new Error('userId is required for documents bucket')
        path = `${userId}/${documentId || uuidv4()}/${uniqueFileName}`
        break
      case 'signed-documents':
        if (!userId) throw new Error('userId is required for signed-documents bucket')
        path = `${userId}/${documentId || uuidv4()}/${uniqueFileName}`
        break
      case 'signatures':
        path = `${documentId || 'temp'}/${uniqueFileName}`
        break
      default:
        throw new Error('Invalid bucket type')
    }

    // Upload file
    const { data, error } = await (await createClient()).storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw error
    }

    // Get public URL if needed
    let publicUrl: string | undefined
    if (isPublic) {
      const { data: urlData } = (await createClient()).storage
        .from(bucket)
        .getPublicUrl(path)
      publicUrl = urlData.publicUrl
    }

    return {
      path: data.path,
      publicUrl,
    }
  } catch (error: any) {
    return {
      path: '',
      error: error.message || 'Failed to upload file'
    }
  }
}

// Get signed URL for private file access
export async function getSignedUrl(
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
): Promise<{ url: string | null; error?: string }> {
  try {
    const { data, error } = await (await createClient()).storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw error
    }

    return { url: data.signedUrl }
  } catch (error: any) {
    return { 
      url: null, 
      error: error.message || 'Failed to get signed URL' 
    }
  }
}

// Delete file from storage
export async function deleteFile(
  bucket: string, 
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (await createClient()).storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'Failed to delete file' 
    }
  }
}

// Upload document and create database record
export async function uploadDocument(
  file: File,
  title: string,
  userId: string
): Promise<{ documentId: string | null; error?: string }> {
  try {
    const documentId = uuidv4()
    
    // Upload file to storage
    const uploadResult = await uploadFile(file, {
      bucket: 'documents',
      userId,
      documentId,
      fileName: file.name
    })

    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }

    // Create document record in database
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: userId,
        title,
        file_name: file.name,
        file_path: uploadResult.path,
        file_size: file.size,
        mime_type: file.type,
        status: 'draft'
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await deleteFile('documents', uploadResult.path)
      throw dbError
    }

    return { documentId }
  } catch (error: any) {
    return {
      documentId: null,
      error: error.message || 'Failed to upload document'
    }
  }
}

// Generate and upload signed document
export async function generateSignedDocument(
  documentId: string,
  userId: string,
  signedImageData: string
): Promise<{ path: string | null; error?: string }> {
  try {
    // Convert base64 to blob
    const base64Data = signedImageData.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/png' })
    const file = new File([blob], `signed_${Date.now()}.png`, { type: 'image/png' })

    // Upload signed document
    const uploadResult = await uploadFile(file, {
      bucket: 'signed-documents',
      userId,
      documentId,
      fileName: `signed_${Date.now()}.png`
    })

    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }

    // Create document version record
    const { error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_type: 'signed',
        file_path: uploadResult.path,
        file_size: file.size,
        created_by: userId
      })

    if (versionError) {
      // Clean up uploaded file if database insert fails
      await deleteFile('signed-documents', uploadResult.path)
      throw versionError
    }

    // Update document status
    await supabase
      .from('documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    return { path: uploadResult.path }
  } catch (error: any) {
    return {
      path: null,
      error: error.message || 'Failed to generate signed document'
    }
  }
}

// Clean up temporary signature files (admin function)
export async function cleanupSignatureFiles(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = await createClient()
    
    const { error } = await supabaseAdmin.rpc('cleanup_old_signatures')
    
    if (error) {
      throw error
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to cleanup signature files'
    }
  }
}

// Get file size in human readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Validate file type and size
export function validateFile(
  file: File,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  maxSize: number = 50 * 1024 * 1024 // 50MB
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size ${formatFileSize(file.size)} exceeds maximum size ${formatFileSize(maxSize)}`
    }
  }

  return { valid: true }
}