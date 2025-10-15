# Publication System Implementation Plan

> **For Claude:** Use `${SUPERPOWERS_SKILLS_ROOT}/skills/collaboration/executing-plans/SKILL.md` to implement this plan task-by-task.

**Goal:** Separate document upload from publication workflow, enabling N documents to be published together with a single short_url.

**Architecture:** Create new `publications` table to manage publishing metadata (name, password, expiration, short_url). Documents remain independent and can be grouped into publications. Clean break approach - remove legacy publication fields from documents table.

**Tech Stack:** Next.js 14, Supabase (PostgreSQL + Storage), TypeScript, Server Actions, shadcn/ui

---

## Task 1: Database Schema - Create publications table

**Files:**
- Create migration file via Supabase CLI

**Step 1: Create publications table migration**

```sql
-- Create publications table
CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  password TEXT,
  expires_at TIMESTAMPTZ,
  short_url VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for fast short_url lookups
CREATE INDEX idx_publications_short_url ON publications(short_url);
CREATE INDEX idx_publications_user_id ON publications(user_id);

-- Add RLS policies
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own publications"
  ON publications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own publications"
  ON publications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own publications"
  ON publications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own publications"
  ON publications FOR DELETE
  USING (auth.uid() = user_id);

-- Public can view active publications by short_url (for signing)
CREATE POLICY "Public can view active publications"
  ON publications FOR SELECT
  USING (status = 'active');
```

**Step 2: Apply migration**

```bash
# Via Supabase dashboard SQL editor or CLI
# Verify tables created
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add publications table with RLS policies"
```

---

## Task 2: Database Schema - Modify documents table

**Files:**
- Create migration file via Supabase CLI

**Step 1: Add publication_id to documents and remove legacy fields**

```sql
-- Add publication_id foreign key
ALTER TABLE documents
  ADD COLUMN publication_id UUID REFERENCES publications(id) ON DELETE SET NULL;

-- Add index for publication lookups
CREATE INDEX idx_documents_publication_id ON documents(publication_id);

-- Remove legacy publication fields
ALTER TABLE documents
  DROP COLUMN IF EXISTS short_url,
  DROP COLUMN IF EXISTS password,
  DROP COLUMN IF EXISTS expires_at;

-- Note: This is a breaking change - existing published documents will lose their short_urls
-- This is acceptable since we're pre-launch
```

**Step 2: Apply migration**

```bash
# Apply via Supabase dashboard or CLI
```

**Step 3: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add publication_id to documents, remove legacy fields"
```

---

## Task 3: Update TypeScript Database Types

**Files:**
- Modify: `lib/supabase/database.types.ts`

**Step 1: Regenerate types from Supabase**

```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
```

**Step 2: Add helper types**

Edit `lib/supabase/database.types.ts` to add at the bottom:

```typescript
// Helper types for publications
export type Publication = Database["public"]["Tables"]["publications"]["Row"];
export type PublicationInsert = Database["public"]["Tables"]["publications"]["Insert"];
export type PublicationUpdate = Database["public"]["Tables"]["publications"]["Update"];

// Extended type with documents
export interface PublicationWithDocuments extends Publication {
  documents?: Document[];
}

// Client-side Publication type (excludes password hash)
export type ClientPublication = Omit<Publication, "password"> & {
  requiresPassword?: boolean;
  documentCount?: number;
};
```

**Step 3: Verify types compile**

```bash
npm run build
```

Expected: Build succeeds with no type errors

**Step 4: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "feat(types): add publication types and helpers"
```

---

## Task 4: Create Publication Server Actions

**Files:**
- Create: `app/actions/publication-actions.ts`

**Step 1: Create publication-actions.ts with createPublication**

```typescript
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Publication, PublicationInsert } from "@/lib/supabase/database.types";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

// Generate random short URL
function generateShortUrl(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Create a new publication and link documents to it
 */
export async function createPublication(
  name: string,
  password: string,
  expiresAt: string | null,
  documentIds: string[]
): Promise<{ success?: boolean; shortUrl?: string; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Validate inputs
    if (!name.trim()) {
      return { error: "Publication name is required" };
    }

    if (documentIds.length === 0) {
      return { error: "At least one document must be selected" };
    }

    // Verify all documents belong to user and are draft status
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id, status")
      .in("id", documentIds)
      .eq("user_id", user.id);

    if (docError || !documents) {
      return { error: "Failed to verify documents" };
    }

    if (documents.length !== documentIds.length) {
      return { error: "Some documents not found or not owned by user" };
    }

    const nonDraftDocs = documents.filter(d => d.status !== "draft");
    if (nonDraftDocs.length > 0) {
      return { error: "Only draft documents can be published" };
    }

    // TODO: Check subscription limits
    // This will be implemented when subscription-actions.ts is updated

    // Hash password
    const trimmedPassword = password.trim();
    const passwordHash = trimmedPassword
      ? await bcrypt.hash(trimmedPassword, 12)
      : null;

    // Generate short URL
    const shortUrl = generateShortUrl();

    // Create publication
    const publicationData: PublicationInsert = {
      user_id: user.id,
      name: name.trim(),
      password: passwordHash,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      short_url: shortUrl,
      status: "active"
    };

    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .insert(publicationData)
      .select()
      .single();

    if (pubError || !publication) {
      console.error("Publication creation error:", pubError);
      return { error: "Failed to create publication" };
    }

    // Link documents to publication and update status
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        publication_id: publication.id,
        status: "published"
      })
      .in("id", documentIds);

    if (updateError) {
      console.error("Document linking error:", updateError);
      // Rollback: delete publication
      await supabase.from("publications").delete().eq("id", publication.id);
      return { error: "Failed to link documents to publication" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/publish");

    return { success: true, shortUrl: publication.short_url };
  } catch (error) {
    console.error("Create publication error:", error);
    return { error: "An unexpected error occurred" };
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: No type errors

**Step 3: Commit**

```bash
git add app/actions/publication-actions.ts
git commit -m "feat(actions): add createPublication server action"
```

---

## Task 5: Add More Publication Server Actions

**Files:**
- Modify: `app/actions/publication-actions.ts`

**Step 1: Add getUserPublications**

Add to `app/actions/publication-actions.ts`:

```typescript
/**
 * Get user's publications with document counts
 */
export async function getUserPublications(): Promise<{
  publications: ClientPublication[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { publications: [], error: "User not authenticated" };
    }

    // Get publications with document counts
    const { data: publications, error: pubError } = await supabase
      .from("publications")
      .select(`
        id,
        name,
        short_url,
        status,
        expires_at,
        created_at,
        documents:documents(count)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (pubError) {
      console.error("Get publications error:", pubError);
      return { publications: [], error: "Failed to load publications" };
    }

    // Transform to client format
    const clientPublications = (publications || []).map(pub => ({
      id: pub.id,
      name: pub.name,
      short_url: pub.short_url,
      status: pub.status,
      expires_at: pub.expires_at,
      created_at: pub.created_at,
      requiresPassword: false, // We don't send password info to client
      documentCount: pub.documents?.[0]?.count || 0
    }));

    return { publications: clientPublications };
  } catch (error) {
    console.error("Get publications error:", error);
    return { publications: [], error: "An unexpected error occurred" };
  }
}
```

**Step 2: Add getPublicationByShortUrl**

Add to `app/actions/publication-actions.ts`:

```typescript
import type { ClientPublication, ClientDocument, Signature } from "@/lib/supabase/database.types";

/**
 * Get publication by short URL (for signing page)
 */
export async function getPublicationByShortUrl(shortUrl: string): Promise<{
  publication: ClientPublication | null;
  documents: ClientDocument[];
  signatures: Record<string, Signature[]>;
  error?: string;
  isExpired?: boolean;
  isCompleted?: boolean;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get publication
    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select("*")
      .eq("short_url", shortUrl)
      .single();

    if (pubError || !publication) {
      return {
        publication: null,
        documents: [],
        signatures: {},
        error: "Publication not found"
      };
    }

    // Check if expired
    const isExpired = publication.expires_at &&
      new Date(publication.expires_at) < new Date();

    if (isExpired) {
      return {
        publication: null,
        documents: [],
        signatures: {},
        error: "Publication has expired",
        isExpired: true
      };
    }

    // Check if completed
    const isCompleted = publication.status === "completed";

    if (isCompleted) {
      return {
        publication: null,
        documents: [],
        signatures: {},
        error: "All documents have been signed",
        isCompleted: true
      };
    }

    // Get documents in this publication
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("publication_id", publication.id)
      .order("created_at");

    if (docError) {
      console.error("Get documents error:", docError);
      return {
        publication: null,
        documents: [],
        signatures: {},
        error: "Failed to load documents"
      };
    }

    // Get signatures for all documents
    const documentIds = (documents || []).map(d => d.id);
    const { data: allSignatures, error: sigError } = await supabase
      .from("signatures")
      .select("*")
      .in("document_id", documentIds)
      .order("area_index");

    if (sigError) {
      console.error("Get signatures error:", sigError);
    }

    // Group signatures by document_id
    const signaturesByDoc: Record<string, Signature[]> = {};
    (allSignatures || []).forEach(sig => {
      if (!signaturesByDoc[sig.document_id]) {
        signaturesByDoc[sig.document_id] = [];
      }
      signaturesByDoc[sig.document_id].push(sig);
    });

    // Transform to client format
    const { password, ...pubWithoutPassword } = publication;
    const clientPublication: ClientPublication = {
      ...pubWithoutPassword,
      requiresPassword: !!password
    };

    const clientDocuments = (documents || []).map(doc => {
      const { password: _, ...docWithoutPassword } = doc;
      return {
        ...docWithoutPassword,
        requiresPassword: false
      };
    });

    return {
      publication: clientPublication,
      documents: clientDocuments,
      signatures: signaturesByDoc
    };
  } catch (error) {
    console.error("Get publication error:", error);
    return {
      publication: null,
      documents: [],
      signatures: {},
      error: "An unexpected error occurred"
    };
  }
}
```

**Step 3: Add verifyPublicationPassword**

Add to `app/actions/publication-actions.ts`:

```typescript
/**
 * Verify publication password
 */
export async function verifyPublicationPassword(
  shortUrl: string,
  password: string
): Promise<{ success?: boolean; isValid?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select("password")
      .eq("short_url", shortUrl)
      .single();

    if (pubError || !publication) {
      return { error: "Publication not found" };
    }

    if (!publication.password) {
      // No password set
      return { success: true, isValid: true };
    }

    const isValid = await bcrypt.compare(password, publication.password);

    return { success: true, isValid };
  } catch (error) {
    console.error("Verify password error:", error);
    return { error: "An unexpected error occurred" };
  }
}
```

**Step 4: Add deletePublication**

Add to `app/actions/publication-actions.ts`:

```typescript
/**
 * Delete a publication (unlinks documents, sets them back to draft)
 */
export async function deletePublication(publicationId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    // Verify ownership
    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select("id, user_id")
      .eq("id", publicationId)
      .eq("user_id", user.id)
      .single();

    if (pubError || !publication) {
      return { error: "Publication not found" };
    }

    // Unlink documents (set back to draft)
    const { error: unlinkError } = await supabase
      .from("documents")
      .update({
        publication_id: null,
        status: "draft"
      })
      .eq("publication_id", publicationId);

    if (unlinkError) {
      console.error("Unlink documents error:", unlinkError);
      return { error: "Failed to unlink documents" };
    }

    // Delete publication
    const { error: deleteError } = await supabase
      .from("publications")
      .delete()
      .eq("id", publicationId);

    if (deleteError) {
      console.error("Delete publication error:", deleteError);
      return { error: "Failed to delete publication" };
    }

    revalidatePath("/dashboard");
    revalidatePath("/publish");

    return { success: true };
  } catch (error) {
    console.error("Delete publication error:", error);
    return { error: "An unexpected error occurred" };
  }
}
```

**Step 5: Verify TypeScript compiles**

```bash
npm run build
```

Expected: No type errors

**Step 6: Commit**

```bash
git add app/actions/publication-actions.ts
git commit -m "feat(actions): add publication CRUD operations"
```

---

## Task 6: Update Subscription Actions for Publication Limits

**Files:**
- Modify: `app/actions/subscription-actions.ts`

**Step 1: Add canCreatePublication function**

Add to `app/actions/subscription-actions.ts`:

```typescript
/**
 * Check if user can create a publication with N documents
 * Limit check: (currently published documents) + documentCount <= plan limit
 */
export async function canCreatePublication(
  documentCount: number
): Promise<{
  canCreate: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        canCreate: false,
        error: "User not authenticated"
      };
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("Subscription error:", subError);
      return { canCreate: false, error: "Failed to check subscription" };
    }

    // Default to FREE plan if no active subscription
    const plan = subscription?.plan || "FREE";

    // Get plan limits
    const limits: Record<string, number> = {
      FREE: 5,
      PRO: 50,
      ENTERPRISE: 999999
    };

    const limit = limits[plan] || 5;

    // Count currently published documents
    const { count: publishedCount, error: countError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "published");

    if (countError) {
      console.error("Count error:", countError);
      return { canCreate: false, error: "Failed to count documents" };
    }

    const currentPublished = publishedCount || 0;

    if (currentPublished + documentCount > limit) {
      return {
        canCreate: false,
        reason: `Plan limit reached. Your ${plan} plan allows ${limit} documents. Currently published: ${currentPublished}. Trying to publish: ${documentCount} more.`
      };
    }

    return { canCreate: true };
  } catch (error) {
    console.error("Can create publication error:", error);
    return { canCreate: false, error: "An unexpected error occurred" };
  }
}
```

**Step 2: Remove canPublishDocument (legacy)**

Find and comment out or remove `canPublishDocument` function in `subscription-actions.ts`:

```typescript
// Legacy function - no longer used after publication system refactor
// export async function canPublishDocument() { ... }
```

**Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: No type errors

**Step 4: Commit**

```bash
git add app/actions/subscription-actions.ts
git commit -m "feat(subscription): add publication limit check, deprecate old logic"
```

---

## Task 7: Update Document Actions to Remove Publishing Logic

**Files:**
- Modify: `app/actions/document-actions.ts`

**Step 1: Remove publishDocument function**

Remove the entire `publishDocument` function from `document-actions.ts` (lines ~404-466).

**Step 2: Remove republishDocument function**

Remove the entire `republishDocument` function from `document-actions.ts` (lines ~468-544).

**Step 3: Update uploadDocument to remove short_url**

Find the `uploadDocument` function and remove short_url generation:

```typescript
// Remove these lines:
// const shortUrl = generateShortUrl();

// Update documentData:
const documentData: DocumentInsert = {
  filename,
  file_url: fileUrl,
  // short_url: shortUrl,  // REMOVE THIS
  status: "draft",
  user_id: user.id,
};

// Update return:
return { success: true, document };  // Remove shortUrl from return
```

**Step 4: Update getDocumentByShortUrl to throw error**

Replace `getDocumentByShortUrl` with deprecation notice:

```typescript
/**
 * @deprecated Use getPublicationByShortUrl from publication-actions instead
 */
export async function getDocumentByShortUrl(shortUrl: string): Promise<{
  document: ClientDocument | null;
  signatures: Signature[];
  error?: string;
}> {
  return {
    document: null,
    signatures: [],
    error: "This function is deprecated. Use publications instead."
  };
}
```

**Step 5: Verify TypeScript compiles**

```bash
npm run build
```

Expected: Build may show some errors in components using these functions - that's expected, we'll fix those next.

**Step 6: Commit**

```bash
git add app/actions/document-actions.ts
git commit -m "refactor(actions): remove document publishing logic, move to publications"
```

---

## Task 8: Create Publish Page

**Files:**
- Create: `app/(document)/publish/page.tsx`
- Create: `app/(document)/publish/components/publish-form.tsx`

**Step 1: Create publish page directory and structure**

```bash
mkdir -p app/\(document\)/publish/components
```

**Step 2: Create publish-form.tsx**

Create `app/(document)/publish/components/publish-form.tsx`:

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Share, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPublication } from "@/app/actions/publication-actions";
import { useRouter } from "next/navigation";
import type { Document } from "@/lib/supabase/database.types";

interface PublishFormProps {
  availableDocuments: Document[];
  preselectedIds?: string[];
}

export default function PublishForm({
  availableDocuments,
  preselectedIds = []
}: PublishFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(preselectedIds);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    password?: string;
    expiresAt?: string;
    documents?: string;
  }>({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "발행 이름은 필수입니다";
    }

    if (!password.trim()) {
      newErrors.password = "비밀번호는 필수입니다";
    } else if (password.length < 4) {
      newErrors.password = "비밀번호는 최소 4자 이상이어야 합니다";
    }

    if (!expiresAt) {
      newErrors.expiresAt = "만료 기간은 필수입니다";
    } else if (expiresAt <= new Date()) {
      newErrors.expiresAt = "만료 기간은 현재 시간보다 이후여야 합니다";
    }

    if (selectedDocIds.length === 0) {
      newErrors.documents = "최소 1개의 문서를 선택해야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await createPublication(
        name,
        password,
        expiresAt!.toISOString(),
        selectedDocIds
      );

      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.success && result.shortUrl) {
        alert(`발행 완료! URL: ${window.location.origin}/sign/${result.shortUrl}`);
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Publish error:", error);
      alert("발행 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDocument = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
    if (errors.documents) {
      setErrors(prev => ({ ...prev, documents: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Publication Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          발행 이름 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="예: 2024년 계약서 패키지"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors(prev => ({ ...prev, name: undefined }));
            }
          }}
          disabled={isLoading}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">
          비밀번호 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="서명 페이지 접근용 비밀번호"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) {
              setErrors(prev => ({ ...prev, password: undefined }));
            }
          }}
          disabled={isLoading}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password}</p>
        )}
      </div>

      {/* Expiration Date */}
      <div className="space-y-2">
        <Label>
          만료 기간 <span className="text-red-500">*</span>
        </Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !expiresAt && "text-muted-foreground",
                errors.expiresAt && "border-red-500"
              )}
              disabled={isLoading}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiresAt
                ? expiresAt.toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "서명 만료 날짜를 선택하세요"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={expiresAt}
              onSelect={(date) => {
                if (date) {
                  const endOfDay = new Date(date);
                  endOfDay.setHours(23, 59, 59, 999);
                  setExpiresAt(endOfDay);
                  if (errors.expiresAt) {
                    setErrors(prev => ({ ...prev, expiresAt: undefined }));
                  }
                }
                setIsCalendarOpen(false);
              }}
              disabled={(date) => date < today}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.expiresAt && (
          <p className="text-sm text-red-500">{errors.expiresAt}</p>
        )}
      </div>

      {/* Document Selection */}
      <div className="space-y-2">
        <Label>
          발행할 문서 선택 <span className="text-red-500">*</span>
        </Label>
        <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
          {availableDocuments.length === 0 ? (
            <p className="text-sm text-gray-500">
              발행 가능한 문서가 없습니다. 먼저 문서를 업로드해주세요.
            </p>
          ) : (
            availableDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
              >
                <Checkbox
                  id={`doc-${doc.id}`}
                  checked={selectedDocIds.includes(doc.id)}
                  onCheckedChange={() => toggleDocument(doc.id)}
                  disabled={isLoading}
                />
                <label
                  htmlFor={`doc-${doc.id}`}
                  className="flex-1 text-sm cursor-pointer"
                >
                  {doc.filename}
                </label>
                <span className="text-xs text-gray-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
        {errors.documents && (
          <p className="text-sm text-red-500">{errors.documents}</p>
        )}
        <p className="text-xs text-gray-500">
          선택된 문서: {selectedDocIds.length}개
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              발행 중...
            </>
          ) : (
            <>
              <Share className="mr-2 h-4 w-4" />
              발행하기
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
```

**Step 3: Create publish page.tsx**

Create `app/(document)/publish/page.tsx`:

```typescript
import { getUserDocuments } from "@/app/actions/document-actions";
import { redirect } from "next/navigation";
import PublishForm from "./components/publish-form";

export default async function PublishPage({
  searchParams
}: {
  searchParams: { docId?: string }
}) {
  // Get draft documents
  const { documents, error } = await getUserDocuments(1, 999, "draft");

  if (error) {
    redirect("/dashboard");
  }

  const preselectedIds = searchParams.docId ? [searchParams.docId] : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">문서 발행</h1>
        <p className="text-gray-600">
          여러 문서를 선택하여 하나의 URL로 발행할 수 있습니다.
        </p>
      </div>

      <PublishForm
        availableDocuments={documents}
        preselectedIds={preselectedIds}
      />
    </div>
  );
}
```

**Step 4: Verify TypeScript compiles**

```bash
npm run build
```

Expected: May have errors about missing Checkbox component - we'll add that next

**Step 5: Commit**

```bash
git add app/\(document\)/publish/
git commit -m "feat(ui): add publish page with document selection"
```

---

## Task 9: Add Checkbox Component (if missing)

**Files:**
- Create: `components/ui/checkbox.tsx` (if not exists)

**Step 1: Check if checkbox exists**

```bash
ls components/ui/checkbox.tsx
```

If it doesn't exist, create it using shadcn:

```bash
npx shadcn-ui@latest add checkbox
```

**Step 2: Verify it works**

```bash
npm run build
```

Expected: No errors

**Step 3: Commit**

```bash
git add components/ui/checkbox.tsx
git commit -m "feat(ui): add checkbox component"
```

---

## Task 10: Update Dashboard to Add Publish Button

**Files:**
- Modify: `app/(document)/dashboard/page.tsx` (or wherever dashboard is)

**Step 1: Find dashboard page and add publish button**

Locate the main dashboard page (likely `app/(document)/dashboard/page.tsx`).

Add a "발행하기" button next to the upload button:

```typescript
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Upload, Share } from "lucide-react";

// In the JSX, next to upload button:
<div className="flex gap-2">
  <Button asChild>
    <Link href="/upload">
      <Upload className="mr-2 h-4 w-4" />
      업로드
    </Link>
  </Button>

  <Button asChild variant="outline">
    <Link href="/publish">
      <Share className="mr-2 h-4 w-4" />
      발행하기
    </Link>
  </Button>
</div>
```

**Step 2: Verify button appears**

```bash
npm run dev
```

Navigate to dashboard and verify both buttons are visible.

**Step 3: Commit**

```bash
git add app/\(document\)/dashboard/
git commit -m "feat(ui): add publish button to dashboard"
```

---

## Task 11: Update Document Detail Page

**Files:**
- Modify: `app/(document)/document/[id]/page.tsx` or components

**Step 1: Change publish button to link to /publish**

Find the document detail page and locate the "발행하기" button.

Change it from opening a modal to navigating to publish page:

```typescript
// Before:
<Button onClick={() => setShowPublishModal(true)}>
  발행하기
</Button>

// After:
import Link from "next/link";

<Button asChild>
  <Link href={`/publish?docId=${document.id}`}>
    <Share className="mr-2 h-4 w-4" />
    발행하기
  </Link>
</Button>
```

**Step 2: Remove PublishDocumentModal import and usage**

```typescript
// Remove these:
// import PublishDocumentModal from "@/components/publish-document-modal";
// const [showPublishModal, setShowPublishModal] = useState(false);
// <PublishDocumentModal ... />
```

**Step 3: Verify it works**

```bash
npm run dev
```

Navigate to a document detail page and click "발행하기" - should go to `/publish?docId=...`

**Step 4: Commit**

```bash
git add app/\(document\)/document/
git commit -m "refactor(ui): change publish button to navigate to publish page"
```

---

## Task 12: Update Sign Page to Use Publications

**Files:**
- Modify: `app/(sign)/sign/[id]/page.tsx`

**Step 1: Update sign page to use getPublicationByShortUrl**

Replace the existing logic in sign page:

```typescript
import { getPublicationByShortUrl, verifyPublicationPassword } from "@/app/actions/publication-actions";

export default async function SignPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { password?: string };
}) {
  const shortUrl = params.id;
  const password = searchParams.password;

  // Get publication with documents
  const {
    publication,
    documents,
    signatures,
    error,
    isExpired,
    isCompleted
  } = await getPublicationByShortUrl(shortUrl);

  if (error || !publication) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">오류</h1>
          <p>{error || "발행을 찾을 수 없습니다"}</p>
        </div>
      </div>
    );
  }

  // Check password if required
  if (publication.requiresPassword && !password) {
    // Show password input form
    return <PasswordForm shortUrl={shortUrl} />;
  }

  if (publication.requiresPassword && password) {
    const { isValid } = await verifyPublicationPassword(shortUrl, password);
    if (!isValid) {
      return <PasswordForm shortUrl={shortUrl} error="비밀번호가 올바르지 않습니다" />;
    }
  }

  // Show list of documents
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{publication.name}</h1>
        <p className="text-gray-600">
          총 {documents.length}개의 문서가 있습니다. 각 문서에 서명해주세요.
        </p>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => {
          const docSignatures = signatures[doc.id] || [];
          const allSigned = docSignatures.every(sig => sig.status === "signed");

          return (
            <div
              key={doc.id}
              className="border rounded-lg p-6 flex items-center justify-between"
            >
              <div>
                <h3 className="font-medium">{doc.filename}</h3>
                <p className="text-sm text-gray-500">
                  {allSigned ? "✅ 서명 완료" : "⏳ 서명 필요"}
                </p>
              </div>
              <Button asChild>
                <Link href={`/sign/${shortUrl}/document/${doc.id}`}>
                  {allSigned ? "서명 확인" : "서명하기"}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2: Create PasswordForm component**

Create `app/(sign)/sign/[id]/components/password-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordForm({
  shortUrl,
  error
}: {
  shortUrl: string;
  error?: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/sign/${shortUrl}?password=${encodeURIComponent(password)}`);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">비밀번호 입력</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
            />
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            확인
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Create individual document signing page**

Create `app/(sign)/sign/[id]/document/[documentId]/page.tsx`:

```typescript
import { getDocumentById } from "@/app/actions/document-actions";
import { getDocumentSignedUrl } from "@/app/actions/document-actions";
import SignatureCanvas from "@/components/signature-canvas"; // Existing component

export default async function DocumentSignPage({
  params
}: {
  params: { id: string; documentId: string };
}) {
  const { document, signatures } = await getDocumentById(params.documentId);

  if (!document) {
    return <div>문서를 찾을 수 없습니다</div>;
  }

  // Get signed URL for document
  const { signedUrl } = await getDocumentSignedUrl(params.id);

  // Render existing signature canvas component
  return (
    <div>
      <SignatureCanvas
        documentUrl={signedUrl}
        signatures={signatures}
        documentId={params.documentId}
      />
    </div>
  );
}
```

**Step 4: Verify TypeScript compiles**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add app/\(sign\)/sign/
git commit -m "refactor(sign): update sign page to use publications"
```

---

## Task 13: Add Publication Status Update Logic

**Files:**
- Modify: `app/actions/document-actions.ts` (markDocumentCompleted)

**Step 1: Update markDocumentCompleted to check publication**

Modify `markDocumentCompleted` in `document-actions.ts`:

```typescript
export async function markDocumentCompleted(documentId: string) {
  try {
    const supabase = await createServerSupabase();

    // Get document with publication info
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, status, filename, publication_id")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("❌ Document not found:", docError);
      return { error: "Document not found" };
    }

    if (document.status === "completed") {
      return { success: true };
    }

    // Mark document as completed
    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: "completed" })
      .eq("id", documentId);

    if (updateError) {
      console.error("❌ Mark completed error:", updateError);
      return { error: "Failed to mark document as completed" };
    }

    // If document is part of a publication, check if all documents are completed
    if (document.publication_id) {
      const { data: pubDocuments, error: pubDocsError } = await supabase
        .from("documents")
        .select("status")
        .eq("publication_id", document.publication_id);

      if (!pubDocsError && pubDocuments) {
        const allCompleted = pubDocuments.every(d => d.status === "completed");

        if (allCompleted) {
          // Mark publication as completed
          await supabase
            .from("publications")
            .update({ status: "completed" })
            .eq("id", document.publication_id);
        }
      }
    }

    // Send email notification
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

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add app/actions/document-actions.ts
git commit -m "feat(actions): auto-complete publication when all documents done"
```

---

## Task 14: Fix getDocumentSignedUrl to Work with Publications

**Files:**
- Modify: `app/actions/document-actions.ts` (getDocumentSignedUrl)

**Step 1: Update getDocumentSignedUrl signature**

The function signature needs to work with both legacy short_urls and new publication structure. Update to:

```typescript
/**
 * Get signed URL for document - now works via publication system
 * @param publicationShortUrl - The publication's short URL
 * @param documentId - Optional specific document ID
 */
export async function getDocumentSignedUrl(
  publicationShortUrl: string,
  password?: string,
  documentId?: string
): Promise<{
  signedUrl: string | null;
  error?: string;
}> {
  try {
    const supabaseService = createServiceSupabase();
    const supabase = await createServerSupabase();

    // Get publication first
    const { data: publication, error: pubError } = await supabase
      .from("publications")
      .select("id, password, status, expires_at")
      .eq("short_url", publicationShortUrl)
      .single();

    if (pubError || !publication) {
      return { signedUrl: null, error: "Publication not found" };
    }

    // Check expiration
    if (publication.expires_at && new Date(publication.expires_at) < new Date()) {
      return { signedUrl: null, error: "Publication expired" };
    }

    // Check completion
    if (publication.status === "completed") {
      return { signedUrl: null, error: "Publication already completed" };
    }

    // Verify password if required
    if (publication.password) {
      if (!password) {
        return { signedUrl: null, error: "Password required" };
      }
      const isValid = await bcrypt.compare(password, publication.password);
      if (!isValid) {
        return { signedUrl: null, error: "Invalid password" };
      }
    }

    // Get document
    let query = supabase
      .from("documents")
      .select("id, file_url, user_id")
      .eq("publication_id", publication.id);

    if (documentId) {
      query = query.eq("id", documentId);
    }

    const { data: documents, error: docError } = await query;

    if (docError || !documents || documents.length === 0) {
      return { signedUrl: null, error: "Document not found" };
    }

    const document = documents[0];

    // Generate signed URL using service role
    const { data, error: signError } = await supabaseService.storage
      .from("documents")
      .createSignedUrl(document.file_url, 3600);

    if (signError || !data) {
      console.error("Error creating signed URL:", signError);
      return { signedUrl: null, error: "Failed to generate signed URL" };
    }

    return { signedUrl: data.signedUrl };
  } catch (error) {
    console.error("Get document signed URL error:", error);
    return { signedUrl: null, error: "An unexpected error occurred" };
  }
}
```

**Step 2: Update call sites**

Update wherever `getDocumentSignedUrl` is called to pass the publication short URL:

In `app/(sign)/sign/[id]/document/[documentId]/page.tsx`:

```typescript
// Before:
const { signedUrl } = await getDocumentSignedUrl(params.id);

// After:
const { signedUrl } = await getDocumentSignedUrl(
  params.id, // publication shortUrl
  searchParams.password, // password if any
  params.documentId // specific document
);
```

**Step 3: Verify TypeScript compiles**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add app/actions/document-actions.ts app/\(sign\)/
git commit -m "refactor(actions): update getDocumentSignedUrl for publications"
```

---

## Task 15: Clean Up Legacy Code

**Files:**
- Delete: `components/publish-document-modal.tsx`
- Update: Any remaining imports

**Step 1: Remove publish modal component**

```bash
rm components/publish-document-modal.tsx
```

**Step 2: Search for any remaining imports**

```bash
grep -r "publish-document-modal" app/
grep -r "publishDocument" app/
grep -r "republishDocument" app/
```

Remove any remaining imports or usage.

**Step 3: Verify build**

```bash
npm run build
```

Expected: Clean build with no errors

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove legacy publish modal and unused code"
```

---

## Task 16: Test Complete Workflow

**Manual Testing Steps:**

**Step 1: Test document upload**

```bash
npm run dev
```

1. Go to `/upload`
2. Upload a document
3. Define signature areas
4. Verify document is in "draft" status

**Step 2: Test publication creation**

1. Go to `/publish`
2. Fill in name, password, expiration
3. Select 2-3 documents
4. Click "발행하기"
5. Verify success message with short URL

**Step 3: Test signing workflow**

1. Copy the short URL from step 2
2. Open in incognito: `/sign/{shortUrl}`
3. Enter password
4. Verify all documents are listed
5. Click "서명하기" on first document
6. Complete signature
7. Return to list, verify status updated
8. Complete all documents
9. Verify publication marked as completed

**Step 4: Test dashboard**

1. Go to `/dashboard`
2. Verify published documents show publication info
3. Verify draft documents don't have publication info

**Step 5: Commit test results**

If all tests pass:

```bash
git add -A
git commit -m "test: verify complete publication workflow"
```

---

## Task 17: Update Subscription Check Integration

**Files:**
- Modify: `app/actions/publication-actions.ts` (createPublication)

**Step 1: Add subscription limit check to createPublication**

Update the TODO in `createPublication`:

```typescript
// Before:
// TODO: Check subscription limits
// This will be implemented when subscription-actions.ts is updated

// After:
import { canCreatePublication } from "./subscription-actions";

// In createPublication, after verifying documents:
const nonDraftDocs = documents.filter(d => d.status !== "draft");
if (nonDraftDocs.length > 0) {
  return { error: "Only draft documents can be published" };
}

// Check subscription limits
const { canCreate, reason, error: limitError } = await canCreatePublication(documentIds.length);
if (limitError) {
  return { error: limitError };
}
if (!canCreate) {
  return { error: reason || "Publication limit reached" };
}
```

**Step 2: Verify TypeScript compiles**

```bash
npm run build
```

**Step 3: Test with limit**

Manually test:
1. Create publications until limit reached
2. Verify error message shows

**Step 4: Commit**

```bash
git add app/actions/publication-actions.ts
git commit -m "feat(subscription): integrate publication limits into workflow"
```

---

## Task 18: Add Publication Management UI to Dashboard

**Files:**
- Modify: `app/(document)/dashboard/page.tsx`
- Create: `app/(document)/dashboard/components/publications-list.tsx`

**Step 1: Create publications list component**

Create `app/(document)/dashboard/components/publications-list.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, ExternalLink } from "lucide-react";
import type { ClientPublication } from "@/lib/supabase/database.types";
import { deletePublication } from "@/app/actions/publication-actions";
import { useRouter } from "next/navigation";

export default function PublicationsList({
  publications
}: {
  publications: ClientPublication[];
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const copyShortUrl = (shortUrl: string) => {
    const fullUrl = `${window.location.origin}/sign/${shortUrl}`;
    navigator.clipboard.writeText(fullUrl);
    alert("URL이 복사되었습니다!");
  };

  const handleDelete = async (publicationId: string) => {
    if (!confirm("발행을 삭제하시겠습니까? 연결된 문서는 다시 draft 상태가 됩니다.")) {
      return;
    }

    setDeletingId(publicationId);

    const result = await deletePublication(publicationId);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }

    setDeletingId(null);
  };

  if (publications.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        발행된 문서가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {publications.map((pub) => (
        <div
          key={pub.id}
          className="border rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <h3 className="font-medium">{pub.name}</h3>
            <div className="flex gap-4 mt-1 text-sm text-gray-500">
              <span>{pub.documentCount}개 문서</span>
              <span>
                {pub.expires_at
                  ? `만료: ${new Date(pub.expires_at).toLocaleDateString()}`
                  : "만료 없음"}
              </span>
              <span className="capitalize">{pub.status}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyShortUrl(pub.short_url)}
            >
              <Copy className="h-4 w-4" />
            </Button>

            <Button size="sm" variant="outline" asChild>
              <Link
                href={`/sign/${pub.short_url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDelete(pub.id)}
              disabled={deletingId === pub.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Add publications section to dashboard**

Update `app/(document)/dashboard/page.tsx`:

```typescript
import { getUserPublications } from "@/app/actions/publication-actions";
import PublicationsList from "./components/publications-list";

export default async function DashboardPage() {
  // Existing code...
  const { documents } = await getUserDocuments();

  // Add this:
  const { publications } = await getUserPublications();

  return (
    <div>
      {/* Existing documents UI... */}

      {/* Add publications section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">발행 관리</h2>
        <PublicationsList publications={publications} />
      </div>
    </div>
  );
}
```

**Step 3: Verify it works**

```bash
npm run dev
```

Navigate to dashboard and verify publications list appears.

**Step 4: Commit**

```bash
git add app/\(document\)/dashboard/
git commit -m "feat(ui): add publications management to dashboard"
```

---

## Task 19: Final Build and Validation

**Files:**
- All files

**Step 1: Run full build**

```bash
npm run build
```

Expected: Clean build with no errors

**Step 2: Run linter**

```bash
npm run lint
```

Fix any linting issues if they appear.

**Step 3: Manual smoke test**

1. Start dev server: `npm run dev`
2. Test complete workflow end-to-end
3. Test edge cases (expired, wrong password, etc.)

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final build validation and cleanup"
```

---

## Task 20: Merge to Main

**Files:**
- Git worktree

**Step 1: Push branch**

```bash
git push origin feature/publication-system
```

**Step 2: Create pull request**

Via GitHub UI or `gh` CLI:

```bash
gh pr create --title "Feature: Publication System" --body "Implements N:1 publication system. See docs/plans/2025-10-15-publication-system.md for details."
```

**Step 3: Review and merge**

After code review and approval, merge to main.

**Step 4: Clean up worktree**

```bash
cd ../../  # Back to main repo
git worktree remove .worktrees/feature-publication-system
```

---

## Success Criteria

✅ Publications table created with proper RLS
✅ Documents table updated (removed short_url, password, expires_at)
✅ Publication CRUD operations working
✅ Subscription limits enforced for publications
✅ Publish page allows multi-document selection
✅ Sign page shows document list from publication
✅ Individual document signing works
✅ Publication auto-completes when all docs signed
✅ Dashboard shows publications management
✅ Clean build with no TypeScript errors
✅ Manual testing passes all workflows

---

## Rollback Plan

If issues arise:

1. Database rollback:
   ```sql
   -- Revert documents table
   ALTER TABLE documents
     ADD COLUMN short_url VARCHAR(50),
     ADD COLUMN password TEXT,
     ADD COLUMN expires_at TIMESTAMPTZ,
     DROP COLUMN publication_id;

   -- Drop publications table
   DROP TABLE publications CASCADE;
   ```

2. Git rollback:
   ```bash
   git revert <commit-hash>
   ```

3. Redeploy previous version
