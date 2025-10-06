"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubscriptionsTab } from "@/components/bills/subscriptions-tab";
import { PaymentsTab } from "@/components/bills/payments-tab";
import { useLanguage } from "@/contexts/language-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, ReceiptText } from "lucide-react";

export function BillsContent() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("subscriptions");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
        <div className="flex items-start gap-4">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {t("bills.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("bills.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs within a card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="sr-only">{t("bills.title")}</CardTitle>
          <CardDescription className="sr-only">{`${t("bills.subscriptions")} & ${t("bills.payments")}`}</CardDescription>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-md">
              <TabsTrigger
                value="subscriptions"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-sm"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {t("bills.subscriptions")}
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-background data-[state=active]:text-foreground rounded-sm"
              >
                <ReceiptText className="mr-2 h-4 w-4" />
                {t("bills.payments")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="mt-6">
              <CardContent className="p-0">
                <SubscriptionsTab />
              </CardContent>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <CardContent className="p-0">
                <PaymentsTab />
              </CardContent>
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
}
