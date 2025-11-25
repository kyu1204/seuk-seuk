'use client';

import { Separator } from '@/components/ui/separator';
import { CheckoutEventsData } from '@paddle/paddle-js/types/checkout/events';
import { formatMoney } from '@/lib/paddle/parse-money';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/contexts/language-context';

interface LoadingTextProps {
  value: number | undefined;
  currencyCode: string | undefined;
}

function LoadingText({ value, currencyCode }: LoadingTextProps) {
  if (value === undefined) {
    return <Skeleton className="h-[20px] w-[75px] bg-border" />;
  } else {
    return formatMoney(value, currencyCode);
  }
}

interface Props {
  checkoutData: CheckoutEventsData | null;
  quantity: number;
  handleQuantityChange: (quantity: number) => void;
}

export function CheckoutLineItems({ handleQuantityChange, checkoutData, quantity }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className={'md:pt-12 text-sm sm:text-base leading-[20px] font-medium break-words'}>{checkoutData?.items[0].price_name}</div>
      <Separator className={'bg-border/50 mt-6'} />
      <div className={'pt-6 flex justify-between items-center gap-4'}>
        <span className={'text-sm sm:text-base leading-[20px] font-medium text-muted-foreground flex-shrink-0'}>{t("checkout.subtotal")}</span>
        <span className={'text-sm sm:text-base leading-[20px] font-semibold'}>
          <LoadingText currencyCode={checkoutData?.currency_code} value={checkoutData?.totals.subtotal} />
        </span>
      </div>
      <div className={'pt-6 flex justify-between items-center gap-4'}>
        <span className={'text-sm sm:text-base leading-[20px] font-medium text-muted-foreground flex-shrink-0'}>{t("checkout.tax")}</span>
        <span className={'text-sm sm:text-base leading-[20px] font-semibold'}>
          <LoadingText currencyCode={checkoutData?.currency_code} value={checkoutData?.totals.tax} />
        </span>
      </div>
      <Separator className={'bg-border/50 mt-6'} />
      <div className={'pt-6 flex justify-between items-center gap-4'}>
        <span className={'text-sm sm:text-base leading-[20px] font-medium text-muted-foreground flex-shrink-0'}>{t("checkout.dueToday")}</span>
        <span className={'text-sm sm:text-base leading-[20px] font-semibold'}>
          <LoadingText currencyCode={checkoutData?.currency_code} value={checkoutData?.totals.total} />
        </span>
      </div>
    </>
  );
}
