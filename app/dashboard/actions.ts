"use server"

import { getDocumentsWithStats } from "./queries"
import { DocumentFilter, SortOptions, DocumentWithStats, DocumentCounts } from "./types/dashboard"

export async function getDocumentsAction(
  filter: DocumentFilter = 'all',
  searchQuery?: string,
  sortOptions: SortOptions = { field: 'created_at', order: 'desc' }
): Promise<{ data: DocumentWithStats[]; counts: DocumentCounts; error?: string }> {
  try {
    const result = await getDocumentsWithStats(filter, searchQuery, sortOptions)
    return result
  } catch (error) {
    console.error('Error in getDocumentsAction:', error)
    return { 
      data: [], 
      counts: { all: 0, draft: 0, published: 0, completed: 0, expired: 0 },
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}