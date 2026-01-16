'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  TrendingDown,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
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
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      className={`glass-card rounded-none border-x-0 border-t-0 px-6 py-2 ${className}`}
    >
      {/* Compact header row - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
            <Target className={`w-4 h-4 ${colors.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                Objective
              </span>
              {goal.type === 'custom' && (
                <span className="text-[9px] font-medium px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30">
                  CUSTOM
                </span>
              )}
            </div>
            <p className="text-gray-200 text-sm font-medium truncate">
              {goal.description}
            </p>
          </div>
        </div>

        {/* Progress + expand toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Progress bar (compact) */}
          <div className="hidden sm:block w-24 lg:w-32">
            <div className="relative h-1.5 bg-game-bg rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${colors.bar}`}
              />
            </div>
          </div>

          {/* Progress percentage */}
          <div className="flex items-center gap-1.5">
            <motion.span
              key={goal.progress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-xl font-bold ${colors.text}`}
            >
              {goal.progress}%
            </motion.span>
            
            {/* Change indicator */}
            <AnimatePresence>
              {showChange && progressChange !== 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 5 }}
                  className={`flex items-center text-xs font-medium ${
                    progressChange > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {progressChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{progressChange > 0 ? '+' : ''}{progressChange}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expand toggle */}
          <div className={`p-1 rounded transition-colors ${isExpanded ? 'bg-game-border' : 'group-hover:bg-game-border/50'}`}>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-2">
              {/* Full progress bar with milestones */}
              <div className="relative h-2 bg-game-bg rounded-full overflow-hidden">
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

              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>Turn {currentTurn}</span>
                <div className="flex gap-4">
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Evaluation section */}
              {goal.lastEvaluation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-2.5 bg-game-bg rounded-lg"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
