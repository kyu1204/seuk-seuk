# Bulk Delete Documents Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Add bulk document deletion feature to dashboard with selection checkboxes, select all functionality, and confirmation modal.

**Architecture:** Implement selection state at dashboard-content level, pass down through infinite-scroll-documents to document-card components. Create new BulkDeleteHeader and BulkDeleteModal components. Reuse existing deleteDocument action in a loop for each selected document.

**Tech Stack:** React, TypeScript, Next.js 14, Tailwind CSS, shadcn/ui, Supabase

---

## Task 1: Create BulkDeleteHeader Component

**Files:**
- Create: `components/dashboard/bulk-delete-header.tsx`

**Step 1: Create the component file**

Create `components/dashboard/bulk-delete-header.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Trash2 } from "lucide-react";

interface BulkDeleteHeaderProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

export function BulkDeleteHeader({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  isDeleting,
}: BulkDeleteHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm mb-6 py-3 px-4 animate-in slide-in-from-top duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left side - Selection info and controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {t("dashboard.bulkDelete.selected", { count: selectedCount })}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={isDeleting}
              className="h-8 text-xs"
            >
              {t("dashboard.bulkDelete.selectAll")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              disabled={isDeleting}
              className="h-8 text-xs"
            >
              {t("dashboard.bulkDelete.deselectAll")}
            </Button>
          </div>
        </div>

        {/* Right side - Delete button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={selectedCount === 0 || isDeleting}
          className="h-8"
        >
          <Trash2 className="mr-2 h-3 w-3" />
          {isDeleting
            ? t("dashboard.bulkDelete.deleting")
            : t("dashboard.bulkDelete.deleteSelected")}
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors for this file

**Step 3: Commit**

```bash
git add components/dashboard/bulk-delete-header.tsx
git commit -m "feat(dashboard): add bulk delete header component"
```

---

## Task 2: Create BulkDeleteModal Component

**Files:**
- Create: `components/dashboard/bulk-delete-modal.tsx`

**Step 1: Create the modal component**

Create `components/dashboard/bulk-delete-modal.tsx`:

```typescript
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import { AlertTriangle } from "lucide-react";
import type { Document } from "@/lib/supabase/database.types";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  documents: Document[];
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  documents,
}: BulkDeleteModalProps) {
  const { t } = useLanguage();

  // Separate documents by status
  const draftDocs = documents.filter((d) => d.status === "draft");
  const completedDocs = documents.filter((d) => d.status === "completed");

  // Display up to 5 document names
  const displayDocs = documents.slice(0, 5);
  const remainingCount = documents.length - 5;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t("dashboard.bulkDelete.modalTitle")}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p className="font-medium text-foreground">
              {t("dashboard.bulkDelete.modalWarning")}
            </p>

            {/* Document list */}
            <div className="bg-muted rounded-md p-3 max-h-[200px] overflow-y-auto">
              <ul className="space-y-1 text-sm">
                {displayDocs.map((doc) => (
                  <li key={doc.id} className="truncate">
                    • {doc.alias || doc.filename}
                  </li>
                ))}
                {remainingCount > 0 && (
                  <li className="text-muted-foreground italic">
                    {t("dashboard.bulkDelete.andMore", { count: remainingCount })}
                  </li>
                )}
              </ul>
            </div>

            {/* Status-specific warnings */}
            <div className="space-y-2 text-sm">
              {draftDocs.length > 0 && (
                <p className="text-orange-600 dark:text-orange-400">
                  {t("dashboard.bulkDelete.draftWarning", { count: draftDocs.length })}
                </p>
              )}
              {completedDocs.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400">
                  {t("dashboard.bulkDelete.completedWarning", {
                    count: completedDocs.length,
                  })}
                </p>
              )}
            </div>

            <p className="text-destructive font-medium">
              {t("dashboard.bulkDelete.irreversible")}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("dashboard.bulkDelete.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading
              ? t("dashboard.bulkDelete.deleting")
              : t("dashboard.bulkDelete.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors for this file

**Step 3: Commit**

```bash
git add components/dashboard/bulk-delete-modal.tsx
git commit -m "feat(dashboard): add bulk delete modal component"
```

---

## Task 3: Add Selection State to DashboardContent

**Files:**
- Modify: `components/dashboard/dashboard-content.tsx`

**Step 1: Add imports and selection state**

At the top of `dashboard-content.tsx`, add imports:

```typescript
import { BulkDeleteHeader } from "@/components/dashboard/bulk-delete-header";
import { BulkDeleteModal } from "@/components/dashboard/bulk-delete-modal";
import { deleteDocument } from "@/app/actions/document-actions";
import { toast } from "sonner";
```

Inside the `DashboardContent` component, add state after existing state declarations:

```typescript
// Selection state for bulk delete
const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
const [isBulkDeleting, setIsBulkDeleting] = useState(false);
const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
```

**Step 2: Add selection handler functions**

Add these functions inside the component, before the return statement:

```typescript
// Toggle individual document selection
const toggleDocumentSelection = (documentId: string, canDelete: boolean) => {
  if (!canDelete) return;

  setSelectedDocumentIds((prev) => {
    const next = new Set(prev);
    if (next.has(documentId)) {
      next.delete(documentId);
    } else {
      next.add(documentId);
    }
    return next;
  });
};

// Select all deletable documents on current page
const handleSelectAll = () => {
  const deletableDocIds = documents
    .filter((doc) => doc.status === "draft" || doc.status === "completed")
    .map((doc) => doc.id);

  setSelectedDocumentIds(new Set(deletableDocIds));
};

// Deselect all documents
const handleDeselectAll = () => {
  setSelectedDocumentIds(new Set());
};

// Open bulk delete modal
const handleBulkDeleteClick = () => {
  if (selectedDocumentIds.size === 0) return;
  setIsBulkDeleteModalOpen(true);
};

// Execute bulk delete
const handleBulkDeleteConfirm = async () => {
  setIsBulkDeleting(true);

  const selectedIds = Array.from(selectedDocumentIds);
  const selectedDocs = documents.filter((doc) => selectedIds.includes(doc.id));

  let successCount = 0;
  let failCount = 0;
  const failures: { name: string; error: string }[] = [];

  // Delete each document sequentially
  for (const doc of selectedDocs) {
    try {
      const result = await deleteDocument(doc.id);

      if (result.error) {
        failCount++;
        failures.push({
          name: doc.alias || doc.filename,
          error: result.error,
        });
      } else {
        successCount++;
      }
    } catch (error) {
      failCount++;
      failures.push({
        name: doc.alias || doc.filename,
        error: "Unexpected error occurred",
      });
    }
  }

  // Close modal and reset state
  setIsBulkDeleteModalOpen(false);
  setIsBulkDeleting(false);

  // Show results
  if (successCount > 0) {
    toast.success(t("dashboard.bulkDelete.successMessage", { count: successCount }));
  }

  if (failCount > 0) {
    const errorMessage = failures.map((f) => `${f.name}: ${f.error}`).join(", ");
    toast.error(t("dashboard.bulkDelete.errorMessage", { count: failCount, details: errorMessage }));
  }

  // Clear selection only if all succeeded
  if (failCount === 0) {
    setSelectedDocumentIds(new Set());
  } else {
    // Keep failed documents selected for retry
    const failedIds = failures
      .map((f) => selectedDocs.find((d) => (d.alias || d.filename) === f.name)?.id)
      .filter(Boolean) as string[];
    setSelectedDocumentIds(new Set(failedIds));
  }

  // Reload dashboard data
  const statusFilter = selectedStatus === "all" ? undefined : selectedStatus;
  const result = await getDashboardData(1, 12, statusFilter);

  if (!result.error) {
    setDocuments(result.documents);
    setHasMore(result.hasMore);
    setTotal(result.total);
    setStatusCounts(result.counts);
  }
};
```

**Step 3: Clear selection when filter changes**

Find the existing `useEffect` that loads dashboard data (around line 44-79). Add this line at the end of the effect, just before `loadDashboardData();`:

```typescript
// Clear selection when filter changes
setSelectedDocumentIds(new Set());
```

**Step 4: Add bulk header and modal to JSX**

In the return statement, find the section where `activeTab === "documents"` renders. Add the BulkDeleteHeader right after `<StatusFilter>` and before the empty state check:

```typescript
{activeTab === "documents" && (
  <>
    {/* Status Filter for Documents */}
    <StatusFilter
      selectedStatus={selectedStatus}
      onStatusChange={setSelectedStatus}
      counts={statusCounts}
    />

    {/* Bulk Delete Header - show when documents are selected */}
    {selectedDocumentIds.size > 0 && (
      <BulkDeleteHeader
        selectedCount={selectedDocumentIds.size}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDelete={handleBulkDeleteClick}
        isDeleting={isBulkDeleting}
      />
    )}

    {/* Documents or Empty State */}
    {documents.length === 0 ? (
      // ... existing empty state code
```

At the very end of the return statement (before the final closing tags), add the BulkDeleteModal:

```typescript
      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        isLoading={isBulkDeleting}
        documents={documents.filter((doc) =>
          selectedDocumentIds.has(doc.id)
        )}
      />
    </>
  );
}
```

**Step 5: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 6: Commit**

```bash
git add components/dashboard/dashboard-content.tsx
git commit -m "feat(dashboard): add bulk delete state and handlers to dashboard content"
```

---

## Task 4: Update InfiniteScrollDocuments to Pass Selection Props

**Files:**
- Modify: `components/dashboard/infinite-scroll-documents.tsx`

**Step 1: Add selection props to interface**

Update the `InfiniteScrollDocumentsProps` interface:

```typescript
interface InfiniteScrollDocumentsProps {
  initialDocuments: Document[];
  initialHasMore: boolean;
  status?: "draft" | "published" | "completed";
  // Bulk delete props
  selectedDocumentIds: Set<string>;
  onToggleSelection: (documentId: string, canDelete: boolean) => void;
}
```

**Step 2: Destructure new props**

Update the component destructuring:

```typescript
export function InfiniteScrollDocuments({
  initialDocuments,
  initialHasMore,
  status,
  selectedDocumentIds,
  onToggleSelection,
}: InfiniteScrollDocumentsProps) {
```

**Step 3: Pass props to DocumentCard**

Find the `documents.map` section (around line 86) and update the DocumentCard component:

```typescript
{documents.map((document) => (
  <DocumentCard
    key={document.id}
    document={document}
    isSelected={selectedDocumentIds.has(document.id)}
    onToggleSelection={onToggleSelection}
  />
))}
```

**Step 4: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add components/dashboard/infinite-scroll-documents.tsx
git commit -m "feat(dashboard): pass selection props through infinite scroll component"
```

---

## Task 5: Update DashboardContent to Pass Props to InfiniteScrollDocuments

**Files:**
- Modify: `components/dashboard/dashboard-content.tsx`

**Step 1: Update InfiniteScrollDocuments usage**

Find the `<InfiniteScrollDocuments>` component (around line 132) and update it:

```typescript
<InfiniteScrollDocuments
  initialDocuments={documents}
  initialHasMore={hasMore}
  status={selectedStatus === "all" ? undefined : selectedStatus}
  selectedDocumentIds={selectedDocumentIds}
  onToggleSelection={toggleDocumentSelection}
/>
```

**Step 2: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add components/dashboard/dashboard-content.tsx
git commit -m "feat(dashboard): connect selection props to infinite scroll"
```

---

## Task 6: Add Checkbox to DocumentCard

**Files:**
- Modify: `components/dashboard/document-card.tsx`

**Step 1: Add new props to interface**

Update the `DocumentCardProps` interface:

```typescript
interface DocumentCardProps {
  document: Document;
  isSelected: boolean;
  onToggleSelection: (documentId: string, canDelete: boolean) => void;
}
```

**Step 2: Destructure new props and add selection logic**

Update component signature and add delete check:

```typescript
export function DocumentCard({ document, isSelected, onToggleSelection }: DocumentCardProps) {
  const { t, language } = useLanguage();

  // Check if document can be deleted (draft or completed)
  const canDelete = document.status === "draft" || document.status === "completed";

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    onToggleSelection(document.id, canDelete);
  };
```

**Step 3: Update the return JSX with checkbox**

Replace the existing `return` statement. The link should now be a div, and add checkbox overlay:

```typescript
return (
  <div className="relative">
    {/* Selection Checkbox */}
    <div
      className={`absolute top-3 left-3 z-10 ${
        canDelete ? "cursor-pointer" : "cursor-not-allowed opacity-50"
      }`}
      onClick={handleCheckboxClick}
      title={
        canDelete
          ? isSelected
            ? t("dashboard.bulkDelete.deselect")
            : t("dashboard.bulkDelete.select")
          : t("dashboard.bulkDelete.cannotDelete")
      }
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-primary border-primary"
            : "bg-background border-gray-300 hover:border-primary"
        } ${!canDelete && "bg-gray-100 dark:bg-gray-800"}`}
      >
        {isSelected && (
          <svg
            className="w-3 h-3 text-primary-foreground"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
        )}
      </div>
    </div>

    {/* Document Card */}
    <Link href={`/document/${document.id}`} className="block group">
      <Card
        className={`transition-all duration-200 hover:shadow-md hover:border-primary/20 group-hover:scale-[1.02] h-48 flex flex-col ${
          isSelected ? "border-primary shadow-md" : ""
        }`}
      >
        <CardHeader className="pb-3 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={statusBadge.variant} className="flex-shrink-0 text-xs">
              {statusBadge.label}
            </Badge>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <h3
              className="font-medium text-sm leading-relaxed text-center px-2 break-words"
              title={displayName}
            >
              {truncateFilename(displayName)}
            </h3>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 mt-auto">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={document.created_at}>{formattedDate}</time>
          </div>
        </CardContent>
      </Card>
    </Link>
  </div>
);
```

**Step 4: Verify component compiles**

Run: `npm run build`
Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add components/dashboard/document-card.tsx
git commit -m "feat(dashboard): add selection checkbox to document card"
```

---

## Task 7: Add i18n Translations

**Files:**
- Modify: `contexts/language-context.tsx`

**Step 1: Add Korean translations**

Find the `translations` object and add bulk delete translations to the Korean (`ko`) section, inside the `dashboard` object:

```typescript
dashboard: {
  // ... existing translations
  bulkDelete: {
    selected: "{{count}}개 선택됨",
    selectAll: "모두 선택",
    deselectAll: "선택 해제",
    deleteSelected: "선택 항목 삭제",
    deleting: "삭제 중...",
    select: "선택",
    deselect: "선택 해제",
    cannotDelete: "발행된 문서는 삭제할 수 없습니다",
    modalTitle: "문서 일괄 삭제",
    modalWarning: "다음 문서들을 삭제하시겠습니까?",
    andMore: "외 {{count}}개",
    draftWarning: "초안 {{count}}개는 영구적으로 삭제됩니다",
    completedWarning: "완료된 문서 {{count}}개는 보관됩니다",
    irreversible: "이 작업은 되돌릴 수 없습니다.",
    cancel: "취소",
    confirmDelete: "삭제",
    successMessage: "{{count}}개 문서가 삭제되었습니다",
    errorMessage: "{{count}}개 문서 삭제 실패: {{details}}",
  },
},
```

**Step 2: Add English translations**

Add the same structure to the English (`en`) section:

```typescript
dashboard: {
  // ... existing translations
  bulkDelete: {
    selected: "{{count}} selected",
    selectAll: "Select All",
    deselectAll: "Deselect All",
    deleteSelected: "Delete Selected",
    deleting: "Deleting...",
    select: "Select",
    deselect: "Deselect",
    cannotDelete: "Published documents cannot be deleted",
    modalTitle: "Bulk Delete Documents",
    modalWarning: "Are you sure you want to delete the following documents?",
    andMore: "and {{count}} more",
    draftWarning: "{{count}} draft document(s) will be permanently deleted",
    completedWarning: "{{count}} completed document(s) will be archived",
    irreversible: "This action cannot be undone.",
    cancel: "Cancel",
    confirmDelete: "Delete",
    successMessage: "{{count}} document(s) deleted successfully",
    errorMessage: "Failed to delete {{count}} document(s): {{details}}",
  },
},
```

**Step 3: Verify no TypeScript errors**

Run: `npm run build`
Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add contexts/language-context.tsx
git commit -m "feat(i18n): add bulk delete translations for ko and en"
```

---

## Task 8: Manual Testing

**Testing Checklist:**

1. **Selection Functionality:**
   - [ ] Click checkbox on draft document - should select
   - [ ] Click checkbox on completed document - should select
   - [ ] Click checkbox on published document - should show disabled state
   - [ ] Bulk header appears when any document selected
   - [ ] Selection count shows correct number

2. **Select All/Deselect All:**
   - [ ] Click "Select All" - only draft and completed selected
   - [ ] Published documents remain unselected
   - [ ] Click "Deselect All" - all selections cleared
   - [ ] Bulk header disappears when deselected

3. **Bulk Delete Modal:**
   - [ ] Click "Delete Selected" - modal opens
   - [ ] Shows correct list of selected documents
   - [ ] Shows warning for draft documents (permanent)
   - [ ] Shows warning for completed documents (archived)
   - [ ] "Cancel" closes modal without deleting
   - [ ] "Delete" button shows loading state

4. **Deletion Process:**
   - [ ] Select multiple draft documents → delete → success
   - [ ] Select multiple completed documents → delete → success
   - [ ] Select mix of draft and completed → delete → success
   - [ ] Dashboard refreshes after deletion
   - [ ] Document count updates correctly

5. **Error Handling:**
   - [ ] If deletion fails, error toast shows
   - [ ] Failed documents remain selected
   - [ ] Can retry deletion on failed documents

6. **Filter Changes:**
   - [ ] Select documents → change filter → selection clears
   - [ ] Bulk header disappears when filter changes

7. **Responsive Design:**
   - [ ] Mobile: Checkboxes visible and tappable
   - [ ] Mobile: Bulk header layout adapts
   - [ ] Mobile: Modal is readable
   - [ ] Desktop: All elements properly sized

8. **i18n:**
   - [ ] Switch to English - all labels translate
   - [ ] Switch to Korean - all labels translate
   - [ ] Count interpolation works ({{count}})

**Test with different scenarios:**
- Empty dashboard
- 1 document
- Mixed status documents (draft, published, completed)
- Many documents (test infinite scroll interaction)

**No automated tests needed** - This is pure UI/UX feature with existing deleteDocument action already tested.

---

## Completion Checklist

- [ ] All 7 implementation tasks completed and committed
- [ ] Manual testing checklist completed
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] No console errors in browser
- [ ] Feature works in both Korean and English
- [ ] Feature works on mobile and desktop
- [ ] All commits follow conventional commit format

---

## Notes for Engineer

- **Existing delete logic** in `app/actions/document-actions.ts` handles draft vs completed differently - don't modify this
- **Selection state** lives in dashboard-content.tsx to survive infinite scroll
- **Published documents** can never be deleted - this is enforced at action level
- **Partial failures** keep failed documents selected for retry
- **No new server actions** needed - reuse existing `deleteDocument()`
