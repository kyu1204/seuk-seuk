'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Share2, 
  Trash2, 
  Calendar, 
  FileText, 
  Users, 
  CheckCircle,
  Clock,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/language-context';
import { deleteDocument } from '@/app/actions/document';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { LucideIcon } from 'lucide-react';
import { DocumentImage } from '@/components/ui/document-image';

// Simplified types based on your existing structure
interface DocumentDetailViewProps {
  document: {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'completed' | 'expired' | 'submitted';
    created_at: string;
    updated_at: string;
    file_path: string;
    file_name: string;
    user_id: string;
  };
  user: User;
  documentUrl?: string;
}

const statusConfig: Record<
  DocumentDetailViewProps["document"]["status"],
  { label: string; color: string; icon: LucideIcon }
> = {
  draft: {
    label: 'dashboard.status.draft',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-200',
    icon: FileText,
  },
  published: {
    label: 'dashboard.status.published', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: Clock,
  },
  completed: {
    label: 'dashboard.status.completed',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', 
    icon: CheckCircle,
  },
  expired: {
    label: 'dashboard.status.expired',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: Calendar,
  },
  submitted: {
    label: 'dashboard.status.submitted',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    icon: CheckCircle,
  },
};

export function DocumentDetailView({ document, user, documentUrl }: DocumentDetailViewProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const locale = language === 'ko' ? ko : enUS;

  const config = statusConfig[document.status];
  const StatusIcon = config.icon;

  const handleEdit = () => {
    router.push(`/dashboard?mode=edit&documentId=${document.id}`);
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Share document:', document.id);
  };

  const handleDelete = async () => {
    if (!confirm(t('dashboard.deleteDialog.title'))) return;
    
    try {
      setIsLoading(true);
      await deleteDocument(document.id);
      toast.success(t('dashboard.deleteSuccess'));
      router.push('/dashboard');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('dashboard.deleteError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download document:', document.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('dashboard.backToDashboard')}
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {document.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {document.file_name}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Badge className={cn(config.color)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {t(config.label)}
          </Badge>
        </div>
      </div>

      {/* Document Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('document.details')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('document.created')}
              </label>
              <p className="mt-1">
                {format(new Date(document.created_at), 'PPP', { locale })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('document.lastModified')}
              </label>
              <p className="mt-1">
                {format(new Date(document.updated_at), 'PPP', { locale })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('document.status')}
              </label>
              <div className="mt-1">
                <Badge className={cn(config.color)}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {t(config.label)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('document.fileName')}
              </label>
              <p className="mt-1 font-mono text-sm text-foreground">
                {document.file_name}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('document.signatureProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {t('document.signatureProgressPlaceholder')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Document Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {t('document.preview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documentUrl ? (
            <div className="flex justify-center p-4">
              <DocumentImage
                src={documentUrl}
                alt={document.title}
                variant="preview"
                className="max-h-96"
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {t('document.previewPlaceholder')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex space-x-3">
          <Button onClick={handleEdit} className="gap-2">
            <Edit className="w-4 h-4" />
            {t('dashboard.actions.edit')}
          </Button>
          
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            {t('dashboard.actions.share')}
          </Button>
          
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            {t('dashboard.actions.download')}
          </Button>
        </div>

        <Button 
          variant="destructive" 
          onClick={handleDelete} 
          className="gap-2"
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4" />
          {t('dashboard.actions.delete')}
        </Button>
      </div>
    </div>
  );
}