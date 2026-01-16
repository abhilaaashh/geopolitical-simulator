'use client';

import { useGameStore } from '@/lib/store';
import { LayoutGrid, MessageSquare, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export function ViewToggle() {
  const { viewMode, setViewMode } = useGameStore();

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-game-bg rounded-lg border border-game-border">
      <button
        onClick={() => setViewMode('graphics')}
        className={`relative px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-w-[36px] sm:min-w-0 ${
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
        <span className="relative flex items-center justify-center gap-1.5">
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline">Cards</span>
        </span>
      </button>
      
      <button
        onClick={() => setViewMode('chat')}
        className={`relative px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-w-[36px] sm:min-w-0 ${
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
        <span className="relative flex items-center justify-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Chat</span>
        </span>
      </button>

      <button
        onClick={() => setViewMode('social')}
        className={`relative px-2 sm:px-3 py-1.5 rounded-md text-sm font-medium transition-colors min-w-[36px] sm:min-w-0 ${
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
        <span className="relative flex items-center justify-center gap-1.5">
          <Radio className="w-4 h-4" />
          <span className="hidden sm:inline">Feed</span>
        </span>
      </button>
    </div>
  );
}
