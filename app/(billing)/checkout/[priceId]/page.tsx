import { CheckoutHeader } from "@/components/checkout/checkout-header";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateAndGetPriceId } from "@/lib/paddle/validate-price-id";
import "../../../styles/checkout.css";
import { CheckoutContents } from "./components/CheckoutContents";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ priceId: string }>;
}) {
  const { priceId } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();

  // 서버 측에서 무료체험 이력 확인 및 priceId 검증/교체
  const validatedPriceId = await validateAndGetPriceId(
    priceId,
    data.user?.email
  );

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-white">
      <div className="mx-auto max-w-6xl relative px-[16px] md:px-[32px] py-[24px] flex flex-col gap-6 justify-between">
        <CheckoutHeader />
        <CheckoutContents
          userEmail={data.user?.email}
          validatedPriceId={validatedPriceId}
        />
      </div>
    </div>
  );
}
