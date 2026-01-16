import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-game-bg flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="glass-card p-12 text-center max-w-md relative">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="text-3xl font-bold mb-4">Session Not Found</h1>
        <p className="text-gray-400 mb-8">
          This shared session doesn&apos;t exist or may have been deleted by its owner.
        </p>
        <Link
          href="/"
          className="btn-primary inline-block"
        >
          Start Your Own Session
        </Link>
      </div>
    </div>
  );
}
