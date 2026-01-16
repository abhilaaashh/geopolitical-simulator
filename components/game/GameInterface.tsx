'use client';

import { useGameStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { ActorsSidebar } from './ActorsSidebar';
import { EventFeed } from './EventFeed';
import { ChatView } from './ChatView';
import { SocialView } from './SocialView';
import { ActionInput } from './ActionInput';
import { ViewToggle } from './ViewToggle';
import { GoalProgress, GoalProgressCompact } from './GoalProgress';
import { SessionManager } from './SessionManager';
import { LoginModal } from '@/components/auth/LoginModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { Menu, X, Users, ScrollText, Save, History, LogIn } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SummaryModal } from './SummaryModal';

export function GameInterface() {
  const { scenario, viewMode, currentTurn, playerGoal, resetGame } = useGameStore();
  const { user, isLoading } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [sessionInitialTab, setSessionInitialTab] = useState<'sessions' | 'save'>('sessions');

  const openSaveTab = () => {
    setSessionInitialTab('save');
    setShowSessions(true);
  };

  const openSessionsTab = () => {
    setSessionInitialTab('sessions');
    setShowSessions(true);
  };

  if (!scenario) return null;

  // Social view has its own full-screen layout
  if (viewMode === 'social') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        {/* Unified top bar for social view */}
        <header className="glass-card rounded-none border-x-0 border-t-0 px-4 py-2 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-game-accent to-purple-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold">SR</span>
            </div>
            <div className="hidden sm:block border-r border-game-border pr-3">
              <h1 className="font-bold text-sm leading-tight">{scenario.title}</h1>
              <p className="text-xs text-gray-500">Turn {currentTurn}</p>
            </div>
            {/* Compact goal progress in header for social view */}
            {playerGoal && (
              <div className="hidden md:block w-48 lg:w-64">
                <GoalProgressCompact goal={playerGoal} />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <ViewToggle />
            <button
              onClick={() => setShowSummary(true)}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1.5 hover:bg-white/5 rounded"
            >
              <ScrollText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Summary</span>
            </button>
            
            <div className="h-4 w-px bg-game-border mx-1" />
            
            {/* Save button */}
            {user && (
              <button
                onClick={openSaveTab}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save</span>
              </button>
            )}
            
            {/* Sessions button */}
            {user && (
              <button
                onClick={openSessionsTab}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sessions</span>
              </button>
            )}
            
            {/* Auth */}
            {isLoading ? (
              <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <UserMenu onOpenSessions={openSessionsTab} />
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-game-accent hover:bg-game-accent/90 rounded text-xs font-medium transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
            
            <div className="h-4 w-px bg-game-border mx-1" />
            
            <button
              onClick={resetGame}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 hover:bg-white/5 rounded"
            >
              Exit
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

        {/* Modals */}
        <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} />
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        <SessionManager isOpen={showSessions} onClose={() => setShowSessions(false)} initialTab={sessionInitialTab} />
      </div>
    );
  }

  // Standard layout for cards and chat view
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Unified top bar */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-4 py-2 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-game-accent to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold">SR</span>
          </div>
          
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden p-1.5 hover:bg-game-border rounded transition-colors"
          >
            {showSidebar ? <X className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          </button>
          
          <div className="border-r border-game-border pr-3">
            <h1 className="font-bold text-sm leading-tight">{scenario.title}</h1>
            <p className="text-xs text-gray-500">Turn {currentTurn}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ViewToggle />
          <button
            onClick={() => setShowSummary(true)}
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1.5 hover:bg-white/5 rounded"
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Summary</span>
          </button>
          
          <div className="h-4 w-px bg-game-border mx-1" />
          
          {/* Save button */}
          {user && (
            <button
              onClick={openSaveTab}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}
          
          {/* Sessions button */}
          {user && (
            <button
              onClick={openSessionsTab}
              className="flex items-center gap-1.5 px-2 py-1.5 bg-white/5 hover:bg-white/10 rounded text-xs transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sessions</span>
            </button>
          )}
          
          {/* Auth */}
          {isLoading ? (
            <div className="w-7 h-7 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <UserMenu onOpenSessions={openSessionsTab} />
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-game-accent hover:bg-game-accent/90 rounded text-xs font-medium transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
          
          <div className="h-4 w-px bg-game-border mx-1" />
          
          <button
            onClick={resetGame}
            className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1.5 hover:bg-white/5 rounded"
          >
            Exit
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
            fixed lg:relative top-12 lg:top-0 bottom-0 left-0 z-40 lg:z-0
            w-72 glass-card rounded-none border-y-0 border-l-0
            transform transition-transform duration-300
            ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            overflow-hidden flex flex-col
          `}
        >
          <ActorsSidebar onClose={() => setShowSidebar(false)} />
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Goal Progress & World State - Combined Panel */}
          {playerGoal && (
            <GoalProgress goal={playerGoal} currentTurn={currentTurn} />
          )}

          {/* Event display area */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'graphics' ? <EventFeed /> : <ChatView />}
          </div>

          {/* Action Input */}
          <ActionInput />
        </main>
      </div>

      {/* Modals */}
      <SummaryModal isOpen={showSummary} onClose={() => setShowSummary(false)} />
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <SessionManager isOpen={showSessions} onClose={() => setShowSessions(false)} initialTab={sessionInitialTab} />
    </div>
  );
}
