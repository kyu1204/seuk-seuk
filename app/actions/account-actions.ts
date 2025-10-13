"use server";

import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Types
export type UserProfile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

type DeleteAccountResult = {
  success: boolean;
  error?: string;
};

/**
 * Get current user's profile information
 */
export async function getUserProfile(): Promise<{
  user: any | null;
  profile: UserProfile | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        profile: null,
        error: "User not authenticated",
      };
    }

    // Get user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, name, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Get user profile error:", profileError);
      return {
        user,
        profile: null,
        error: "Failed to get user profile",
      };
    }

    return {
      user,
      profile: profile as UserProfile,
    };
  } catch (error) {
    console.error("Get user profile error:", error);
    return {
      user: null,
      profile: null,
      error: "An unexpected error occurred",
    };
  }
}

export async function deleteAccount(
  formData: FormData
): Promise<DeleteAccountResult> {
  const supabase = await createServerSupabase();
  const serviceSupabase = createServiceSupabase();

  try {
    // 1. Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "인증되지 않은 사용자입니다.",
      };
    }

    // 2. Verify email confirmation
    const confirmEmail = formData.get("email") as string;
    if (confirmEmail !== user.email) {
      return {
        success: false,
        error: "이메일 주소가 일치하지 않습니다.",
      };
    }

    console.log(`[Account Deletion] Starting deletion for user: ${user.id}`);

    // 3. Query user's documents to get file paths
    const { data: documents, error: docQueryError } = await supabase
      .from("documents")
      .select("id, file_url, signed_file_url")
      .eq("user_id", user.id);

    if (docQueryError) {
      console.error("[Account Deletion] Error querying documents:", docQueryError);
      // Continue with deletion even if query fails
    }

    // 4. Delete files from Storage buckets
    if (documents && documents.length > 0) {
      const filePaths: string[] = [];
      const signedFilePaths: string[] = [];

      const documentIds: string[] = [];

      documents.forEach((doc) => {
        if (doc.id) {
          documentIds.push(doc.id);
        }
        if (doc.file_url) {
          // Extract path from URL
          const urlParts = doc.file_url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          filePaths.push(fileName);
        }
        if (doc.signed_file_url) {
          const urlParts = doc.signed_file_url.split("/");
          const fileName = urlParts[urlParts.length - 1];
          signedFilePaths.push(fileName);
        }
      });

      // Delete from documents bucket
      if (filePaths.length > 0) {
        const { error: storageError } = await serviceSupabase.storage
          .from("documents")
          .remove(filePaths);

        if (storageError) {
          console.error("[Account Deletion] Error deleting from documents storage:", storageError);
          // Continue with deletion
        } else {
          console.log(`[Account Deletion] Deleted ${filePaths.length} files from documents storage`);
        }
      }

      // Delete from signed-documents bucket
      if (signedFilePaths.length > 0) {
        const { error: signedStorageError } = await serviceSupabase.storage
          .from("signed-documents")
          .remove(signedFilePaths);

        if (signedStorageError) {
          console.error("[Account Deletion] Error deleting from signed-documents storage:", signedStorageError);
          // Continue with deletion
        } else {
          console.log(`[Account Deletion] Deleted ${signedFilePaths.length} files from signed-documents storage`);
        }
      }

      // Delete signatures tied to the user's documents (using service role)
      if (documentIds.length > 0) {
        const { error: signaturesError } = await serviceSupabase
          .from("signatures")
          .delete()
          .in("document_id", documentIds);

        if (signaturesError) {
          console.error("[Account Deletion] Error deleting signatures:", signaturesError);
          // Continue with deletion
        } else {
          console.log("[Account Deletion] Deleted signatures");
        }
      }
    }

    // 5. Delete documents (using service role to bypass RLS)
    const { error: documentsError } = await serviceSupabase
      .from("documents")
      .delete()
      .eq("user_id", user.id);

    if (documentsError) {
      console.error("[Account Deletion] Error deleting documents:", documentsError);
      // Continue with deletion
    } else {
      console.log("[Account Deletion] Deleted documents");
    }

    // 6. Break circular reference: Set users.current_subscription_id to NULL (using service role)
    const { error: updateUserError } = await serviceSupabase
      .from("users")
      .update({ current_subscription_id: null })
      .eq("id", user.id);

    if (updateUserError) {
      console.error("[Account Deletion] Error updating users.current_subscription_id:", updateUserError);
      // Continue with deletion
    } else {
      console.log("[Account Deletion] Cleared users.current_subscription_id");
    }

    // 7. Delete subscriptions (using service role to bypass RLS)
    const { error: subscriptionsError } = await serviceSupabase
      .from("subscriptions")
      .delete()
      .eq("user_id", user.id);

    if (subscriptionsError) {
      console.error("[Account Deletion] Error deleting subscriptions:", subscriptionsError);
      // Continue with deletion
    } else {
      console.log("[Account Deletion] Deleted subscriptions");
    }

    // 8. Delete monthly_usage (using service role to bypass RLS)
    const { error: usageError } = await serviceSupabase
      .from("monthly_usage")
      .delete()
      .eq("user_id", user.id);

    if (usageError) {
      console.error("[Account Deletion] Error deleting monthly_usage:", usageError);
      // Continue with deletion
    } else {
      console.log("[Account Deletion] Deleted monthly_usage");
    }

    // 9. Delete customers record (using service role to bypass RLS)
    const { error: customersError } = await serviceSupabase
      .from("customers")
      .delete()
      .eq("user_id", user.id);

    if (customersError) {
      console.error("[Account Deletion] Error deleting customers:", customersError);
      // Continue with deletion
    } else {
      console.log("[Account Deletion] Deleted customers");
    }

    // 10. Delete users profile (using service role to bypass RLS)
    const { error: usersError } = await serviceSupabase
      .from("users")
      .delete()
      .eq("id", user.id);

    if (usersError) {
      console.error("[Account Deletion] Error deleting users profile:", usersError);
      // Continue with deletion
    } else {
      console.log("[Account Deletion] Deleted users profile");
    }

    // 11. Delete auth.users account (using service role)
    // This will cascade delete auth schema tables (sessions, identities, etc.)
    const { error: authDeleteError } = await serviceSupabase.auth.admin.deleteUser(
      user.id
    );

    if (authDeleteError) {
      console.error("[Account Deletion] Error deleting auth user:", authDeleteError);
      return {
        success: false,
        error: "계정 삭제 중 오류가 발생했습니다.",
      };
    }

    console.log("[Account Deletion] Successfully deleted auth user");

    // 12. Sign out the user
    await supabase.auth.signOut();

    console.log("[Account Deletion] Deletion completed successfully");

    // 13. Revalidate
    revalidatePath("/");

  } catch (error) {
    console.error("[Account Deletion] Unexpected error:", error);
    return {
      success: false,
      error: "계정 삭제 중 예기치 않은 오류가 발생했습니다.",
    };
  }

  return {
    success: true,
  };
}
