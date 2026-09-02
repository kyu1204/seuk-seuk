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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("bills.title")}</h1>
        <p className="text-muted-foreground">{t("bills.description")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
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
          <Card>
            <CardHeader className="sr-only">
              <CardTitle>{t("bills.subscriptions")}</CardTitle>
              <CardDescription>{t("bills.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <Card>
            <CardHeader className="sr-only">
              <CardTitle>{t("bills.payments")}</CardTitle>
              <CardDescription>{t("bills.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
