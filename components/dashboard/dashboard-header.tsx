import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { UsageWidget } from "./usage-widget";

export function DashboardHeader() {
  return (
    <div className="space-y-8 mb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            내 문서
          </h1>
          <p className="text-muted-foreground">
            문서를 관리하고 서명을 수집하세요
          </p>
        </div>
        <Link href="/upload">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            문서 업로드
          </Button>
        </Link>
      </div>

      {/* Usage Widget */}
      <div className="max-w-md">
        <UsageWidget />
      </div>
    </div>
  );
}