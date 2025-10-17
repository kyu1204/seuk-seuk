import { getPublicationByShortUrl } from "@/app/actions/publication-actions";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PublicationDetailContent } from "@/components/publication/publication-detail-content";

// Disable caching for this page to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PublicationDetailPageProps {
  params: {
    shortUrl: string;
  };
}

export default async function PublicationDetailPage({
  params,
}: PublicationDetailPageProps) {
  // Get current user
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch publication data
  const result = await getPublicationByShortUrl(params.shortUrl);

  if (result.error || !result.publication) {
    redirect("/dashboard");
  }

  // Verify user owns this publication
  if (result.publication.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PublicationDetailContent
        publication={result.publication}
        shortUrl={params.shortUrl}
      />
    </div>
  );
}
