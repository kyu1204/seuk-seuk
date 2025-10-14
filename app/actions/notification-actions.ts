"use server";

import { Resend } from "resend";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationResult {
  success: boolean;
  error?: string;
  skipped?: boolean; // true if user is not Pro/Enterprise plan
}

async function getDocumentOwnerInfo(documentId: string): Promise<{
  email: string | null;
  planName: string | null;
  error?: string;
}> {
  try {
    // Use service role client to bypass RLS for all queries
    // This is necessary because this function is called from anonymous sign page context
    const serviceSupabase = createServiceSupabase();

    // Get document with user info
    const { data: document, error: docError } = await serviceSupabase
      .from("documents")
      .select("user_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("Failed to get document:", docError);
      return { email: null, planName: null, error: "Document not found" };
    }

    // Get user email using service role client for admin API
    const { data: userData, error: userError } = await serviceSupabase.auth.admin.getUserById(
      document.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("Failed to get user:", userError);
      return { email: null, planName: null, error: "User not found" };
    }

    // Get user's subscription plan
    // IMPORTANT: Check ends_at to handle expired subscriptions
    // Use service role client to bypass RLS (called from anonymous context)
    const now = new Date().toISOString();
    const { data: subscription, error: subError } = await serviceSupabase
      .from("subscriptions")
      .select(`
        *,
        plan:subscription_plans!plan_id(name)
      `)
      .eq("user_id", document.user_id)
      .eq("status", "active")
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .single();

    // If no subscription or error, treat as free plan
    if (subError) {
      console.error("Failed to get subscription:", subError);
    }

    const planName = subscription && !subError
      ? (subscription as any).plan?.name
      : null;

    console.log("[getDocumentOwnerInfo] Result:", {
      documentId,
      user_id: document.user_id,
      email: userData.user.email,
      planName,
      hasSubscription: !!subscription,
      hasError: !!subError,
    });

    return {
      email: userData.user.email,
      planName,
    };
  } catch (error) {
    console.error("Get document owner info error:", error);
    return { email: null, planName: null, error: "Unexpected error" };
  }
}

function generateEmailContent(documentId: string, documentName: string, language: 'ko' | 'en' = 'ko') {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
  const documentUrl = `${siteUrl}/document/${documentId}`;

  const templates = {
    ko: {
      subject: `[슥슥] 문서 서명이 완료되었습니다 - ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">문서 서명 완료 알림</h2>
          <p>안녕하세요,</p>
          <p>귀하의 문서에 대한 모든 서명이 완료되었습니다.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p><strong>문서명:</strong> ${documentName}</p>
          <p><strong>완료 일시:</strong> ${new Date().toLocaleString('ko-KR')}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">문서 바로가기</a>
          </div>
          <p style="color: #666; font-size: 14px;">
            대시보드에서 완료된 문서를 확인하실 수 있습니다.
          </p>
        </div>
      `,
    },
    en: {
      subject: `[SeukSeuk] Document Signing Completed - ${documentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Document Signing Completed</h2>
          <p>Hello,</p>
          <p>All signatures for your document have been completed.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <p><strong>Document Name:</strong> ${documentName}</p>
          <p><strong>Completed At:</strong> ${new Date().toLocaleString('en-US')}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
          <div style="text-align: center; margin: 30px 0;">
            <a href="${documentUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">View Document</a>
          </div>
          <p style="color: #666; font-size: 14px;">
            You can view the completed document in your dashboard.
          </p>
        </div>
      `,
    },
  };

  return templates[language];
}

/**
 * Send document completion email to Pro/Enterprise plan users
 * @param documentId - The completed document ID
 * @param documentName - The document filename for email content
 * @returns Result indicating success, skip, or error
 */
export async function sendDocumentCompletionEmail(
  documentId: string,
  documentName: string
): Promise<EmailNotificationResult> {
  try {
    // Get document owner info and plan
    const { email, planName, error } = await getDocumentOwnerInfo(documentId);

    if (error || !email) {
      console.error("[sendDocumentCompletionEmail] Failed to get owner info:", error);
      return { success: false, error: error || "Owner info unavailable" };
    }

    // Check if user is Pro or Enterprise plan (case-insensitive)
    const planNameLower = planName?.toLowerCase();
    const isPremiumPlan = planNameLower === 'pro' || planNameLower === 'enterprise';

    if (!isPremiumPlan) {
      console.log(
        `[sendDocumentCompletionEmail] Skipping email for non-premium user. Plan: ${planName || 'none'}`
      );
      return { success: true, skipped: true };
    }

    // Generate email content (default to Korean)
    const emailContent = generateEmailContent(documentId, documentName, 'ko');

    // Send email using Resend
    const { data, error: sendError } = await resend.emails.send({
      from: "SeukSeuk Contact <team@seuk-seuk.com>",
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (sendError) {
      console.error("[sendDocumentCompletionEmail] Resend API error:", sendError);
      return {
        success: false,
        error: "Failed to send email",
      };
    }

    console.log("[sendDocumentCompletionEmail] Email sent successfully:", {
      documentId,
      documentName,
      email,
      messageId: data?.id,
    });

    return { success: true };
  } catch (error) {
    console.error("[sendDocumentCompletionEmail] Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
