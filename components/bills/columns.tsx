"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { Document } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";

// Column size is set as 'auto' as React table column sizing is not working well.
const columnSize = "auto" as unknown as number;

export const columns: ColumnDef<Document>[] = [
  {
    accessorKey: "created_at",
    header: "Date",
    size: columnSize,
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
  },
  {
    accessorKey: "filename",
    header: "Document",
    size: columnSize,
    cell: ({ row }) => {
      const filename = row.getValue("filename") as string;
      const truncate = (str: string, max: number = 40) => {
        return str.length > max ? str.slice(0, max) + "..." : str;
      };
      return (
        <div className="font-medium" title={filename}>
          {truncate(filename)}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    size: columnSize,
    cell: ({ row }) => {
      const status = row.getValue("status") as Document["status"];
      const statusMap = {
        draft: { label: "Draft", variant: "secondary" as const },
        published: { label: "Published", variant: "default" as const },
        completed: { label: "Completed", variant: "success" as const },
      };
      const statusInfo = statusMap[status] || statusMap.draft;
      return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    size: columnSize,
    cell: ({ row }) => {
      const document = row.original;
      return (
        <div className="text-right">
          <Link href={`/document/${document.id}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              View
            </Button>
          </Link>
        </div>
      );
    },
  },
];
