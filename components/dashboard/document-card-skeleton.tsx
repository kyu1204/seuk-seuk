import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DocumentCardSkeleton() {
  return (
    <Card className="h-48 flex flex-col">
      <CardHeader className="pb-3 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Skeleton className="h-5 w-16 flex-shrink-0 rounded-full" />
        </div>
        <div className="flex flex-col items-center text-center space-y-3">
          <Skeleton className="h-8 w-8 flex-shrink-0 rounded" />
          <div className="space-y-1 px-2 w-full">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4 mt-auto">
        <div className="flex items-center justify-center gap-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function DocumentCardsSkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }, (_, i) => (
        <DocumentCardSkeleton key={i} />
      ))}
    </div>
  );
}