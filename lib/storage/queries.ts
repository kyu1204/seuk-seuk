import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

type BucketName = 'documents' | 'signed-documents' | 'signatures'

export async function uploadFile(
  bucket: BucketName,
  filePath: string,
  file: File | Blob | ArrayBuffer | string,
  options?: {
    contentType?: string
    cacheControl?: string
    upsert?: boolean
  }
) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      contentType: options?.contentType,
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false
    })
  
  if (error) {
    console.error('Error uploading file:', error)
    throw error
  }
  
  return data
}

export async function downloadFile(bucket: BucketName, filePath: string) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(filePath)
  
  if (error) {
    console.error('Error downloading file:', error)
    throw error
  }
  
  return data
}

export async function getPublicUrl(bucket: BucketName, filePath: string) {
  const supabase = createBrowserClient()
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)
  
  return data.publicUrl
}

export async function createSignedUrl(
  bucket: BucketName,
  filePath: string,
  expiresIn: number = 3600
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn)
  
  if (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }
  
  return data
}

export async function deleteFile(bucket: BucketName, filePaths: string[]) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(filePaths)
  
  if (error) {
    console.error('Error deleting files:', error)
    throw error
  }
  
  return data
}

export async function listFiles(
  bucket: BucketName,
  path?: string,
  options?: {
    limit?: number
    offset?: number
    sortBy?: { column: string; order: 'asc' | 'desc' }
  }
) {
  const supabase = createBrowserClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: options?.limit || 100,
      offset: options?.offset || 0,
      sortBy: options?.sortBy || { column: 'name', order: 'asc' }
    })
  
  if (error) {
    console.error('Error listing files:', error)
    throw error
  }
  
  return data
}

export async function uploadDocumentFile(file: File, userId: string, documentId: string) {
  const fileExtension = file.name.split('.').pop()
  const fileName = `${documentId}.${fileExtension}`
  const filePath = `${userId}/${fileName}`
  
  return uploadFile('documents', filePath, file, {
    contentType: file.type,
    upsert: true
  })
}

export async function uploadSignedDocument(
  file: Blob,
  userId: string,
  documentId: string
) {
  const timestamp = Date.now()
  const fileName = `signed_${documentId}_${timestamp}.png`
  const filePath = `${userId}/${fileName}`
  
  return uploadFile('signed-documents', filePath, file, {
    contentType: 'image/png',
    upsert: false
  })
}

export async function uploadSignatureImage(signatureData: string) {
  // Convert base64 signature data to blob
  const response = await fetch(signatureData)
  const blob = await response.blob()
  
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substr(2, 9)
  const fileName = `signature_${timestamp}_${randomId}.png`
  
  return uploadFile('signatures', fileName, blob, {
    contentType: 'image/png',
    upsert: false
  })
}

export async function getUserDocumentFiles(userId: string) {
  return listFiles('documents', userId)
}

export async function getUserSignedDocumentFiles(userId: string) {
  return listFiles('signed-documents', userId)
}