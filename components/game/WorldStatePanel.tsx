'use client';

import { useGameStore } from '@/lib/store';
import { getTensionColor } from '@/lib/utils';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Globe, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function WorldStatePanel() {
  const { worldState } = useGameStore();
  const tensionLevel = worldState.tensionLevel ?? 50;
  const activeConflicts = worldState.activeConflicts || [];

  const getTensionIcon = () => {
    if (tensionLevel > 70) return <AlertTriangle className="w-4 h-4 text-red-400" />;
    if (tensionLevel > 50) return <TrendingUp className="w-4 h-4 text-amber-400" />;
    if (tensionLevel < 30) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTensionLabel = () => {
    if (tensionLevel > 80) return 'Critical';
    if (tensionLevel > 60) return 'High';
    if (tensionLevel > 40) return 'Elevated';
    if (tensionLevel > 20) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4">
      <div className="flex flex-wrap items-center gap-6">
        {/* Tension Level */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-game-accent" />
            <span className="text-sm text-gray-400">Tension</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-game-bg rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${getTensionColor(tensionLevel)} transition-all`}
                initial={{ width: 0 }}
                animate={{ width: `${tensionLevel}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-sm font-medium flex items-center gap-1">
              {getTensionIcon()}
              {getTensionLabel()}
            </span>
          </div>
        </div>

        {/* Global Sentiment */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-400">Sentiment:</span>
          <span className="text-sm font-medium">
            {typeof worldState.globalSentiment === 'string' ? worldState.globalSentiment : 'Neutral'}
          </span>
        </div>

        {/* Diplomatic Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Diplomacy:</span>
          <span className="text-sm font-medium">
            {typeof worldState.diplomaticStatus === 'string' ? worldState.diplomaticStatus : 'Stable'}
          </span>
        </div>

        {/* Active Conflicts */}
        {activeConflicts.length > 0 && (
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Active:</span>
            <span className="text-sm text-red-400 font-medium">
              {activeConflicts.length} conflict{activeConflicts.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
