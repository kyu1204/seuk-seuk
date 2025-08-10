import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/app/auth/queries';
import { getDocumentById } from '@/app/dashboard/queries';
import { DocumentDetailView } from './DocumentDetailView';

interface DocumentDetailPageProps {
  params: {
    id: string;
  };
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const user = await getCurrentUser();
  
  if (!user) {
    notFound();
  }

  const document = await getDocumentById(params.id);

  if (!document || document.user_id !== user.id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <DocumentDetailView document={document} user={user} />
      </div>
    </div>
  );
}