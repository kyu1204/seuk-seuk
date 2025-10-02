import { Paddle, PricePreviewParams, PricePreviewResponse } from "@paddle/paddle-js";
import { useEffect, useState } from "react";
import { PADDLE_PRICE_TIERS } from "@/lib/paddle/pricing-config";

export type PaddlePrices = Record<string, string>;

// Paddle Price ID 패턴: pri_[a-z\d]{26}
const PADDLE_PRICE_ID_PATTERN = /^pri_[a-z\d]{26}$/;

function isValidPaddlePriceId(priceId: string): boolean {
  return PADDLE_PRICE_ID_PATTERN.test(priceId);
}

function getLineItems(): PricePreviewParams["items"] {
  const priceIds = PADDLE_PRICE_TIERS
    .flatMap((tier) => [tier.priceId.month, tier.priceId.year])
    .filter(isValidPaddlePriceId); // 유효한 Paddle Price ID만 필터링

  console.log('[usePaddlePrices] Valid Paddle Price IDs:', priceIds);

  return priceIds.map((priceId) => ({ priceId, quantity: 1 }));
}

function getPriceAmounts(prices: PricePreviewResponse) {
  return prices.data.details.lineItems.reduce((acc, item) => {
    acc[item.price.id] = item.formattedTotals.total;
    return acc;
  }, {} as PaddlePrices);
}

export function usePaddlePrices(
  paddle: Paddle | undefined,
  country: string = "US"
): { prices: PaddlePrices; loading: boolean; error: string | null } {
  const [prices, setPrices] = useState<PaddlePrices>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!paddle) {
      setLoading(false);
      return;
    }

    const paddlePricePreviewRequest: Partial<PricePreviewParams> = {
      items: getLineItems(),
      ...(country !== "OTHERS" && { address: { countryCode: country } }),
    };

    setLoading(true);
    setError(null);

    paddle
      ?.PricePreview(paddlePricePreviewRequest as PricePreviewParams)
      .then((pricesData) => {
        setPrices((prevState) => ({ ...prevState, ...getPriceAmounts(pricesData) }));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch Paddle prices:", err);
        setError("Failed to load pricing information");
        setLoading(false);
      });
  }, [country, paddle]);

  return { prices, loading, error };
}
