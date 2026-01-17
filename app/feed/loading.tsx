import { Globe2 } from 'lucide-react';

export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-game-bg">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header skeleton */}
      <header className="sticky top-0 z-40 glass-card rounded-none border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
              <div className="w-32 h-4 bg-white/10 rounded animate-pulse" />
            </div>
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

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-8 mb-6">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-5 h-5 border-2 border-game-accent border-t-transparent rounded-full animate-spin" />
            <span>Loading simulations...</span>
          </div>
        </div>

        {/* Skeleton cards */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-card p-5 animate-pulse">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="h-6 bg-white/10 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-white/10 rounded w-1/2" />
                </div>
                <div className="h-6 bg-white/10 rounded w-24" />
              </div>
              <div className="h-4 bg-white/10 rounded w-full mb-4" />
              <div className="flex gap-3">
                <div className="h-7 bg-white/10 rounded w-24" />
                <div className="h-7 bg-white/10 rounded w-20" />
                <div className="h-7 bg-white/10 rounded w-28" />
              </div>
              <div className="mt-4 h-1 bg-white/10 rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
