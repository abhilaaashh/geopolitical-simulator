import { getRecentPublicSessions } from '@/lib/db';
import { GameFeed } from '@/components/feed';
import Link from 'next/link';
import { ArrowLeft, Globe2 } from 'lucide-react';

export default async function FeedPage() {
  let sessions;
  try {
    sessions = await getRecentPublicSessions(50);
  } catch (error) {
    console.error('Error fetching feed:', error);
    sessions = [];
  }

  return (
    <div className="min-h-screen bg-game-bg">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card rounded-none border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Simulator</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Globe2 className="w-4 h-4" />
              <span>Public Feed</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Simulations</h1>
          <p className="text-gray-400">
            See what scenarios others are simulating around the world
          </p>
        </div>

        {/* Feed */}
        <GameFeed initialSessions={sessions} />
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';
