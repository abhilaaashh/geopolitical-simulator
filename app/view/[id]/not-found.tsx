import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="glass-card p-12 text-center max-w-md relative z-10">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <Search className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Session Not Found</h1>
        <p className="text-gray-400 mb-8">
          This simulation doesn&apos;t exist or may have been deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/feed" className="btn-secondary flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            Browse Feed
          </Link>
          <Link href="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
