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
import { useLanguage } from '@/contexts/language-context';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

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
}

const statusConfig = {
  draft: {
    label: 'dashboard.status.draft',
    color: 'bg-gray-100 text-gray-800',
    icon: FileText,
  },
  published: {
    label: 'dashboard.status.published', 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
  },
  completed: {
    label: 'dashboard.status.completed',
    color: 'bg-green-100 text-green-800', 
    icon: CheckCircle,
  },
  expired: {
    label: 'dashboard.status.expired',
    color: 'bg-red-100 text-red-800',
    icon: Calendar,
  },
  submitted: {
    label: 'dashboard.status.submitted',
    color: 'bg-purple-100 text-purple-800',
    icon: CheckCircle,
  },
};

export function DocumentDetailView({ document, user }: DocumentDetailViewProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
    // TODO: Implement delete functionality with confirmation
    console.log('Delete document:', document.id);
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
            <h1 className="text-2xl font-bold text-gray-900">
              {document.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
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
              <label className="text-sm font-medium text-gray-500">
                {t('document.created')}
              </label>
              <p className="mt-1">
                {format(new Date(document.created_at), 'PPP')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                {t('document.lastModified')}
              </label>
              <p className="mt-1">
                {format(new Date(document.updated_at), 'PPP')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
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
              <label className="text-sm font-medium text-gray-500">
                {t('document.fileName')}
              </label>
              <p className="mt-1 font-mono text-sm">
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
            <p className="text-gray-500">
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
          <div className="text-center py-8">
            <p className="text-gray-500">
              {t('document.previewPlaceholder')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex space-x-3">
          <Button onClick={handleEdit} className="gap-2">
            <Edit className="w-4 h-4" />
            {t('dashboard.edit')}
          </Button>
          
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" />
            {t('dashboard.share')}
          </Button>
          
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            {t('document.download')}
          </Button>
        </div>

        <Button 
          variant="destructive" 
          onClick={handleDelete} 
          className="gap-2"
          disabled={isLoading}
        >
          <Trash2 className="w-4 h-4" />
          {t('dashboard.delete')}
        </Button>
      </div>
    </div>
  );
}