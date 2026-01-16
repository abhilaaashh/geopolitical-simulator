'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Gamepad2, Clock, Target, TrendingUp, Loader2 } from 'lucide-react';
import type { AnalyticsStats } from '@/lib/database.types';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Unable to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = stats ? [
    {
      label: 'Total Users',
      value: stats.total_users.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Games Played',
      value: stats.total_sessions.toLocaleString(),
      icon: Gamepad2,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Avg Session',
      value: formatDuration(stats.avg_session_duration_seconds),
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      label: 'Avg Turns',
      value: stats.avg_turns_per_game.toFixed(1),
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
    },
    {
      label: 'Completion Rate',
      value: `${stats.completion_rate}%`,
      icon: TrendingUp,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/20',
    },
  ] : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div 
              className="glass-card p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Platform Stats</h2>
                  <p className="text-sm text-gray-400 mt-1">Live analytics from all players</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-game-accent" />
                  <p className="text-sm text-gray-400">Loading analytics...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-400">{error}</p>
                  <button 
                    onClick={fetchStats}
                    className="mt-4 text-sm text-game-accent hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-2 gap-3">
                  {statCards.map((card, index) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-xl bg-white/5 border border-white/10 ${
                        index === statCards.length - 1 && statCards.length % 2 === 1 
                          ? 'col-span-2' 
                          : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                          <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{card.value}</p>
                          <p className="text-xs text-gray-400">{card.label}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : null}

              {/* Footer */}
              {stats && (
                <p className="mt-6 text-center text-xs text-gray-500">
                  Stats include all games across all users
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
