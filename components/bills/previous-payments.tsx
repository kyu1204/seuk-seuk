"use client";

import type { Transaction } from "@paddle/paddle-node-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { parseMoney } from "@/lib/paddle/parse-money";
import { Status } from "@/components/bills/status";
import { formatDateByLang } from "@/lib/date/format";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getInvoicePdf } from "@/lib/paddle/get-invoice-pdf";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PreviousPaymentsProps {
  transactions?: Transaction[];
}

export function PreviousPayments({ transactions = [] }: PreviousPaymentsProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownloadInvoice = async (transactionId: string) => {
    setDownloading(transactionId);
    try {
      const { url, error } = await getInvoicePdf(transactionId);

      if (error || !url) {
        toast({
          title: t("bills.error.downloadInvoice") || "Error",
          description: error || "Failed to download invoice",
          variant: "destructive",
        });
        return;
      }

      // Open the PDF URL in a new tab
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: t("bills.error.downloadInvoice") || "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="space-y-4 flex flex-col">
          <h3 className="text-lg font-semibold">
            {t("bills.pastPayments")}
          </h3>
          <div>
            {transactions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {t("bills.noTransactions")}
              </div>
            ) : (
              (() => {
                const tx = transactions[0];
                const canDownloadInvoice = tx.status === "billed" || tx.status === "completed" || tx.status === "paid";

                return (
                  <div className="flex justify-between items-center py-2 gap-4">
                    <div className="flex-1">
                      <div className="font-medium">
                        {tx.billedAt
                          ? formatDateByLang(tx.billedAt, "date", language)
                          : "-"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tx.details?.lineItems[0].product?.name}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-medium">
                        {parseMoney(
                          tx.details?.totals?.total,
                          tx.currencyCode
                        )}
                      </div>
                      <Status status={tx.status} />
                    </div>
                    {canDownloadInvoice && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(tx.id)}
                        disabled={downloading === tx.id}
                        className="flex-shrink-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
