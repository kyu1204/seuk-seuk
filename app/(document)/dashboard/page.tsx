import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProjectBreadcrumb } from "@/components/breadcrumb";

// Disable caching for this page to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        {/* Fixed Header - Server Component */}
        <DashboardHeader />

        {/* Dynamic Content - Client Component */}
        <DashboardContent />
      </div>
    </div>
  );
}
