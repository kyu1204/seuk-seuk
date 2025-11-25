'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { CheckoutEventsData } from '@paddle/paddle-js/types/checkout/events';
import { formatMoney } from '@/lib/paddle/parse-money';
import { useLanguage } from '@/contexts/language-context';

interface Props {
  checkoutData: CheckoutEventsData | null;
}

export function CheckoutPriceAmount({ checkoutData }: Props) {
  const { t } = useLanguage();
  const total = checkoutData?.totals.total;
  return (
    <>
      {total !== undefined ? (
        <div className={'pt-8 flex gap-2 items-end flex-wrap'}>
          <span className={'text-3xl sm:text-4xl md:text-5xl font-bold'}>{formatMoney(total, checkoutData?.currency_code)}</span>
          <span className={'text-sm sm:text-base leading-[16px] text-muted-foreground'}>{t("checkout.incTax")}</span>
        </div>
      ) : (
        <Skeleton className="mt-8 h-[36px] sm:h-[48px] w-full bg-border" />
      )}
    </>
  );
}
