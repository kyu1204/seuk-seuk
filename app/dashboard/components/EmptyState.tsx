"use client"

import { FileText, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"
import { DocumentFilter } from "../types/dashboard"

interface ActionProps {
  label: string;
  onClick?: () => void;
  showIcon: boolean;
}

interface EmptyStateProps {
  filter: DocumentFilter
  searchQuery: string
  onCreateNew?: () => void
  onClearFilters?: () => void
}

export default function EmptyState({ 
  filter, 
  searchQuery, 
  onCreateNew,
  onClearFilters 
}: EmptyStateProps) {
  const { t } = useLanguage()

  const getEmptyStateContent = () => {
    if (searchQuery) {
      return {
        icon: Search,
        title: t("dashboard.noSearchResults"),
        description: t("dashboard.noSearchResultsDescription", { query: searchQuery }),
        action: {
          label: t("dashboard.clearSearch"),
          onClick: onClearFilters,
          showIcon: false
        }
      }
    }

    switch (filter) {
      case 'draft':
        return {
          icon: FileText,
          title: t("dashboard.noDraftDocuments"),
          description: t("dashboard.noDraftDocumentsDescription"),
          action: {
            label: t("dashboard.createNewDocument"),
            onClick: onCreateNew,
            showIcon: true
          }
        }
      case 'published':
        return {
          icon: FileText,
          title: t("dashboard.noPublishedDocuments"),
          description: t("dashboard.noPublishedDocumentsDescription")
        }
      case 'completed':
        return {
          icon: FileText,
          title: t("dashboard.noCompletedDocuments"),
          description: t("dashboard.noCompletedDocumentsDescription")
        }
      case 'expired':
        return {
          icon: FileText,
          title: t("dashboard.noExpiredDocuments"),
          description: t("dashboard.noExpiredDocumentsDescription")
        }
      default:
        return {
          icon: FileText,
          title: t("dashboard.noDocuments"),
          description: t("dashboard.noDocumentsDescription"),
          action: {
            label: t("dashboard.createFirstDocument"),
            onClick: onCreateNew,
            showIcon: true
          }
        }
    }
  }

  const { icon: Icon, title, description, action } = getEmptyStateContent()

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          {title}
        </h3>
        
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
        
        {action && (
          <Button 
            onClick={action.onClick}
            className="mt-6 gap-2"
          >
            {action.showIcon && <Plus className="h-4 w-4" />}
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}