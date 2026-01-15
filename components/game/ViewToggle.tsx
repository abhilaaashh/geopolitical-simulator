'use client';

import { useGameStore } from '@/lib/store';
import { LayoutGrid, MessageSquare, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export function ViewToggle() {
  const { viewMode, setViewMode } = useGameStore();

  return (
    <div className="flex items-center gap-1 p-1 bg-game-bg rounded-lg border border-game-border">
      <button
        onClick={() => setViewMode('graphics')}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'graphics' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {viewMode === 'graphics' && (
          <motion.div
            layoutId="viewToggle"
            className="absolute inset-0 bg-game-accent rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-1.5">
          <LayoutGrid className="w-4 h-4" />
          Cards
        </span>
      </button>
      
      <button
        onClick={() => setViewMode('chat')}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'chat' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {viewMode === 'chat' && (
          <motion.div
            layoutId="viewToggle"
            className="absolute inset-0 bg-game-accent rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          Chat
        </span>
      </button>

      <button
        onClick={() => setViewMode('social')}
        className={`relative px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'social' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
        }`}
      >
        {viewMode === 'social' && (
          <motion.div
            layoutId="viewToggle"
            className="absolute inset-0 bg-game-accent rounded-md"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative flex items-center gap-1.5">
          <Radio className="w-4 h-4" />
          Feed
        </span>
      </button>
    </div>
  );
}
