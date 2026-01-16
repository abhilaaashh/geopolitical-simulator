'use client';

import { useState } from 'react';
import { User, LogIn, Save, History } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useGameStore } from '@/lib/store';
import { LoginModal } from '@/components/auth/LoginModal';
import { UserMenu } from '@/components/auth/UserMenu';
import { SessionManager } from '@/components/game/SessionManager';
import { AnalyticsModal } from '@/components/analytics';

export function AppHeader() {
  const { user, isLoading } = useAuth();
  const { phase, scenario } = useGameStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sessionInitialTab, setSessionInitialTab] = useState<'sessions' | 'save'>('sessions');

  const canSave = phase === 'playing' && scenario && user;

  const openSaveTab = () => {
    setSessionInitialTab('save');
    setShowSessions(true);
  };

  const openSessionsTab = () => {
    setSessionInitialTab('sessions');
    setShowSessions(true);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-game-accent to-purple-600 flex items-center justify-center">
                <span className="text-sm sm:text-lg font-bold">SR</span>
              </div>
              <div className="hidden xs:block">
                <h1 className="font-bold text-sm sm:text-lg leading-tight">The Situation Room</h1>
                <p className="text-[10px] sm:text-xs text-gray-500">Geopolitical Simulator</p>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick save button (when in game and logged in) */}
              {canSave && (
                <button
                  onClick={openSaveTab}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              )}

              {/* Sessions button (when logged in) */}
              {user && (
                <button
                  onClick={openSessionsTab}
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-xs sm:text-sm"
                >
                  <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Sessions</span>
                </button>
              )}

              {/* Auth button/menu */}
              {isLoading ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 animate-pulse" />
              ) : user ? (
                <UserMenu onOpenSessions={openSessionsTab} onOpenAnalytics={() => setShowAnalytics(true)} />
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-game-accent hover:bg-game-accent/90 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                >
                  <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
      <SessionManager isOpen={showSessions} onClose={() => setShowSessions(false)} initialTab={sessionInitialTab} />
      <AnalyticsModal isOpen={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </>
  );
}
