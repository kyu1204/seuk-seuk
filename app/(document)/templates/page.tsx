import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  canUseTemplate,
  getUserTemplates,
} from "@/app/actions/template-actions";
import TemplatesPageContent from "./components/TemplatesPageContent";

export default async function TemplatesPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { canUse } = await canUseTemplate();

  if (!canUse) {
    return <TemplatesPageContent allowed={false} templates={[]} />;
  }

  const { templates } = await getUserTemplates();

  return (
    <TemplatesPageContent allowed={true} templates={templates || []} />
  );
}
