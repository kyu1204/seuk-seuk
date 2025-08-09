'use server'

import { createCanvas, loadImage, Canvas } from 'canvas'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

// Types
interface SignatureData {
  areaIndex: number
  signature: string
  signerName?: string
  signedAt?: string
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

interface GenerationOptions {
  quality?: number // 0.1 to 1.0
  format?: 'png' | 'jpeg'
  compression?: boolean
  watermark?: string
}

interface DocumentGenerationResult {
  success: boolean
  data?: {
    downloadUrl: string
    filePath: string
    fileSize: number
  }
  error?: string
}

// Enhanced signature merging with performance optimizations
export async function generateSignedDocumentEnhanced(
  documentImageUrl: string,
  signatures: SignatureData[],
  areas: Area[],
  options: GenerationOptions = {}
): Promise<{
  success: boolean
  signedDocument?: string
  error?: string
}> {
  try {
    console.log('Starting enhanced document generation...')
    
    if (!documentImageUrl) {
      throw new Error('Document image URL is required')
    }

    // Load the document image with error handling
    let docImage
    try {
      docImage = await loadImage(documentImageUrl)
    } catch (error) {
      throw new Error(`Failed to load document image: ${error}`)
    }

    // Create high-quality canvas
    const canvas = createCanvas(docImage.width, docImage.height)
    const ctx = canvas.getContext('2d')
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    // @ts-ignore - imageSmoothingQuality is supported in modern browsers and Node.js canvas
    ctx.imageSmoothingQuality = 'high'

    // Draw the document image
    ctx.drawImage(docImage, 0, 0)

    // Process signatures with batching for better performance
    if (signatures && signatures.length > 0 && areas) {
      console.log(`Processing ${signatures.length} signatures...`)
      
      // Load all signature images concurrently
      const signaturePromises = signatures.map(async (signature, index) => {
        if (signature.areaIndex === undefined || !signature.signature) return null
        
        const area = areas[signature.areaIndex]
        if (!area) return null

        try {
          const signatureImage = await loadImage(signature.signature)
          return { signature, area, image: signatureImage, index }
        } catch (error) {
          console.warn(`Failed to load signature ${index}:`, error)
          return null
        }
      })

      const loadedSignatures = await Promise.all(signaturePromises)

      // Draw signatures
      loadedSignatures.forEach((data, index) => {
        if (!data) return

        const { area, image } = data
        
        // Apply signature with proper scaling
        ctx.save()
        
        // Optional: Apply transparency for better blending
        ctx.globalAlpha = 0.95
        
        // Draw signature with anti-aliasing
        ctx.drawImage(image, area.x, area.y, area.width, area.height)
        
        ctx.restore()
      })
    }

    // Optional: Add watermark
    if (options.watermark) {
      ctx.save()
      ctx.globalAlpha = 0.1
      ctx.font = '20px Arial'
      ctx.fillStyle = '#000000'
      ctx.textAlign = 'center'
      ctx.rotate(-Math.PI / 6) // 30 degrees
      
      // Add watermark text across the document
      for (let x = 0; x < docImage.width + 200; x += 200) {
        for (let y = 0; y < docImage.height + 100; y += 100) {
          ctx.fillText(options.watermark, x, y)
        }
      }
      ctx.restore()
    }

    // Convert to data URL with specified quality
    const format = options.format || 'png'
    const quality = options.quality || 0.95
    
    const dataUrl = format === 'png' 
      ? canvas.toDataURL('image/png')
      : canvas.toDataURL('image/jpeg', quality)

    console.log('Document generation completed successfully')
    return { success: true, signedDocument: dataUrl }

  } catch (error) {
    console.error('Enhanced document generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed document'
    }
  }
}

// Generate final document with enhanced features and automation
export async function generateFinalDocumentEnhanced(
  documentId: string,
  options: GenerationOptions = {}
): Promise<DocumentGenerationResult> {
  try {
    const supabase = await createClient()

    // Get document with all related data
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        signature_areas (*),
        signatures (*)
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return { success: false, error: 'Document not found' }
    }

    // Verify document is ready for final generation
    const signatureAreas = (document as any).signature_areas || []
    const signatures = (document as any).signatures || []
    const requiredAreas = signatureAreas.filter((area: any) => area.required)
    const signedAreaIds = new Set(signatures.map((sig: any) => sig.signature_area_id))
    const allRequiredSigned = requiredAreas.every((area: any) => signedAreaIds.has(area.id))

    if (!allRequiredSigned) {
      return { success: false, error: 'Not all required signatures are complete' }
    }

    // Get original document signed URL
    const { data: originalUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600)

    if (urlError || !originalUrl) {
      return { success: false, error: 'Failed to access original document' }
    }

    // Prepare signature data with enhanced information
    const areaIndexById = new Map(signatureAreas.map((area: any, index: number) => [area.id, index]))
    const enhancedSignatureData: SignatureData[] = signatures.map((sig: any) => ({
      areaIndex: areaIndexById.get(sig.signature_area_id) ?? -1,
      signature: sig.signature_data,
      signerName: sig.signer_name,
      signedAt: sig.signed_at
    }))

    const areas: Area[] = signatureAreas.map((area: any) => ({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height
    }))

    // Generate signed document with enhanced options
    const generationOptions: GenerationOptions = {
      quality: options.quality || 0.95,
      format: options.format || 'png',
      compression: options.compression || true,
      watermark: `Signed on ${new Date().toLocaleDateString()}`
    }

    const result = await generateSignedDocumentEnhanced(
      originalUrl.signedUrl,
      enhancedSignatureData,
      areas,
      generationOptions
    )

    if (!result.success || !result.signedDocument) {
      return { success: false, error: result.error || 'Failed to generate signed document' }
    }

    // Convert to buffer for storage
    const base64Data = result.signedDocument.split(',')[1]
    const signedDocumentBuffer = Buffer.from(base64Data, 'base64')
    
    // Generate filename with timestamp and signer info
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const signerNames = signatures
      .filter((sig: any) => sig.signer_name)
      .map((sig: any) => sig.signer_name)
      .slice(0, 3)
      .join('_')
    
    const filename = signerNames 
      ? `${document.title}_signed_${signerNames}_${timestamp}.${generationOptions.format}`
      : `${document.title}_signed_${timestamp}.${generationOptions.format}`

    const signedPath = `${document.user_id}/signed/${filename}`

    // Upload to storage with metadata
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(signedPath, signedDocumentBuffer, {
        contentType: generationOptions.format === 'png' ? 'image/png' : 'image/jpeg',
        cacheControl: '86400', // 24 hours
        metadata: {
          original_document_id: documentId,
          signatures_count: signatures.length.toString(),
          generation_timestamp: new Date().toISOString(),
          format: generationOptions.format || 'png'
        }
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: `Failed to save signed document: ${uploadError.message}` }
    }

    // Create document version record with enhanced metadata
    const { error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_type: 'signed',
        file_path: uploadData.path,
        file_size: signedDocumentBuffer.length,
        created_by: document.user_id
      })

    if (versionError) {
      console.warn('Failed to create version record:', versionError)
    }

    // Update document status to completed if not already
    if (document.status !== 'completed') {
      await supabase
        .from('documents')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
    }

    // Generate download URL with longer expiry
    const { data: downloadUrl, error: downloadError } = await supabase.storage
      .from('signed-documents')
      .createSignedUrl(uploadData.path, 604800) // 7 days

    if (downloadError || !downloadUrl) {
      return { success: false, error: 'Failed to generate download URL' }
    }

    // Optional: Send completion notification
    if (process.env.NODE_ENV === 'production') {
      // Here you could integrate with email service or other notification systems
      console.log(`Document ${documentId} completed and ready for download`)
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath(`/sign/${documentId}`)

    return {
      success: true,
      data: {
        downloadUrl: downloadUrl.signedUrl,
        filePath: uploadData.path,
        fileSize: signedDocumentBuffer.length
      }
    }

  } catch (error) {
    console.error('Enhanced final document generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Batch process multiple documents (for admin/bulk operations)
export async function batchGenerateDocuments(
  documentIds: string[],
  options: GenerationOptions = {}
): Promise<{
  success: boolean
  results: { documentId: string; success: boolean; error?: string }[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    // Verify user has access to all documents
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, results: [], error: 'Authentication required' }
    }

    // Process documents in batches to avoid overwhelming the system
    const batchSize = 5
    const results: { documentId: string; success: boolean; error?: string }[] = []

    for (let i = 0; i < documentIds.length; i += batchSize) {
      const batch = documentIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (documentId) => {
        try {
          const result = await generateFinalDocumentEnhanced(documentId, options)
          return {
            documentId,
            success: result.success,
            error: result.error
          }
        } catch (error) {
          return {
            documentId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return {
      success: true,
      results
    }

  } catch (error) {
    console.error('Batch generate documents error:', error)
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Batch processing failed'
    }
  }
}

// Cleanup old signed documents (for maintenance)
export async function cleanupOldSignedDocuments(olderThanDays: number = 30) {
  try {
    const supabase = await createClient()
    
    // Only allow this in server environment with proper authorization
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    if (process.env.NODE_ENV === 'production' && !authHeader?.includes('admin')) {
      throw new Error('Unauthorized cleanup operation')
    }

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    // Get old document versions
    const { data: oldVersions, error: versionsError } = await supabase
      .from('document_versions')
      .select('file_path')
      .eq('version_type', 'signed')
      .lt('created_at', cutoffDate.toISOString())

    if (versionsError || !oldVersions) {
      throw new Error(`Failed to find old versions: ${versionsError?.message}`)
    }

    // Delete files from storage
    const filePaths = oldVersions.map(v => v.file_path)
    if (filePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('signed-documents')
        .remove(filePaths)

      if (deleteError) {
        console.warn('Some files could not be deleted:', deleteError)
      }
    }

    // Clean up database records
    const { error: dbDeleteError } = await supabase
      .from('document_versions')
      .delete()
      .eq('version_type', 'signed')
      .lt('created_at', cutoffDate.toISOString())

    if (dbDeleteError) {
      console.warn('Database cleanup warning:', dbDeleteError)
    }

    console.log(`Cleanup completed: ${filePaths.length} old signed documents removed`)
    return { success: true, cleaned: filePaths.length }

  } catch (error) {
    console.error('Cleanup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cleanup failed'
    }
  }
}