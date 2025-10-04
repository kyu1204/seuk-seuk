"use client";

import { useEffect, useState } from "react";
import { getTransactions } from "@/lib/paddle/get-transactions";
import type { Transaction } from "@paddle/paddle-node-sdk";
import { LoadingScreen } from "@/components/bills/loading-screen";
import { PaymentsDataTable } from "@/components/bills/payments-data-table";
import { paymentsColumns } from "@/components/bills/payments-columns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function PaymentsTab() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [after, setAfter] = useState("");

  useEffect(() => {
    fetchTransactions("");
  }, []);

  async function fetchTransactions(cursor: string) {
    try {
      setLoading(true);
      const { data, error: fetchError, hasMore: more } = await getTransactions(
        "",
        cursor
      );

      if (fetchError) {
        setError(fetchError);
      } else {
        setTransactions(data || []);
        setHasMore(more);
      }
    } catch (err) {
      console.error("Error:", err);
      setError(t("bills.error.loadTransactions"));
    } finally {
      setLoading(false);
    }
  }

  const goToNextPage = (lastId: string) => {
    setAfter(lastId);
    fetchTransactions(lastId);
  };

  const goToPrevPage = () => {
    setAfter("");
    fetchTransactions("");
  };

  if (loading && transactions.length === 0) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("bills.noTransactions")}</p>
      </div>
    );
  }

  return (
    <PaymentsDataTable
      columns={paymentsColumns}
      data={transactions}
      hasMore={hasMore}
      hasPrev={after !== ""}
      goToNextPage={goToNextPage}
      goToPrevPage={goToPrevPage}
    />
  );
}
