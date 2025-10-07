import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function CheckoutHeader() {
  return (
    <div>
      <Link href={"/pricing"} className="inline-block">
        <Button
          variant={"secondary"}
          className={
            "h-[32px] border-border px-3 rounded-[4px] flex items-center gap-2 bg-white"
          }
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">요금제 페이지로 돌아가기</span>
        </Button>
      </Link>
    </div>
  );
}
