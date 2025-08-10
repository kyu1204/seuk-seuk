"use client"

import { useState } from "react"
import { Search, SortAsc, SortDesc, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useLanguage } from "@/contexts/language-context"
import { DocumentFilter, DocumentCounts, SortOptions, SortField, SortOrder } from "../types/dashboard"

interface DocumentFiltersProps {
  currentFilter: DocumentFilter
  counts: DocumentCounts
  searchQuery: string
  sortOptions: SortOptions
  onFilterChange: (filter: DocumentFilter) => void
  onSearchChange: (query: string) => void
  onSortChange: (sortOptions: SortOptions) => void
}

export default function DocumentFilters({
  currentFilter,
  counts,
  searchQuery,
  sortOptions,
  onFilterChange,
  onSearchChange,
  onSortChange
}: DocumentFiltersProps) {
  const { t } = useLanguage()
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearchChange(localSearchQuery)
  }

  const handleSortFieldChange = (field: SortField) => {
    onSortChange({ ...sortOptions, field })
  }

  const handleSortOrderToggle = () => {
    const newOrder: SortOrder = sortOptions.order === 'asc' ? 'desc' : 'asc'
    onSortChange({ ...sortOptions, order: newOrder })
  }

  const getSortLabel = (field: SortField) => {
    const labels: Record<SortField, string> = {
      created_at: t("dashboard.sort.createdAt"),
      updated_at: t("dashboard.sort.updatedAt"), 
      title: t("dashboard.sort.title"),
      status: t("dashboard.sort.status")
    }
    return labels[field]
  }

  const getFilterLabel = (filter: DocumentFilter) => {
    const labels: Record<DocumentFilter, string> = {
      all: t("dashboard.filters.all"),
      draft: t("dashboard.filters.draft"),
      published: t("dashboard.filters.published"),
      completed: t("dashboard.filters.completed"),
      expired: t("dashboard.filters.expired")
    }
    return labels[filter]
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("dashboard.searchPlaceholder")}
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="pl-9"
          />
        </form>
        
        {/* Sort Controls */}
        <Select value={sortOptions.field} onValueChange={handleSortFieldChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">
              {getSortLabel('created_at')}
            </SelectItem>
            <SelectItem value="updated_at">
              {getSortLabel('updated_at')}
            </SelectItem>
            <SelectItem value="title">
              {getSortLabel('title')}
            </SelectItem>
            <SelectItem value="status">
              {getSortLabel('status')}
            </SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleSortOrderToggle}
          title={sortOptions.order === 'asc' ? t("dashboard.sort.ascending") : t("dashboard.sort.descending")}
        >
          {sortOptions.order === 'asc' ? (
            <SortAsc className="h-4 w-4" />
          ) : (
            <SortDesc className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={currentFilter} onValueChange={onFilterChange} className="w-auto">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 overflow-x-auto">
            <TabsTrigger value="all" className="text-xs">
              {getFilterLabel('all')}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] h-4">
                {counts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-xs">
              {getFilterLabel('draft')}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] h-4">
                {counts.draft}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs">
              {getFilterLabel('published')}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] h-4">
                {counts.published}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              {getFilterLabel('completed')}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] h-4">
                {counts.completed}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs">
              {getFilterLabel('expired')}
              <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5 min-w-[20px] h-4">
                {counts.expired}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Active Filters */}
        {(searchQuery || currentFilter !== 'all') && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {t("dashboard.activeFilters")}:
            </span>
            {searchQuery && (
              <Badge variant="outline" className="text-xs">
                {t("dashboard.search")}: "{searchQuery}"
                <button
                  onClick={() => {
                    setLocalSearchQuery('')
                    onSearchChange('')
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {currentFilter !== 'all' && (
              <Badge variant="outline" className="text-xs">
                {getFilterLabel(currentFilter)}
                <button
                  onClick={() => onFilterChange('all')}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  )
}