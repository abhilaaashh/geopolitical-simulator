'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';
import type { PlayerGoal } from '@/lib/types';

interface GoalProgressProps {
  goal: PlayerGoal;
  currentTurn: number;
  className?: string;
}

export function GoalProgress({
  goal,
  currentTurn,
  className = '',
}: GoalProgressProps) {
  const [prevProgress, setPrevProgress] = useState(goal.progress);
  const [showChange, setShowChange] = useState(false);
  
  const progressChange = goal.progress - prevProgress;
  const progressLevel = goal.progress >= 75 ? 'excellent' : 
                        goal.progress >= 50 ? 'good' : 
                        goal.progress >= 25 ? 'fair' : 'poor';

  useEffect(() => {
    if (goal.progress !== prevProgress) {
      setShowChange(true);
      const timer = setTimeout(() => {
        setPrevProgress(goal.progress);
        setShowChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [goal.progress, prevProgress]);

  const levelColors = {
    excellent: {
      bar: 'bg-green-500',
      text: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
    },
    good: {
      bar: 'bg-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
    fair: {
      bar: 'bg-orange-500',
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
    },
    poor: {
      bar: 'bg-red-500',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
    },
  };

  const colors = levelColors[progressLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-none border-x-0 border-t-0 px-6 py-4 ${className}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
            <Target className={`w-5 h-5 ${colors.text}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Primary Objective
              </span>
              {goal.type === 'custom' && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                  CUSTOM
                </span>
              )}
            </div>
            <p className="text-gray-200 font-medium mt-0.5 max-w-xl truncate">
              {goal.description}
            </p>
          </div>
        </div>

        {/* Progress percentage */}
        <div className="text-right flex-shrink-0">
          <div className="flex items-center gap-2">
            <motion.span
              key={goal.progress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-3xl font-bold ${colors.text}`}
            >
              {goal.progress}%
            </motion.span>
            
            {/* Change indicator */}
            <AnimatePresence>
              {showChange && progressChange !== 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`flex items-center gap-1 text-sm font-medium ${
                    progressChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {progressChange > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{progressChange > 0 ? '+' : ''}{progressChange}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className="text-xs text-gray-500">
            Turn {currentTurn}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-game-bg rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${goal.progress}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors.bar}`}
        />
        
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          {[25, 50, 75].map((milestone) => (
            <div
              key={milestone}
              className="absolute h-full w-px bg-game-border"
              style={{ left: `${milestone}%` }}
            />
          ))}
        </div>
      </div>

      {/* Evaluation section */}
      {goal.lastEvaluation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-start gap-2 p-3 bg-game-bg rounded-lg"
        >
          <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 leading-relaxed">
              {goal.lastEvaluation}
            </p>
            {goal.evaluatedAt && (
              <p className="text-[10px] text-gray-600 mt-1">
                Evaluated at turn {goal.evaluatedAt}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Initial state - no evaluation yet */}
      {!goal.lastEvaluation && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Info className="w-3 h-3" />
          <span>Progress will be evaluated after your first action</span>
        </div>
      )}
    </motion.div>
  );
}

// Compact version for smaller displays (e.g., in header)
interface GoalProgressCompactProps {
  goal: PlayerGoal;
  className?: string;
}

export function GoalProgressCompact({ goal, className = '' }: GoalProgressCompactProps) {
  const progressLevel = goal.progress >= 75 ? 'excellent' : 
                        goal.progress >= 50 ? 'good' : 
                        goal.progress >= 25 ? 'fair' : 'poor';

  const barColors = {
    excellent: 'bg-green-500',
    good: 'bg-amber-500',
    fair: 'bg-orange-500',
    poor: 'bg-red-500',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Target className="w-4 h-4 text-game-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs text-gray-400 truncate">{goal.description}</span>
          <span className="text-xs font-medium text-gray-200 flex-shrink-0">
            {goal.progress}%
          </span>
        </div>
        <div className="h-1.5 bg-game-bg rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            className={`h-full rounded-full ${barColors[progressLevel]}`}
          />
        </div>
      </div>
    </div>
  );
}
