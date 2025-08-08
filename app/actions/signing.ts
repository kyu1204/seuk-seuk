"use server"

import { createClient } from "@/lib/supabase/server"
import { Database, Tables } from "@/lib/database-types"
import { generateSignedDocument } from "./document-actions"
import bcrypt from 'bcryptjs'

type DocumentShare = Tables<'document_shares'>
type Document = Tables<'documents'>
type SignatureArea = Tables<'signature_areas'>
type Signature = Tables<'signatures'>

export interface DocumentWithAreas extends Document {
  signature_areas: SignatureArea[]
  signatures?: Signature[]
}

export async function getSharedDocument(
  shortUrl: string,
  password?: string
): Promise<{
  success: boolean;
  data?: DocumentWithAreas & { signedUrl: string };
  error?: string;
  requiresPassword?: boolean;
}> {
  try {
    const supabase = await createClient()

    // Get document share by short URL
    const { data: share, error: shareError } = await supabase
      .from('document_shares')
      .select(`
        *,
        documents (
          *,
          signature_areas (*),
          signatures (*)
        )
      `)
      .eq('short_url', shortUrl)
      .single()

    if (shareError || !share) {
      return { success: false, error: "Document not found or has expired" }
    }

    // Check if share has expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { success: false, error: "Document link has expired" }
    }

    // Check usage limits
    if (share.max_uses && share.used_count && share.used_count >= share.max_uses) {
      return { success: false, error: "Document link usage limit exceeded" }
    }

    // Check if document exists and is published
    const document = (share as any).documents
    if (!document || document.status !== 'published') {
      return { success: false, error: "Document not available" }
    }

    // Check password if required
    if (share.password_hash) {
      if (!password) {
        return { success: false, requiresPassword: true, error: "Password required" }
      }

      const passwordMatch = await bcrypt.compare(password, share.password_hash)
      if (!passwordMatch) {
        return { success: false, requiresPassword: true, error: "Invalid password" }
      }
    }

    // Generate signed URL for document file
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (urlError || !signedUrl) {
      return { success: false, error: "Failed to access document file" }
    }

    // Increment used count
    await supabase
      .from('document_shares')
      .update({ used_count: (share.used_count || 0) + 1 })
      .eq('id', share.id)

    return {
      success: true,
      data: {
        ...document,
        signedUrl: signedUrl.signedUrl
      }
    }
  } catch (error) {
    console.error('Get shared document error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function submitSignature(
  documentId: string,
  signatureAreaId: string,
  signatureData: string,
  signerInfo?: {
    name?: string;
    email?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Verify signature area belongs to document and document is published
    const { data: signatureArea, error: areaError } = await supabase
      .from('signature_areas')
      .select(`
        *,
        documents (
          id, status, user_id
        )
      `)
      .eq('id', signatureAreaId)
      .eq('document_id', documentId)
      .single()

    if (areaError || !signatureArea) {
      return { success: false, error: "Invalid signature area" }
    }

    const document = (signatureArea as any).documents
    if (!document || document.status !== 'published') {
      return { success: false, error: "Document not available for signing" }
    }

    // Check if this area is already signed
    const { data: existingSignature } = await supabase
      .from('signatures')
      .select('id')
      .eq('signature_area_id', signatureAreaId)
      .single()

    if (existingSignature) {
      return { success: false, error: "This area has already been signed" }
    }

    // Get client IP (for audit trail)
    // Note: In a real app, you'd want to get the actual client IP
    const clientIP = '127.0.0.1' // Placeholder

    // Insert signature
    const { error: signError } = await supabase
      .from('signatures')
      .insert({
        document_id: documentId,
        signature_area_id: signatureAreaId,
        signature_data: signatureData,
        signer_name: signerInfo?.name || null,
        signer_email: signerInfo?.email || null,
        signer_ip: clientIP,
        status: 'signed'
      })

    if (signError) {
      return { success: false, error: `Failed to save signature: ${signError.message}` }
    }

    // Check if all required signature areas are now signed
    const { data: allAreas } = await supabase
      .from('signature_areas')
      .select('id, required')
      .eq('document_id', documentId)

    const { data: allSignatures } = await supabase
      .from('signatures')
      .select('signature_area_id')
      .eq('document_id', documentId)

    const requiredAreas = allAreas?.filter(area => area.required) || []
    const signedAreaIds = new Set(allSignatures?.map(sig => sig.signature_area_id) || [])
    const allRequiredSigned = requiredAreas.every(area => signedAreaIds.has(area.id))

    // If all required areas are signed, update document status to completed
    if (allRequiredSigned) {
      await supabase
        .from('documents')
        .update({ status: 'completed' })
        .eq('id', documentId)
    }

    return { success: true }
  } catch (error) {
    console.error('Submit signature error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function generateFinalDocument(
  documentId: string
): Promise<{
  success: boolean;
  data?: { downloadUrl: string };
  error?: string;
}> {
  try {
    const supabase = await createClient()

    // Get document with signatures and areas
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
      return { success: false, error: "Document not found" }
    }

    // Get original document signed URL
    const { data: originalUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600)

    if (urlError || !originalUrl) {
      return { success: false, error: "Failed to access original document" }
    }

    // Prepare signature data for merging
    const signatureData = (document as any).signatures.map((sig: any) => ({
      areaIndex: (document as any).signature_areas.findIndex((area: any) => area.id === sig.signature_area_id),
      signature: sig.signature_data
    }))

    const areas = (document as any).signature_areas.map((area: any) => ({
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height
    }))

    // Generate signed document using existing server action
    const result = await generateSignedDocument(
      originalUrl.signedUrl,
      signatureData,
      areas
    )

    if (!result.success || !result.signedDocument) {
      return { success: false, error: result.error || "Failed to generate signed document" }
    }

    // Save signed document to storage
    const signedDocumentBuffer = Buffer.from(result.signedDocument.split(',')[1], 'base64')
    const signedPath = `${document.user_id}/signed/${documentId}_signed_${Date.now()}.png`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(signedPath, signedDocumentBuffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      })

    if (uploadError) {
      return { success: false, error: `Failed to save signed document: ${uploadError.message}` }
    }

    // Create document version record
    await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        version_type: 'signed',
        file_path: uploadData.path,
        file_size: signedDocumentBuffer.length,
        created_by: document.user_id
      })

    // Generate download URL
    const { data: downloadUrl, error: downloadError } = await supabase.storage
      .from('signed-documents')
      .createSignedUrl(uploadData.path, 86400) // 24 hours

    if (downloadError || !downloadUrl) {
      return { success: false, error: "Failed to generate download URL" }
    }

    return {
      success: true,
      data: {
        downloadUrl: downloadUrl.signedUrl
      }
    }
  } catch (error) {
    console.error('Generate final document error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

export async function checkDocumentStatus(
  documentId: string
): Promise<{
  success: boolean;
  data?: {
    status: string;
    totalAreas: number;
    signedAreas: number;
    isComplete: boolean;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient()

    // Get document status and signature counts
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select(`
        status,
        signature_areas (id, required),
        signatures (signature_area_id)
      `)
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return { success: false, error: "Document not found" }
    }

    const totalAreas = (document as any).signature_areas?.length || 0
    const signedAreas = (document as any).signatures?.length || 0
    const requiredAreas = (document as any).signature_areas?.filter((area: any) => area.required).length || 0
    const signedRequiredAreas = new Set(
      (document as any).signatures?.map((sig: any) => sig.signature_area_id) || []
    )
    const completedRequiredAreas = (document as any).signature_areas?.filter(
      (area: any) => area.required && signedRequiredAreas.has(area.id)
    ).length || 0

    const isComplete = completedRequiredAreas === requiredAreas

    return {
      success: true,
      data: {
        status: document.status,
        totalAreas,
        signedAreas,
        isComplete
      }
    }
  } catch (error) {
    console.error('Check document status error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}