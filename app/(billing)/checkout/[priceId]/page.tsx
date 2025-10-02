import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { createServerSupabase } from "@/lib/supabase/server";
import "../../../styles/checkout.css";
import { CheckoutContents } from "./components/CheckoutContents";

export default async function CheckoutPage() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-white">
      <div className="mx-auto max-w-6xl relative px-[16px] md:px-[32px] py-[24px] flex flex-col gap-6 justify-between">
        <CheckoutHeader />
        <CheckoutContents userEmail={data.user?.email} />
      </div>
    </div>
  );
}
