'use client';

import { motion } from 'framer-motion';
import { Clock, Target, Zap, CheckCircle, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import clsx from 'clsx';

interface GameFeedCardProps {
  sessionId: string;
  userEmail: string;
  title: string;
  scenarioTitle: string | null;
  playerActorName: string | null;
  currentTurn: number;
  isCompleted: boolean;
  globalSentiment: string | null;
  tensionLevel: number | null;
  updatedAt: string;
  index: number;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function getTensionColor(level: number | null): string {
  if (level === null) return 'text-gray-400';
  if (level >= 70) return 'text-red-400';
  if (level >= 40) return 'text-amber-400';
  return 'text-green-400';
}

function getTensionBg(level: number | null): string {
  if (level === null) return 'bg-gray-500';
  if (level >= 70) return 'bg-red-500';
  if (level >= 40) return 'bg-amber-500';
  return 'bg-green-500';
}

export function GameFeedCard({
  sessionId,
  userEmail,
  title,
  scenarioTitle,
  playerActorName,
  currentTurn,
  isCompleted,
  globalSentiment,
  tensionLevel,
  updatedAt,
  index,
}: GameFeedCardProps) {
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/view/${sessionId}`}>
        <div className="glass-card-hover p-5 cursor-pointer group">
          {/* Header: Scenario title + status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-white group-hover:text-game-accent transition-colors truncate">
                {scenarioTitle || title}
              </h3>
              {scenarioTitle && title !== scenarioTitle && (
                <p className="text-sm text-gray-500 truncate">{title}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isCompleted ? (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Completed
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                  <Play className="w-3 h-3" />
                  In Progress
                </span>
              )}
            </div>
          </div>

          {/* Current world state headline */}
          {globalSentiment && (
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
              {globalSentiment}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center flex-wrap gap-3 text-xs">
            {/* Player actor */}
            {playerActorName && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <Target className="w-3.5 h-3.5 text-game-accent" />
                <span className="text-gray-300">{playerActorName}</span>
              </div>
            )}

            {/* Turn count */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-gray-300">Turn {currentTurn}</span>
            </div>

            {/* Tension level */}
            {tensionLevel !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg">
                <Zap className={clsx('w-3.5 h-3.5', getTensionColor(tensionLevel))} />
                <span className={getTensionColor(tensionLevel)}>{tensionLevel}% tension</span>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* User email (masked) + time */}
            <div className="flex items-center gap-2 text-gray-500">
              <span>{maskEmail(userEmail)}</span>
              <span>·</span>
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Tension bar */}
          {tensionLevel !== null && (
            <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={clsx('h-full transition-all', getTensionBg(tensionLevel))}
                style={{ width: `${tensionLevel}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
