"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initializePaddle, Paddle, Environments } from "@paddle/paddle-js";
import { PADDLE_CREDIT_PRICE_ID } from "@/lib/paddle/pricing-config";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreditCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quantity = parseInt(searchParams.get("quantity") || "5");
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
      }).then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      });
    }
  }, []);

  const handleCheckout = () => {
    if (!paddle) return;

    paddle.Checkout.open({
      items: [
        {
          priceId: PADDLE_CREDIT_PRICE_ID,
          quantity,
        },
      ],
      customData: {
        type: "credit",
        quantity: quantity.toString(),
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>

        <div className="bg-card border rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">크레딧 충전</h1>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">수량</span>
              <span className="font-medium">{quantity} 크레딧</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">단가</span>
              <span className="font-medium">$0.50</span>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <span className="font-bold">총 금액</span>
              <span className="font-bold text-lg">${(quantity * 0.5).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-muted p-3 rounded mb-6">
            <p className="text-sm text-muted-foreground">
              받게 될 크레딧: 문서 생성 {quantity}개 + 문서 발행 {quantity}개
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={!paddle}
          >
            {paddle ? "결제하기" : "로딩 중..."}
          </Button>
        </div>
      </div>
    </div>
  );
}
