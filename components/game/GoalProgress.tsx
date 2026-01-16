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
  Zap,
  Globe,
  AlertTriangle,
  Minus,
} from 'lucide-react';
import { useGameStore } from '@/lib/store';
import { getTensionColor } from '@/lib/utils';
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
  const { worldState } = useGameStore();
  const [prevProgress, setPrevProgress] = useState(goal.progress);
  const [showChange, setShowChange] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const progressChange = goal.progress - prevProgress;
  const progressLevel = goal.progress >= 75 ? 'excellent' : 
                        goal.progress >= 50 ? 'good' : 
                        goal.progress >= 25 ? 'fair' : 'poor';

  // World state values
  const tensionLevel = worldState.tensionLevel ?? 50;
  const activeConflicts = worldState.activeConflicts || [];

  const getTensionIcon = () => {
    if (tensionLevel > 70) return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    if (tensionLevel > 50) return <TrendingUp className="w-3.5 h-3.5 text-amber-400" />;
    if (tensionLevel < 30) return <TrendingDown className="w-3.5 h-3.5 text-green-400" />;
    return <Minus className="w-3.5 h-3.5 text-gray-400" />;
  };

  const getTensionLabel = () => {
    if (tensionLevel > 80) return 'Critical';
    if (tensionLevel > 60) return 'High';
    if (tensionLevel > 40) return 'Elevated';
    if (tensionLevel > 20) return 'Moderate';
    return 'Low';
  };

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
      className={`glass-card rounded-none border-x-0 border-t-0 px-3 sm:px-4 py-2 ${className}`}
    >
      {/* Compact header row - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 sm:gap-3 group"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
            <Target className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${colors.text}`} />
          </div>
          <span className="hidden sm:inline text-[10px] font-medium text-gray-500 uppercase tracking-wider flex-shrink-0">
            Objective
          </span>
          {goal.type === 'custom' && (
            <span className="hidden sm:inline text-[9px] font-medium px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 flex-shrink-0">
              CUSTOM
            </span>
          )}
          <p className="text-gray-200 text-xs sm:text-sm font-medium truncate min-w-0 flex-1">
            {goal.description}
          </p>
        </div>

        {/* Progress + world state summary + expand toggle */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Quick world state indicators (collapsed view) - hidden on mobile */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-game-accent" />
              <div className="w-16 h-1.5 bg-game-bg rounded-full overflow-hidden">
                <div className={`h-full ${getTensionColor(tensionLevel)}`} style={{ width: `${tensionLevel}%` }} />
              </div>
            </div>
            {activeConflicts.length > 0 && (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {activeConflicts.length}
              </span>
            )}
          </div>

          <div className="hidden sm:block h-4 w-px bg-game-border" />

          {/* Progress bar (compact) - hidden on mobile */}
          <div className="hidden md:block w-20">
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
          <div className="flex items-center gap-1">
            <motion.span
              key={goal.progress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-base sm:text-lg font-bold ${colors.text}`}
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
                  <span className="hidden sm:inline">{progressChange > 0 ? '+' : ''}{progressChange}</span>
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
            <div className="pt-3 space-y-3">
              {/* World State Section */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 p-2 sm:p-2.5 bg-game-bg/50 rounded-lg">
                {/* Tension Level */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Zap className="w-4 h-4 text-game-accent flex-shrink-0" />
                  <span className="text-xs text-gray-400">Tension</span>
                  <div className="flex-1 sm:flex-none sm:w-24 h-1.5 bg-game-bg rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${getTensionColor(tensionLevel)} transition-all`}
                      initial={{ width: 0 }}
                      animate={{ width: `${tensionLevel}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-medium flex items-center gap-1 flex-shrink-0">
                    {getTensionIcon()}
                    <span className="hidden xs:inline">{getTensionLabel()}</span>
                  </span>
                </div>

                <div className="h-4 w-px bg-game-border hidden sm:block" />

                {/* Global Sentiment */}
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400">Sentiment:</span>
                  <span className="text-xs font-medium">
                    {typeof worldState.globalSentiment === 'string' ? worldState.globalSentiment : 'Neutral'}
                  </span>
                </div>

                <div className="h-4 w-px bg-game-border hidden sm:block" />

                {/* Diplomatic Status */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Diplomacy:</span>
                  <span className="text-xs font-medium">
                    {typeof worldState.diplomaticStatus === 'string' ? worldState.diplomaticStatus : 'Stable'}
                  </span>
                </div>

                {/* Active Conflicts */}
                {activeConflicts.length > 0 && (
                  <>
                    <div className="h-4 w-px bg-game-border hidden sm:block" />
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400">Active:</span>
                      <span className="text-xs text-red-400 font-medium">
                        {activeConflicts.length} conflict{activeConflicts.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Goal Progress Details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                  <Target className="w-3 h-3" />
                  Goal Progress
                </div>
                
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
                  <div className="flex gap-2 sm:gap-4">
                    <span className="hidden xs:inline">25%</span>
                    <span>50%</span>
                    <span className="hidden xs:inline">75%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>

              {/* Evaluation section */}
              {goal.lastEvaluation && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-2 sm:p-2.5 bg-game-bg rounded-lg"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
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
                <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500">
                  <Info className="w-3 h-3 flex-shrink-0" />
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
