import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Fixed Header - Server Component */}
        <DashboardHeader />

        {/* Dynamic Content - Client Component */}
        <DashboardContent />
      </div>
    </div>
  );
}