import { Skeleton } from "@/components/ui/skeleton";
import { DocumentCardsSkeletonGrid } from "@/components/dashboard/document-card-skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Status Filter Skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      <DocumentCardsSkeletonGrid />
    </div>
  );
}