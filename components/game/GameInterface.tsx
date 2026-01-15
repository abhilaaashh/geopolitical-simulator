'use client';

import { useGameStore } from '@/lib/store';
import { WorldStatePanel } from './WorldStatePanel';
import { ActorsSidebar } from './ActorsSidebar';
import { EventFeed } from './EventFeed';
import { ChatView } from './ChatView';
import { SocialView } from './SocialView';
import { ActionInput } from './ActionInput';
import { ViewToggle } from './ViewToggle';
import { GoalProgress, GoalProgressCompact } from './GoalProgress';
import { Menu, X, Users, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SummaryModal } from './SummaryModal';

export function GameInterface() {
  const { scenario, viewMode, currentTurn, playerGoal, resetGame } = useGameStore();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  if (!scenario) return null;

  // Social view has its own full-screen layout
  if (viewMode === 'social') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Minimal top bar for social view */}
        <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-lg">{scenario.title}</h1>
              <p className="text-sm text-gray-400">Turn {currentTurn}</p>
            </div>
            {/* Compact goal progress in header for social view */}
            {playerGoal && (
              <div className="hidden md:block w-64 lg:w-80">
                <GoalProgressCompact goal={playerGoal} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <ViewToggle />
            <button
              onClick={() => setShowSummary(true)}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ScrollText className="w-4 h-4" />
              Summary
            </button>
            <button
              onClick={resetGame}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Exit Game
            </button>
          </div>
        </header>

        {/* Goal Progress for mobile in social view */}
        {playerGoal && (
          <div className="md:hidden">
            <GoalProgress goal={playerGoal} currentTurn={currentTurn} />
          </div>
        )}

        {/* Social View takes full width */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <SocialView />
          </div>
          
          {/* Action Input */}
          <ActionInput />
        </div>

        {/* Summary Modal */}
        <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} />
      </div>
    );
  }

  // Standard layout for cards and chat view
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden p-2 hover:bg-game-border rounded-lg transition-colors"
          >
            {showSidebar ? <X className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </button>
          <div>
            <h1 className="font-bold text-lg">{scenario.title}</h1>
            <p className="text-sm text-gray-400">Turn {currentTurn}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <ViewToggle />
          <button
            onClick={() => setShowSummary(true)}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <ScrollText className="w-4 h-4" />
            Summary
          </button>
          <button
            onClick={resetGame}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Exit Game
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
              onClick={() => setShowSidebar(false)}
            />
          )}
        </AnimatePresence>

        {/* Actors Sidebar */}
        <aside
          className={`
            fixed lg:relative inset-y-0 left-0 z-40 lg:z-0
            w-80 glass-card rounded-none border-y-0 border-l-0
            transform transition-transform duration-300
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            overflow-hidden flex flex-col
          `}
        >
          <ActorsSidebar onClose={() => setShowSidebar(false)} />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Goal Progress - Primary Metric */}
          {playerGoal && (
            <GoalProgress goal={playerGoal} currentTurn={currentTurn} />
          )}

          {/* World State Panel */}
          <WorldStatePanel />

          {/* Event display area */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'graphics' ? <EventFeed /> : <ChatView />}
          </div>

          {/* Action Input */}
          <ActionInput />
        </main>
      </div>

      {/* Summary Modal */}
      <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} />
    </div>
  );
}
