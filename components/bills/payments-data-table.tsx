"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@paddle/paddle-node-sdk";
import { useLanguage } from "@/contexts/language-context";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hasMore?: boolean;
  hasPrev: boolean;
  goToNextPage: (cursor: string) => void;
  goToPrevPage: () => void;
}

export function PaymentsDataTable<TData, TValue>({
  columns,
  data,
  hasMore,
  goToNextPage,
  goToPrevPage,
  hasPrev,
}: DataTableProps<TData, TValue>) {
  const { t } = useLanguage();
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="rounded-md border bg-background relative">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      minWidth: header.column.columnDef.size,
                      maxWidth: header.column.columnDef.size,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      minWidth: cell.column.columnDef.size,
                      maxWidth: cell.column.columnDef.size,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {t("table.noResults")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 px-6 py-4">
        <Button
          size="sm"
          variant="outline"
          className="flex gap-2 text-sm rounded-sm border-border"
          onClick={() => goToPrevPage()}
          disabled={!hasPrev}
        >
          {t("table.previous")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex gap-2 text-sm rounded-sm border-border"
          onClick={() =>
            goToNextPage((data[data.length - 1] as Transaction).id)
          }
          disabled={!hasMore}
        >
          {t("table.next")}
        </Button>
      </div>
    </div>
  );
}
