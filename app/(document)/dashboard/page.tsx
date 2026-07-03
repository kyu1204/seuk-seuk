import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectBreadcrumb } from "@/components/breadcrumb";
import { getDashboardData } from "@/app/actions/document-actions";
import { getUsageWidgetData } from "@/app/actions/subscription-actions";

// Disable caching for this page to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  // Prefetch dashboard documents/counts and usage widget data in parallel on the
  // server so the client renders immediately without a hydration waterfall.
  const [dashboardData, usageData] = await Promise.all([
    getDashboardData(1, 12),
    getUsageWidgetData(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        {/* Fixed Header - Server Component */}
        <DashboardHeader usage={usageData} />

        {/* Dynamic Content - Client Component */}
        <DashboardContent
          initialData={{
            documents: dashboardData.documents,
            hasMore: dashboardData.hasMore,
            total: dashboardData.total,
            counts: dashboardData.counts,
            error: dashboardData.error,
          }}
        />
      </div>
    </div>
  );
}
