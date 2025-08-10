"use server"

import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/lib/database-types"
import { generateSignedDocument } from "./document-actions"
import bcrypt from 'bcryptjs'

// type DocumentShare = Tables<'document_shares'>
type Document = Tables<'documents'>
type SignatureArea = Tables<'signature_areas'>
type Signature = Tables<'signatures'>

// Extended types for documents with relations
type DocumentWithRelations = Document & {
  signature_areas: SignatureArea[]
  signatures: Signature[]
}

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
    console.log('🚀 [getSharedDocument] 시작:', { 
      shortUrl, 
      hasPassword: !!password,
      timestamp: new Date().toISOString()
    })
    
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

    console.log('📊 [getSharedDocument] Share 쿼리 결과:', {
      hasShare: !!share,
      shareError: shareError?.message,
      shareId: share?.id,
      hasDocument: !!(share as any)?.documents
    })

    if (shareError || !share) {
      console.log('❌ [getSharedDocument] Share 조회 실패:', shareError)
      return { success: false, error: "Document not found or has expired" }
    }

    // Check if share has expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      console.log('❌ [getSharedDocument] 만료된 링크:', { 
        expiresAt: share.expires_at, 
        now: new Date().toISOString() 
      })
      return { success: false, error: "Document link has expired" }
    }

    // Check usage limits
    if (share.max_uses && share.used_count && share.used_count >= share.max_uses) {
      console.log('❌ [getSharedDocument] 사용 횟수 초과:', { 
        maxUses: share.max_uses, 
        usedCount: share.used_count 
      })
      return { success: false, error: "Document link usage limit exceeded" }
    }

    // Check if document exists and is accessible (published or completed)
    const document = (share as any).documents
    console.log('📋 [getSharedDocument] Document 상태 체크:', {
      hasDocument: !!document,
      documentId: document?.id,
      documentStatus: document?.status,
      isAccessible: document?.status === 'published' || document?.status === 'completed'
    })
    
    if (!document || (document.status !== 'published' && document.status !== 'completed')) {
      console.log('❌ [getSharedDocument] 문서 접근 불가:', { 
        hasDocument: !!document, 
        status: document?.status,
        allowedStatuses: ['published', 'completed']
      })
      return { success: false, error: "Document not available" }
    }

    // Check password if required
    if (share.password_hash) {
      if (!password) {
        return { success: false, requiresPassword: true, error: "Password required" }
      }

      try {
        const passwordMatch = await bcrypt.compare(password, share.password_hash)
        if (!passwordMatch) {
          console.warn('🔒 [getSharedDocument] 비밀번호 불일치')
          return { success: false, requiresPassword: true, error: "Invalid password" }
        }
        console.log('✅ [getSharedDocument] 비밀번호 인증 성공')
      } catch (bcryptError) {
        console.error('❌ [getSharedDocument] bcrypt 오류:', bcryptError)
        return { success: false, requiresPassword: true, error: "Password verification failed" }
      }
    }

    // Generate signed URL for document file
    console.log('🔗 [getSharedDocument] Signed URL 생성 시작:', { 
      filePath: document.file_path 
    })
    
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600) // 1 hour expiry

    if (urlError || !signedUrl) {
      console.log('❌ [getSharedDocument] Signed URL 생성 실패:', urlError)
      return { success: false, error: "Failed to access document file" }
    }

    console.log('✅ [getSharedDocument] Signed URL 생성 성공')

    // Increment used count atomically
    const { error: updateError } = await supabase.rpc('increment_share_usage', {
      share_id: share.id
    })

    if (updateError) {
      console.log('⚠️ [getSharedDocument] Used count 업데이트 실패:', updateError)
    }

    console.log('✅ [getSharedDocument] 성공적으로 완료:', {
      documentId: document.id,
      signatureAreasCount: document.signature_areas?.length || 0,
      signaturesCount: document.signatures?.length || 0
    })

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
    // Note: This is a simplified approach - in production you'd want to handle proxies properly
    const clientIP = process.env.NODE_ENV === 'development' ? '127.0.0.1' : 'unknown'

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
    const documentWithRelations = document as DocumentWithRelations
    const areaIndexById = new Map(documentWithRelations.signature_areas.map((area, index) => [area.id, index]))
    const signatureData = documentWithRelations.signatures.map((sig) => ({
      areaIndex: areaIndexById.get(sig.signature_area_id) ?? -1,
      signature: sig.signature_data
    }))

    const areas = documentWithRelations.signature_areas.map((area) => ({
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

    const documentWithRelations = document as DocumentWithRelations
    const totalAreas = documentWithRelations.signature_areas?.length || 0
    const signedAreas = documentWithRelations.signatures?.length || 0
    const requiredAreas = documentWithRelations.signature_areas?.filter((area) => area.required).length || 0
    const signedRequiredAreas = new Set(
      documentWithRelations.signatures?.map((sig) => sig.signature_area_id) || []
    )
    const completedRequiredAreas = documentWithRelations.signature_areas?.filter(
      (area) => area.required && signedRequiredAreas.has(area.id)
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