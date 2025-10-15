"use client";

import { ProjectBreadcrumb } from "@/components/breadcrumb";
import PublishForm from "@/components/publish/publish-form";
import type { Document } from "@/lib/supabase/database.types";

interface PublishPageContentProps {
  documents: Document[];
}

export default function PublishPageContent({ documents }: PublishPageContentProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        <h1 className="text-2xl font-bold mb-6">문서 발행</h1>
        <PublishForm documents={documents} />
      </div>
    </div>
  );
}
