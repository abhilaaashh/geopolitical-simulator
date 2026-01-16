import { getSharedSession } from '@/lib/db';
import { SharedSessionViewer } from './SharedSessionViewer';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { token: string };
}

export default async function SharedSessionPage({ params }: PageProps) {
  const session = await getSharedSession(params.token);

  if (!session) {
    notFound();
  }

  return <SharedSessionViewer session={session} />;
}

export const dynamic = 'force-dynamic';
