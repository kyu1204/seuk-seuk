'use client';

import { CheckoutPriceAmount } from '@/components/checkout/checkout-price-amount';
import { CheckoutEventsData } from '@paddle/paddle-js/types/checkout/events';
import { formatMoney } from '@/lib/paddle/parse-money';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBillingCycle } from '@/lib/paddle/data-helpers';
import { useLanguage } from '@/contexts/language-context';

interface Props {
  checkoutData: CheckoutEventsData | null;
}

export function CheckoutPriceContainer({ checkoutData }: Props) {
  const { t, language } = useLanguage();
  const recurringTotal = checkoutData?.recurring_totals?.total;
  const billingCycle = checkoutData?.items.find((item) => item.billing_cycle)?.billing_cycle;

  const formattedPrice = formatMoney(recurringTotal, checkoutData?.currency_code);
  const formattedCycle = billingCycle ? formatBillingCycle(billingCycle, t) : '';

  return (
    <>
      <div className={'text-base leading-[20px] font-semibold'}>{t("checkout.orderSummary")}</div>
      <CheckoutPriceAmount checkoutData={checkoutData} />
      {recurringTotal !== undefined ? (
        billingCycle && (
          <div className={'pt-4 text-base leading-[20px] font-medium text-muted-foreground'}>
            {language === 'ko'
              ? `${t("checkout.then")} ${formattedCycle} ${formattedPrice}`
              : `${t("checkout.then")} ${formattedPrice} ${formattedCycle}`
            }
          </div>
        )
      ) : (
        <Skeleton className="mt-4 h-[20px] w-full bg-border" />
      )}
    </>
  );
}
