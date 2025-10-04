import { createServerSupabase } from "@/lib/supabase/server";

export async function getCustomerId() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const { data: customersData } = await supabase
      .from("customers")
      .select("customer_id,email")
      .eq("email", user.email)
      .single();

    if (customersData?.customer_id) {
      return customersData.customer_id as string;
    }
  }
  return "";
}
