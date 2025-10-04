import { Suspense } from "react";
import { BillsContent } from "@/components/bills/bills-content";
import { LoadingScreen } from "@/components/bills/loading-screen";
import { ProjectBreadcrumb } from "@/components/breadcrumb";

export default function BillsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <ProjectBreadcrumb />
        <Suspense fallback={<LoadingScreen />}>
          <BillsContent />
        </Suspense>
      </div>
    </div>
  );
}
