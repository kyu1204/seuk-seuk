import { Tables } from "@/lib/database-types"

// Base types from database
export type Document = Tables<'documents'>
export type Signature = Tables<'signatures'>
export type SignatureArea = Tables<'signature_areas'>
export type DocumentShare = Tables<'document_shares'>

// Document status type
export type DocumentStatus = 'draft' | 'published' | 'completed' | 'expired'

// Filter types
export type DocumentFilter = DocumentStatus | 'all'

// Document actions
export type DocumentAction = 'edit' | 'delete' | 'share' | 'view' | 'download'

// Extended document type with statistics
export interface DocumentWithStats extends Document {
  signatureStats: {
    total: number;        // 총 서명 영역 수
    completed: number;    // 완료된 서명 수
    pending: number;      // 대기 중인 서명 수
    progress: number;     // 진행률 (0-100)
  };
  shareInfo?: {
    hasActiveShare: boolean;  // 활성 공유 링크 여부
    shareCount: number;       // 총 공유 수
    lastAccessed?: Date;      // 마지막 접근 시간
  };
  // Related data loaded from joins
  signature_areas: SignatureArea[];
  signatures: Signature[];
  document_shares: DocumentShare[];
}

// Document counts for filters
export interface DocumentCounts {
  all: number;
  draft: number;
  published: number;
  completed: number;
  expired: number;
}

// Sort options
export type SortField = 'created_at' | 'updated_at' | 'title' | 'status'
export type SortOrder = 'asc' | 'desc'

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}

// Search and filter state
export interface DocumentListState {
  documents: DocumentWithStats[];
  loading: boolean;
  error?: string;
  filter: DocumentFilter;
  searchQuery: string;
  sortOptions: SortOptions;
  counts: DocumentCounts;
}

// Component props interfaces
export interface DocumentListProps {
  documents: DocumentWithStats[];
  loading: boolean;
  filter: DocumentFilter;
  searchQuery: string;
  sortOptions: SortOptions;
  counts: DocumentCounts;
  onFilterChange: (filter: DocumentFilter) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sortOptions: SortOptions) => void;
  onDocumentAction: (action: DocumentAction, documentId: string) => void;
}

export interface DocumentCardProps {
  document: DocumentWithStats;
  onAction: (action: DocumentAction, documentId: string) => void;
}

export interface DocumentFiltersProps {
  currentFilter: DocumentFilter;
  counts: DocumentCounts;
  searchQuery: string;
  sortOptions: SortOptions;
  onFilterChange: (filter: DocumentFilter) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sortOptions: SortOptions) => void;
}

export interface EmptyStateProps {
  filter: DocumentFilter;
  searchQuery: string;
  onCreateNew?: () => void;
  onClearFilters?: () => void;
}

// Action result types
export interface DocumentActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}