"use client"

import { useLanguage } from "@/contexts/language-context"
import { DocumentWithStats, DocumentAction } from "../types/dashboard"
import DocumentCard from "./DocumentCard"
import EmptyState from "./EmptyState"
import { Skeleton } from "@/components/ui/skeleton"

interface DocumentListProps {
  documents: DocumentWithStats[]
  loading: boolean
  filter: string
  searchQuery: string
  onDocumentAction: (action: DocumentAction, documentId: string) => void
  onCreateNew?: () => void
  onClearFilters?: () => void
}

function DocumentCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-3 w-32" />
      </div>
      
      <div className="space-y-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-36" />
      </div>
      
      <div className="flex gap-1">
        <Skeleton className="h-7 flex-1 rounded-md" />
        <Skeleton className="h-7 flex-1 rounded-md" />
      </div>
    </div>
  )
}

export default function DocumentList({
  documents,
  loading,
  filter,
  searchQuery,
  onDocumentAction,
  onCreateNew,
  onClearFilters
}: DocumentListProps) {
  const { t } = useLanguage()

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <DocumentCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        filter={filter as any}
        searchQuery={searchQuery}
        onCreateNew={onCreateNew}
        onClearFilters={onClearFilters}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {searchQuery ? (
            t("dashboard.searchResultsCount", { 
              count: documents.length, 
              query: searchQuery 
            })
          ) : (
            t("dashboard.documentsCount", { count: documents.length })
          )}
        </p>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <DocumentCard
            key={document.id}
            document={document}
            onAction={onDocumentAction}
          />
        ))}
      </div>
    </div>
  )
}