"use server"

import { createClient } from "@/lib/supabase/server"
import { Tables } from "@/lib/database-types"
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

export interface SignerInfo {
  name?: string;
  email?: string;
}

export async function getSharedDocument(
  shortUrl: string,
  password?: string
): Promise<{
  success: boolean;
  data?: DocumentWithAreas & { signedUrl: string };
  error?: string;
  requiresPassword?: boolean;
  isSubmitted?: boolean;
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

    // Check if document exists and is accessible
    const document = (share as any).documents
    console.log('📋 [getSharedDocument] Document 상태 체크:', {
      hasDocument: !!document,
      documentId: document?.id,
      documentStatus: document?.status,
      isAccessible: ['published', 'completed', 'submitted'].includes(document?.status)
    })
    
    if (!document) {
      return { success: false, error: "Document not found" }
    }

    // Check if document is submitted (block access for signers)
    if (document.status === 'submitted') {
      console.log('🚫 [getSharedDocument] 제출된 문서 접근 차단:', { 
        documentId: document.id, 
        status: document.status 
      })
      return { 
        success: false, 
        error: "이 문서는 이미 제출되어 접근할 수 없습니다.",
        isSubmitted: true 
      }
    }
    
    if (document.status !== 'published' && document.status !== 'completed') {
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

// Submit document (change status to submitted)
export async function submitDocument(
  documentId: string,
  signerInfo: SignerInfo
): Promise<{
  success: boolean;
  data?: { documentId: string };
  error?: string;
}> {
  try {
    console.log('🚀 [submitDocument] 문서 제출 시작:', { 
      documentId, 
      signerInfo: { 
        name: signerInfo.name, 
        email: signerInfo.email 
      } 
    })
    
    const supabase = await createClient()

    // First, get the document to verify it exists and check current status
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, status, user_id')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      console.log('❌ [submitDocument] 문서 찾기 실패:', docError)
      return { success: false, error: "Document not found" }
    }

    // Check if document is already submitted
    if (document.status === 'submitted') {
      console.log('⚠️ [submitDocument] 이미 제출된 문서:', { documentId, status: document.status })
      return { success: false, error: "Document is already submitted" }
    }

    // Update document status to submitted and add submission info
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        submitted_by_name: signerInfo.name || null,
        submitted_by_email: signerInfo.email || null
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('❌ [submitDocument] 문서 상태 업데이트 실패:', updateError)
      return { success: false, error: "Failed to submit document" }
    }

    console.log('✅ [submitDocument] 문서 제출 성공:', { 
      documentId, 
      submittedAt: new Date().toISOString(),
      submittedBy: signerInfo.name || 'Anonymous'
    })

    return {
      success: true,
      data: { documentId }
    }
  } catch (error) {
    console.error('❌ [submitDocument] 제출 중 오류:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}