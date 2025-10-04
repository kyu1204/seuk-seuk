"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Transaction } from "@paddle/paddle-node-sdk";
import { parseMoney } from "@/lib/paddle/parse-money";
import { Status } from "@/components/bills/status";
import { useLanguage } from "@/contexts/language-context";
import { formatDateByLang } from "@/lib/date/format";

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
];

function DateCell({ value }: { value: string }) {
  const { language } = useLanguage();
  return <>{formatDateByLang(value, "datetime", language)}</>;
}
