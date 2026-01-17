import { Eye } from 'lucide-react';

export default function ViewLoading() {
  return (
    <div className="min-h-screen bg-game-bg">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card rounded-none border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 bg-white/10 rounded animate-pulse" />
              <div className="w-24 h-4 bg-white/10 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>Loading simulation...</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Session Header skeleton */}
        <div className="glass-card p-6 mb-6 animate-pulse">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="h-8 bg-white/10 rounded w-2/3 mb-3" />
              <div className="h-5 bg-white/10 rounded w-1/2" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="h-8 bg-white/10 rounded w-28" />
              <div className="h-8 bg-white/10 rounded w-24" />
              <div className="h-8 bg-white/10 rounded w-20" />
              <div className="h-8 bg-white/10 rounded w-32" />
            </div>
          </div>

          {/* Goal skeleton */}
          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-white/10 rounded w-20" />
              <div className="h-4 bg-white/10 rounded w-24" />
            </div>
            <div className="h-5 bg-white/10 rounded w-full mb-2" />
            <div className="h-2 bg-white/10 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Timeline sidebar skeleton */}
          <div className="lg:col-span-1">
            <div className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-20 mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-white/10 rounded" />
                ))}
              </div>
            </div>
          </div>

          {/* Events skeleton */}
          <div className="lg:col-span-3">
            <div className="glass-card p-6 animate-pulse">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 bg-white/10 rounded" />
                <div className="h-6 bg-white/10 rounded w-32" />
              </div>

              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border-l-4 border-white/10">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-5 bg-white/10 rounded w-28" />
                          <div className="h-5 bg-white/10 rounded w-16" />
                        </div>
                        <div className="h-4 bg-white/10 rounded w-full mb-2" />
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* World state skeleton */}
        <div className="glass-card p-6 mt-6 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-white/10 rounded" />
            <div className="h-6 bg-white/10 rounded w-40" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-xl">
                <div className="h-4 bg-white/10 rounded w-24 mb-2" />
                <div className="h-6 bg-white/10 rounded w-16" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
