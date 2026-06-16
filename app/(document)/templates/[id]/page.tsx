import { notFound, redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTemplateById } from "@/app/actions/template-actions";
import { TemplateDetailPageContent } from "./components/TemplateDetailPageContent";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: { id: string };
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { template, error } = await getTemplateById(params.id);

  if (error || !template) {
    notFound();
  }

  return <TemplateDetailPageContent template={template} />;
}
