# Document Republishing Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Add expiration date display and document republishing feature for published documents

**Architecture:** Extend existing document-actions with republishDocument server action, reuse PublishDocumentModal with republish mode flag, add UI components to DocumentDetailPage showing expiration date and republish button

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase, bcryptjs, Server Actions

---

## Task 1: Add republishDocument Server Action

**Files:**
- Modify: `app/actions/document-actions.ts` (add new function after line 466)

**Step 1: Add republishDocument function**

Add this function after the `publishDocument` function:

```typescript
/**
 * Republish a document (generate new short URL, update password and expiration)
 */
export async function republishDocument(
  documentId: string,
  password: string,
  expiresAt: string | null
) {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Verify document ownership and status
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, user_id, status")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (docError || !document) {
      return { error: "Document not found" };
    }

    if (document.status !== "published") {
      return { error: "Only published documents can be republished" };
    }

    // Generate new short URL
    const newShortUrl = generateShortUrl();

    // Hash password or set to null
    const trimmedPassword = password.trim();
    const passwordHash = trimmedPassword
      ? await bcrypt.hash(trimmedPassword, 12)
      : null;

    const expiresAtISO = expiresAt ? new Date(expiresAt).toISOString() : null;

    // Update document with new credentials and URL
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        password: passwordHash,
        expires_at: expiresAtISO,
        short_url: newShortUrl,
      })
      .eq("id", documentId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Republish document error:", updateError);
      return { error: "Failed to republish document" };
    }

    // Revalidate paths
    revalidatePath(`/document/${documentId}`);
    revalidatePath(`/sign/${newShortUrl}`);

    return { success: true, shortUrl: newShortUrl };
  } catch (error) {
    console.error("Republish document error:", error);
    return { error: "An unexpected error occurred" };
  }
}
```

**Step 2: Update exports in document-actions.ts**

The function is already exported since we're using named exports throughout the file. Verify the import statement in DocumentDetailPage will work.

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors related to document-actions.ts

**Step 4: Commit**

```bash
git add app/actions/document-actions.ts
git commit -m "feat: add republishDocument server action"
```

---

## Task 2: Update PublishDocumentModal for Republish Mode

**Files:**
- Modify: `components/publish-document-modal.tsx`

**Step 1: Read current modal implementation**

Run: `cat components/publish-document-modal.tsx` to understand current structure

**Step 2: Add new props to interface**

Update the props interface at the top of the file:

```typescript
interface PublishDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (password: string, expiresAt: string) => void;
  isLoading: boolean;
  isRepublishing?: boolean;  // NEW
  currentExpiresAt?: string | null;  // NEW
}
```

**Step 3: Update component to use new props**

```typescript
export default function PublishDocumentModal({
  isOpen,
  onClose,
  onPublish,
  isLoading,
  isRepublishing = false,  // NEW: default to false
  currentExpiresAt = null,  // NEW: default to null
}: PublishDocumentModalProps) {
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { t } = useLanguage();

  // NEW: Pre-fill expiration date if republishing
  useEffect(() => {
    if (isRepublishing && currentExpiresAt) {
      // Convert ISO string to YYYY-MM-DD format for input[type="date"]
      const date = new Date(currentExpiresAt);
      const formattedDate = date.toISOString().split('T')[0];
      setExpiresAt(formattedDate);
    }
  }, [isRepublishing, currentExpiresAt]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      if (!isRepublishing) {
        setExpiresAt("");
      }
    }
  }, [isOpen, isRepublishing]);
```

**Step 4: Update modal title**

Find the DialogTitle component and update it:

```typescript
<DialogTitle>
  {isRepublishing ? "문서 재발행" : "문서 발급"}
</DialogTitle>
```

**Step 5: Update description text**

Find the DialogDescription and update:

```typescript
<DialogDescription>
  {isRepublishing
    ? "새로운 비밀번호와 만료일을 설정하면 새로운 서명 URL이 생성됩니다. 기존 URL은 즉시 무효화됩니다."
    : "서명 받을 문서를 발급합니다. 비밀번호와 만료일을 설정하세요."
  }
</DialogDescription>
```

**Step 6: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors related to publish-document-modal.tsx

**Step 7: Commit**

```bash
git add components/publish-document-modal.tsx
git commit -m "feat: add republish mode support to PublishDocumentModal"
```

---

## Task 3: Add UI Components to DocumentDetailPage

**Files:**
- Modify: `app/(document)/document/[id]/components/DocumentDetailPage.tsx`

**Step 1: Add republishDocument import**

Update imports at the top of the file (around line 3-8):

```typescript
import {
  publishDocument,
  updateSignatureAreas,
  getSignedDocumentUrl,
  deleteDocument,
  republishDocument,  // NEW
} from "@/app/actions/document-actions";
```

**Step 2: Add republish modal state**

Add state after line 58 (after isPublishModalOpen):

```typescript
const [isRepublishModalOpen, setIsRepublishModalOpen] = useState<boolean>(false);
```

**Step 3: Add handleRepublish function**

Add this function after the handlePublish function (around line 195):

```typescript
const handleRepublish = async (password: string, expiresAt: string) => {
  if (document.status !== "published") return;

  setIsLoading(true);
  setError(null);

  try {
    const result = await republishDocument(document.id, password, expiresAt);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Update local state with new short URL
    setDocument({ ...document, short_url: result.shortUrl });
    if (result.shortUrl && typeof window !== 'undefined') {
      setPublishedUrl(`${window.location.origin}/sign/${result.shortUrl}`);
    }

    toast({
      title: "재발행 완료",
      description: "문서가 성공적으로 재발행되었습니다.",
    });

    setIsRepublishModalOpen(false);
    // Refresh the page data
    router.refresh();
  } catch (error) {
    console.error("Error republishing document:", error);
    setError("문서 재발행 중 오류가 발생했습니다");
  } finally {
    setIsLoading(false);
  }
};
```

**Step 4: Update Published URL Card section**

Find the section around line 658-689 that displays the published URL card. Replace it with:

```typescript
{/* Published URL Display */}
{isPublished && document.short_url && (
  <Card className="mb-6 sm:mb-6 mx-1 sm:mx-0">
    <CardHeader className="pb-4">
      <CardTitle className="text-base sm:text-lg">발행된 서명 URL</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-4">
        <div className="flex-1 p-3 sm:p-3 bg-gray-50 rounded-lg font-mono text-xs sm:text-sm break-all">
          {isMounted && typeof window !== 'undefined'
            ? `${window.location.origin}/sign/${document.short_url}`
            : `/sign/${document.short_url}`}
        </div>
        <div className="flex gap-3 self-start sm:self-center">
          <Button variant="outline" size="sm" onClick={handleCopyUrl} className="h-10 px-4 sm:h-9">
            <Copy className="h-4 w-4 sm:h-4 sm:w-4" />
            <span className="ml-2 sm:hidden text-sm">복사</span>
          </Button>
          <Link href={`/sign/${document.short_url}`} target="_blank">
            <Button variant="outline" size="sm" className="h-10 px-4 sm:h-9">
              <ExternalLink className="h-4 w-4 sm:h-4 sm:w-4" />
              <span className="ml-2 sm:hidden text-sm">열기</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* NEW: Expiration date display */}
      {document.expires_at && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">만료일:</span>{" "}
            {new Date(document.expires_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      )}

      {/* NEW: Republish button */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsRepublishModalOpen(true)}
          disabled={isLoading}
          className="h-10 px-4 text-sm font-medium border-2 hover:bg-gray-50"
        >
          <Share className="mr-2 h-4 w-4" />
          문서 재발행
        </Button>
      </div>

      <p className="text-sm sm:text-sm text-gray-600 mt-4">
        이 URL을 통해 서명자가 문서에 서명할 수 있습니다.
        {!canEdit && " 발행된 문서는 더 이상 수정할 수 없습니다."}
      </p>
    </CardContent>
  </Card>
)}
```

**Step 5: Add Republish Modal component**

Add this after the existing PublishDocumentModal (around line 851):

```typescript
{/* Republish Document Modal */}
<PublishDocumentModal
  isOpen={isRepublishModalOpen}
  onClose={() => setIsRepublishModalOpen(false)}
  onPublish={handleRepublish}
  isLoading={isLoading}
  isRepublishing={true}
  currentExpiresAt={document.expires_at}
/>
```

**Step 6: Verify TypeScript compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 7: Commit**

```bash
git add app/(document)/document/[id]/components/DocumentDetailPage.tsx
git commit -m "feat: add expiration date display and republish button"
```

---

## Task 4: Manual Testing

**Files:**
- N/A (manual testing)

**Step 1: Start development server**

Run: `npm run dev`
Expected: Server starts on localhost:3000

**Step 2: Test republish flow**

1. Login to the application
2. Navigate to a published document detail page
3. Verify expiration date is displayed below the URL (if expires_at is set)
4. Click "문서 재발행" button
5. Verify modal opens with title "문서 재발행"
6. Verify current expiration date is pre-filled
7. Enter new password and/or change expiration date
8. Click publish
9. Verify success toast appears
10. Verify new URL is displayed
11. Copy new URL and test in new browser tab
12. Verify old URL returns "Document not found" error

**Step 3: Test edge cases**

1. Try republishing without changing password (empty password)
2. Try republishing without expiration date (null)
3. Verify both work correctly

**Step 4: Check console for errors**

Expected: No errors in browser console or terminal

**Step 5: Final commit**

```bash
git add .
git commit -m "test: verify document republishing feature works end-to-end"
```

---

## Completion Checklist

- [ ] Task 1: republishDocument server action added
- [ ] Task 2: PublishDocumentModal supports republish mode
- [ ] Task 3: UI shows expiration date and republish button
- [ ] Task 4: Manual testing passed
- [ ] All TypeScript errors resolved
- [ ] No console errors during testing
- [ ] Old URLs become invalid after republish
- [ ] Existing signatures preserved after republish

---

## Notes

- Existing signatures are intentionally preserved during republish
- Old short URL immediately becomes invalid (no grace period)
- Password can be cleared by leaving it empty during republish
- Expiration date is displayed in Korean locale format
