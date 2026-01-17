'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Globe2, TrendingUp } from 'lucide-react';
import { GameFeedCard } from './GameFeedCard';
import type { PublicSessionFeedItem } from '@/lib/database.types';

interface GameFeedProps {
  initialSessions?: PublicSessionFeedItem[];
}

export function GameFeed({ initialSessions }: GameFeedProps) {
  const [sessions, setSessions] = useState<PublicSessionFeedItem[]>(initialSessions ?? []);
  const [isLoading, setIsLoading] = useState(!initialSessions);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch('/api/feed?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json();
      setSessions(data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialSessions) {
      fetchSessions();
    }
  }, [initialSessions]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-5 animate-pulse">
            <div className="h-6 bg-white/10 rounded w-3/4 mb-3" />
            <div className="h-4 bg-white/10 rounded w-full mb-4" />
            <div className="flex gap-3">
              <div className="h-7 bg-white/10 rounded w-24" />
              <div className="h-7 bg-white/10 rounded w-20" />
              <div className="h-7 bg-white/10 rounded w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => fetchSessions()}
          className="btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 text-center"
      >
        <Globe2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Games Yet</h3>
        <p className="text-gray-400">
          Be the first to simulate a geopolitical scenario!
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Feed header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-game-accent" />
          <span className="text-sm text-gray-400">
            {sessions.length} recent {sessions.length === 1 ? 'simulation' : 'simulations'}
          </span>
        </div>
        <button
          onClick={() => fetchSessions(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Feed cards */}
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <GameFeedCard
            key={session.session_id}
            sessionId={session.session_id}
            userEmail={session.user_email}
            title={session.title}
            scenarioTitle={session.scenario_title}
            playerActorName={session.player_actor_name}
            currentTurn={session.current_turn}
            isCompleted={session.is_completed}
            globalSentiment={session.global_sentiment}
            tensionLevel={session.tension_level}
            updatedAt={session.updated_at}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
