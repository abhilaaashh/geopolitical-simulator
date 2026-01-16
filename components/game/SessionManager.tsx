'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Play, Share2, Clock, Target, Link2, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useGameStore } from '@/lib/store';
import { getSessions, createSession, updateSession, deleteSession, createShareLink, getShareToken } from '@/lib/db';
import type { GameSession } from '@/lib/database.types';
import { formatDistanceToNow } from 'date-fns';

interface SessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'sessions' | 'save';
}

export function SessionManager({ isOpen, onClose, initialTab = 'sessions' }: SessionManagerProps) {
  const { user } = useAuth();
  const gameState = useGameStore();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sessions' | 'save'>(initialTab);

  // Reset to initial tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && user) {
      loadSessions();
    }
  }, [isOpen, user]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Use the input value or generate a default name
    const defaultName = `${gameState.scenario?.title} - Turn ${gameState.currentTurn}`;
    const finalName = saveName.trim() || defaultName;

    try {
      setIsSaving(true);
      const currentState = useGameStore.getState();
      const gameStateData = {
        scenario: currentState.scenario,
        playerId: currentState.playerId,
        playerActorId: currentState.playerActorId,
        startingMilestoneId: currentState.startingMilestoneId,
        playerGoal: currentState.playerGoal,
        currentTurn: currentState.currentTurn,
        events: currentState.events,
        worldState: currentState.worldState,
        phase: currentState.phase,
        viewMode: currentState.viewMode,
        isProcessing: false,
        selectedActionType: currentState.selectedActionType,
      };

      // If we have an existing session loaded, update it; otherwise create new
      if (currentState.cloudSessionId) {
        await updateSession(currentState.cloudSessionId, gameStateData, saveName.trim() || undefined);
        gameState.markSynced();
      } else {
        const newSession = await createSession(user.id, finalName, gameStateData);
        // Track this as the current session so future saves will update it
        gameState.setCloudSession(newSession.id);
        gameState.markSynced();
      }
      
      setSaveName('');
      setShowSaveForm(false);
      setActiveTab('sessions');
      await loadSessions();
    } catch (err) {
      console.error('Failed to save session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = (session: GameSession) => {
    const state = session.game_state;
    // Reset and load state
    gameState.resetGame();
    if (state.scenario) gameState.setScenario(state.scenario);
    if (state.playerActorId) gameState.selectCharacter(state.playerActorId);
    if (state.startingMilestoneId) gameState.selectMilestone(state.startingMilestoneId);
    if (state.playerGoal) gameState.setPlayerGoal(state.playerGoal);
    
    // If the game was in progress, restore events and start
    if (state.phase === 'playing' || state.phase === 'ended') {
      gameState.startGame();
      // Restore events (replace initial event)
      state.events.forEach((event, index) => {
        if (index > 0) gameState.addEvent(event);
      });
      // Restore world state
      gameState.updateWorldState(state.worldState);
    }
    
    // Track this as the current session so saves will update it instead of creating new
    gameState.setCloudSession(session.id);
    gameState.markSynced();
    
    onClose();
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      setDeleteConfirm(null);
      
      // If we deleted the currently loaded session, clear the cloudSessionId
      if (gameState.cloudSessionId === id) {
        gameState.setCloudSession(null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleShare = async (sessionId: string) => {
    try {
      const token = await createShareLink(sessionId);
      const shareUrl = `${window.location.origin}/shared/${token}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedId(sessionId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to share session:', err);
    }
  };

  const canSave = gameState.phase === 'playing' && gameState.scenario;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg glass-card rounded-l-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold">My Sessions</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'sessions'
                    ? 'text-game-accent border-b-2 border-game-accent'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Saved Games
              </button>
              <button
                onClick={() => setActiveTab('save')}
                disabled={!canSave}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'save'
                    ? 'text-game-accent border-b-2 border-game-accent'
                    : 'text-gray-400 hover:text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Save Current
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'sessions' && (
                <>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-game-accent" />
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Save className="w-8 h-8 text-gray-500" />
                      </div>
                      <p className="text-gray-400 mb-2">No saved sessions yet</p>
                      <p className="text-sm text-gray-500">
                        Start a game and save it to see it here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => {
                        const isCurrentSession = gameState.cloudSessionId === session.id;
                        return (
                        <div
                          key={session.id}
                          className={`rounded-xl p-4 transition-colors ${
                            isCurrentSession 
                              ? 'bg-game-accent/10 border border-game-accent/30' 
                              : 'bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold truncate">{session.title}</h3>
                                {isCurrentSession && (
                                  <span className="px-2 py-0.5 text-xs bg-game-accent/20 text-game-accent rounded-full shrink-0">
                                    Current
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 truncate">
                                {session.scenario_title || 'Unknown scenario'}
                              </p>
                            </div>
                            {session.is_completed && (
                              <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                                Completed
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {session.player_actor_name || 'Unknown'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Turn {session.current_turn}
                            </span>
                            <span>
                              {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleLoad(session)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-game-accent/20 text-game-accent rounded-lg hover:bg-game-accent/30 transition-colors text-sm"
                            >
                              <Play className="w-4 h-4" />
                              Load
                            </button>
                            <button
                              onClick={() => handleShare(session.id)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Share"
                            >
                              {copiedId === session.id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Share2 className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            {deleteConfirm === session.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(session.id)}
                                  className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-2 py-1 text-xs bg-white/10 rounded hover:bg-white/20"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(session.id)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'save' && (
                <div className="space-y-6">
                  {!canSave ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400">
                        Start a game to save your progress
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Show if updating existing or creating new */}
                      {gameState.cloudSessionId ? (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                          <p className="text-sm text-blue-400">
                            <strong>Updating existing save.</strong> Your progress will be saved to the current session.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                          <p className="text-sm text-green-400">
                            <strong>Creating new save.</strong> A new save slot will be created for this game.
                          </p>
                        </div>
                      )}

                      {/* Only show name input for new saves */}
                      {!gameState.cloudSessionId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Save Name
                          </label>
                          <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder={`${gameState.scenario?.title} - Turn ${gameState.currentTurn}`}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-game-accent transition-colors"
                          />
                        </div>
                      )}

                      <div className="bg-white/5 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Current Game</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Scenario</span>
                            <span>{gameState.scenario?.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Playing as</span>
                            <span>{gameState.scenario?.actors.find(a => a.id === gameState.playerActorId)?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Turn</span>
                            <span>{gameState.currentTurn}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Events</span>
                            <span>{gameState.events.length}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-game-accent text-white rounded-xl font-medium hover:bg-game-accent/90 transition-colors disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5" />
                            {gameState.cloudSessionId ? 'Save Progress' : 'Create Save'}
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
