"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@paddle/paddle-node-sdk";
import { parseMoney } from "@/lib/paddle/parse-money";
import { Status } from "@/components/bills/status";
import { useLanguage } from "@/contexts/language-context";
import { formatDateByLang } from "@/lib/date/format";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getInvoicePdf } from "@/lib/paddle/get-invoice-pdf";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function T({ k }: { k: string }) {
  const { t } = useLanguage();
  return <>{t(k)}</>;
}

function PaymentReason({ origin }: { origin: string }) {
  const { t } = useLanguage();
  const reason =
    origin === "web" || origin === "subscription_charge"
      ? t("bills.payment.reason.new")
      : t("bills.payment.reason.renewalOf");
  return <>{reason}</>;
}

function MoreCount({ count }: { count: number }) {
  const { t } = useLanguage();
  return <>{t("table.moreCount", { count })}</>;
}

const columnSize = "auto" as unknown as number;

export const paymentsColumns: ColumnDef<Transaction>[] = [
  {
    accessorKey: "billedAt",
    header: () => <T k="table.date" />,
    size: columnSize,
    cell: ({ row }) => {
      const billedDate = row.getValue("billedAt") as string;
      return billedDate ? <DateCell value={billedDate} /> : "-";
    },
  },
  {
    accessorKey: "amount",
    header: () => (
      <div className="text-right font-medium">
        <T k="table.amount" />
      </div>
    ),
    enableResizing: false,
    size: columnSize,
    cell: ({ row }) => {
      const formatted = parseMoney(
        row.original.details?.totals?.total,
        row.original.currencyCode
      );
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "status",
    header: () => <T k="table.status" />,
    size: columnSize,
    cell: ({ row }) => {
      return <Status status={row.original.status} />;
    },
  },
  {
    accessorKey: "description",
    header: () => <T k="table.description" />,
    size: columnSize,
    cell: ({ row }) => {
      return (
        <div className="max-w-[250px]">
          <div className="whitespace-nowrap flex gap-1 truncate">
            <span className="font-semibold">
              <PaymentReason origin={row.original.origin} />
            </span>
            <span className="font-medium truncate">
              {row.original.details?.lineItems[0].product?.name}
            </span>
            {row.original.details?.lineItems &&
              row.original.details?.lineItems.length > 1 && (
                <span className="font-medium">
                  <MoreCount
                    count={row.original.details?.lineItems.length - 1}
                  />
                </span>
              )}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right"><T k="table.actions" /></div>,
    size: columnSize,
    cell: ({ row }) => {
      return (
        <div className="text-right">
          <DownloadInvoiceButton transaction={row.original} />
        </div>
      );
    },
  },
];

function DateCell({ value }: { value: string }) {
  const { language } = useLanguage();
  return <>{formatDateByLang(value, "datetime", language)}</>;
}

function DownloadInvoiceButton({ transaction }: { transaction: Transaction }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const canDownloadInvoice =
    transaction.status === "billed" ||
    transaction.status === "completed" ||
    transaction.status === "paid";

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const { url, error } = await getInvoicePdf(transaction.id);

      if (error || !url) {
        toast({
          title: t("bills.error.downloadInvoice") || "Error",
          description: error || "Failed to download invoice",
          variant: "destructive",
        });
        return;
      }

      window.open(url, "_blank");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: t("bills.error.downloadInvoice") || "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (!canDownloadInvoice) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDownloadInvoice}
      disabled={downloading}
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
