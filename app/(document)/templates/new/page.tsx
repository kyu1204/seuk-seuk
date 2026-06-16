import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { canUseTemplate } from "@/app/actions/template-actions";
import { NewTemplatePageContent } from "./components/NewTemplatePageContent";

export default async function NewTemplatePage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const gate = await canUseTemplate();

  return (
    <NewTemplatePageContent
      allowed={gate.canUse}
      error={gate.reason === "error" ? gate.error : undefined}
    />
  );
}
