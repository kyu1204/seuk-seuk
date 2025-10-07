"use client";

import { useEffect, useState } from "react";
import type { Transaction } from "@paddle/paddle-node-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { parseMoney } from "@/lib/paddle/parse-money";
import { Status } from "@/components/bills/status";
import { formatDateByLang } from "@/lib/date/format";
import { getTransactions } from "@/lib/paddle/get-transactions";

export function PreviousPayments() {
  const { t, language } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await getTransactions("", "");
      setTransactions(data || []);
    }
    load();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("bills.pastPayments")}</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            {t("bills.noTransactions")}
          </div>
        ) : (
          (() => {
            const tx = transactions[0];
            return (
              <div className="flex justify-between items-center py-2">
                <div>
                  <div className="font-medium">
                    {tx.billedAt
                      ? formatDateByLang(tx.billedAt, "date", language)
                      : "-"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tx.details?.lineItems[0].product?.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {parseMoney(
                      tx.details?.totals?.total,
                      tx.currencyCode
                    )}
                  </div>
                  <Status status={tx.status} />
                </div>
              </div>
            );
          })()
        )}
      </CardContent>
    </Card>
  );
}
