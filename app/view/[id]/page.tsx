import { getPublicSession } from '@/lib/db';
import { PublicSessionViewer } from './PublicSessionViewer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { id: string };
}

export default async function PublicViewPage({ params }: PageProps) {
  const session = await getPublicSession(params.id);

  if (!session) {
    notFound();
  }

  return <PublicSessionViewer session={session} />;
}

export const dynamic = 'force-dynamic';
