# Pro Plan Email Notification Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Send email notifications to Pro plan users when their document signing is completed.

**Architecture:** Separate notification module with plan-aware logic, called asynchronously from document completion flow to avoid blocking user experience. Email sending failures are logged but don't affect document completion.

**Tech Stack:** Next.js Server Actions, Resend API, Supabase (subscriptions + documents), TypeScript

---

## Task 1: Create Email Notification Module

**Files:**
- Create: `app/actions/notification-actions.ts`
- Reference: `app/actions/contact-actions.ts` (existing Resend setup)
- Reference: `app/actions/subscription-actions.ts` (subscription logic)

**Step 1: Create notification-actions.ts file structure**

Create the file with basic imports and type definitions:

```typescript
"use server";

import { Resend } from "resend";
import { createServerSupabase } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotificationResult {
  success: boolean;
  error?: string;
  skipped?: boolean; // true if user is not Pro plan
}
```

**Step 2: Implement helper function to get document owner's email and plan**

Add function to fetch user info:

```typescript
async function getDocumentOwnerInfo(documentId: string): Promise<{
  email: string | null;
  planName: string | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get document with user info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("user_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("Failed to get document:", docError);
      return { email: null, planName: null, error: "Document not found" };
    }

    // Get user email
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      document.user_id
    );

    if (userError || !userData?.user?.email) {
      console.error("Failed to get user:", userError);
      return { email: null, planName: null, error: "User not found" };
    }

    // Get user's subscription plan
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        *,
        plan:subscription_plans!plan_id(name)
      `)
      .eq("user_id", document.user_id)
      .eq("status", "active")
      .single();

    // If no subscription or error, treat as free plan
    const planName = subscription && !subError
      ? (subscription as any).plan?.name
      : null;

    return {
      email: userData.user.email,
      planName,
    };
  } catch (error) {
    console.error("Get document owner info error:", error);
    return { email: null, planName: null, error: "Unexpected error" };
  }
}
```

**Step 3: Implement email template helper**

Add bilingual email template generation:

```typescript
function generateEmailContent(documentName: string, language: 'ko' | 'en' = 'ko') {
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
          <p style="color: #666; font-size: 14px;">
            You can view the completed document in your dashboard.
          </p>
        </div>
      `,
    },
  };

  return templates[language];
}
```

**Step 4: Implement main email sending function**

Add the public function:

```typescript
/**
 * Send document completion email to Pro plan users
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

    // Check if user is Pro plan (case-insensitive)
    const isProPlan = planName?.toLowerCase() === 'pro';

    if (!isProPlan) {
      console.log(
        `[sendDocumentCompletionEmail] Skipping email for non-Pro user. Plan: ${planName || 'none'}`
      );
      return { success: true, skipped: true };
    }

    // Generate email content (default to Korean)
    const emailContent = generateEmailContent(documentName, 'ko');

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
```

**Step 5: Verify file compiles**

Run TypeScript check:

```bash
npx tsc --noEmit app/actions/notification-actions.ts
```

Expected: No compilation errors

**Step 6: Commit notification module**

```bash
git add app/actions/notification-actions.ts docs/plans/
git commit -m "feat: add Pro plan email notification module

- Create notification-actions.ts with Resend integration
- Implement plan-aware email sending (Pro plan only)
- Add bilingual email templates (KO/EN)
- Include helper functions for user/plan lookup"
```

---

## Task 2: Integrate Email Notification into Document Completion Flow

**Files:**
- Modify: `app/actions/document-actions.ts:235-271` (markDocumentCompleted function)
- Modify: `app/(sign)/sign/[id]/components/SignPage.tsx:336-342` (handleGenerateDocument function)

**Step 1: Import notification function in document-actions.ts**

Add import at the top of `app/actions/document-actions.ts`:

```typescript
import { sendDocumentCompletionEmail } from "./notification-actions";
```

**Step 2: Modify markDocumentCompleted to trigger email**

Update the `markDocumentCompleted` function to include notification. Replace the existing function (lines 235-271) with:

```typescript
export async function markDocumentCompleted(documentId: string) {
  try {
    const supabase = await createServerSupabase();

    // First check if document exists and is in the right state
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, status, filename")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("❌ Document not found:", docError);
      return { error: "Document not found" };
    }

    if (document.status === "completed") {
      return { success: true };
    }

    // Update document status to completed
    const { error } = await supabase
      .from("documents")
      .update({ status: "completed" })
      .eq("id", documentId);

    if (error) {
      console.error("❌ Mark completed error:", error);
      return { error: "Failed to mark document as completed: " + error.message };
    }

    // 🆕 Send email notification asynchronously (fire-and-forget)
    // Email failures won't block document completion
    sendDocumentCompletionEmail(documentId, document.filename)
      .catch((err) => {
        console.error("❌ Email notification failed (non-blocking):", err);
      });

    return { success: true };
  } catch (error) {
    console.error("❌ Mark completed error:", error);
    return { error: "An unexpected error occurred" };
  }
}
```

**Step 3: Verify TypeScript compilation**

Run TypeScript check:

```bash
npx tsc --noEmit app/actions/document-actions.ts
```

Expected: No compilation errors

**Step 4: Build the application**

Run Next.js build to verify all integrations:

```bash
npm run build
```

Expected: Build completes successfully with no errors

**Step 5: Commit integration changes**

```bash
git add app/actions/document-actions.ts
git commit -m "feat: integrate email notification into document completion

- Import sendDocumentCompletionEmail in document-actions
- Call notification asynchronously (fire-and-forget)
- Email failures don't block document completion
- Pass document filename to email template"
```

---

## Task 3: Manual Testing and Verification

**Files:**
- Reference: `app/(sign)/sign/[id]/components/SignPage.tsx` (trigger flow)
- Reference: `app/(document)/document/[id]/page.tsx` (check status)

**Testing Instructions:**

**Step 1: Verify environment variables**

Ensure `.env.local` contains:
```bash
RESEND_API_KEY=re_...
```

**Step 2: Test with Pro plan user (email should send)**

1. Start development server: `npm run dev`
2. Log in as a Pro plan user
3. Create a document with signature areas
4. Publish the document
5. Complete all signatures on the sign page
6. Click "제출하기" (Submit)
7. Check console logs for: `[sendDocumentCompletionEmail] Email sent successfully`
8. Check recipient's email inbox for completion notification

**Step 3: Test with Free plan user (email should be skipped)**

1. Log in as a Free plan user
2. Create and complete a document
3. Check console logs for: `[sendDocumentCompletionEmail] Skipping email for non-Pro user`
4. Verify no email was sent

**Step 4: Test error handling (invalid document)**

1. Manually call `markDocumentCompleted` with invalid ID
2. Verify error is logged but doesn't crash
3. Check that error is non-blocking

**Step 5: Verify database state**

After document completion, verify:
```sql
SELECT id, status, filename FROM documents WHERE id = '<test-id>';
-- Status should be 'completed'
```

**Expected Results:**
- ✅ Pro users receive email notification
- ✅ Free/Starter users do not receive email (logged as skipped)
- ✅ Document status updates to 'completed' regardless of email result
- ✅ Email failures are logged but don't break the flow
- ✅ Email contains correct document name and timestamp

**Step 6: Document testing results**

Create `docs/testing/email-notification-tests.md`:

```markdown
# Email Notification Testing Results

## Test Date: [Current Date]

### Pro Plan User Test
- User: [test email]
- Document: [test filename]
- Result: [✅/❌]
- Email Received: [Yes/No]
- Notes: [Any observations]

### Free Plan User Test
- User: [test email]
- Document: [test filename]
- Result: [✅/❌]
- Email Skipped: [Yes/No]
- Notes: [Any observations]

### Error Handling Test
- Scenario: [Description]
- Result: [✅/❌]
- Notes: [Any observations]
```

**Step 7: Final commit**

```bash
git add docs/testing/email-notification-tests.md
git commit -m "docs: add email notification testing results"
```

---

## Completion Checklist

- [ ] Task 1: notification-actions.ts created with all functions
- [ ] Task 2: markDocumentCompleted modified to call notification
- [ ] Task 3: Manual testing completed and documented
- [ ] TypeScript compilation passes (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] Pro users receive emails
- [ ] Free users don't receive emails (skipped)
- [ ] Error handling works (non-blocking)
- [ ] Console logs are helpful for debugging

---

## Notes for Engineer

**Important Context:**
- This project uses Next.js 14 with App Router and Server Actions
- Supabase is used for database (auth + data)
- Resend API is already configured (see `contact-actions.ts`)
- Plan identification is by name: "Pro", "Starter", "Free"
- Email sending should NEVER block document completion

**Subscription Plan Structure:**
```typescript
subscription_plans table:
- name: string (e.g., "Pro", "Starter", "Free")
- monthly_document_limit: number
- active_document_limit: number
- is_active: boolean

subscriptions table:
- user_id: string
- plan_id: string (FK to subscription_plans)
- status: "trial" | "active" | "cancelled" | "expired"
```

**Related Skills:**
- @skills/testing/test-driven-development (if adding unit tests later)
- @skills/debugging/systematic-debugging (if issues arise)

**Future Enhancements (Not in Scope):**
- Unit tests for notification module
- Admin panel to view notification logs
- Support for multiple languages based on user preference
- Email delivery status tracking
- Retry mechanism for failed emails
