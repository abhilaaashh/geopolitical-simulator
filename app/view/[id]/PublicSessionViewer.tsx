'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Target, Calendar, Eye, MessageSquare, Globe, User } from 'lucide-react';
import Link from 'next/link';
import type { GameState, GameEvent } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

interface PublicSession {
  session_id: string;
  user_email: string;
  title: string;
  scenario_title: string | null;
  player_actor_name: string | null;
  game_state: GameState;
  current_turn: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface PublicSessionViewerProps {
  session: PublicSession;
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return email;
  
  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }
  
  return `${localPart.slice(0, 2)}***@${domain}`;
}

export function PublicSessionViewer({ session }: PublicSessionViewerProps) {
  const { game_state: gameState } = session;
  const [selectedTurn, setSelectedTurn] = useState<number | null>(null);

  const eventsByTurn = gameState.events.reduce((acc, event) => {
    const turn = event.turn;
    if (!acc[turn]) acc[turn] = [];
    acc[turn].push(event);
    return acc;
  }, {} as Record<number, GameEvent[]>);

  const turns = Object.keys(eventsByTurn).map(Number).sort((a, b) => a - b);
  const displayEvents = selectedTurn !== null 
    ? eventsByTurn[selectedTurn] || []
    : gameState.events;

  const playerActor = gameState.scenario?.actors.find(a => a.id === gameState.playerActorId);

  return (
    <div className="min-h-screen bg-game-bg">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-card rounded-none border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/feed"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Feed</span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Eye className="w-4 h-4" />
              <span>Viewing simulation</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Session Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{session.title}</h1>
              <p className="text-lg text-gray-400">{session.scenario_title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <User className="w-4 h-4 text-gray-400" />
                <span>{maskEmail(session.user_email)}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <Target className="w-4 h-4 text-game-accent" />
                <span>{session.player_actor_name}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Turn {session.current_turn}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{format(new Date(session.created_at), 'MMM d, yyyy')}</span>
              </div>
              {session.is_completed && (
                <span className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg">
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Player Goal */}
          {gameState.playerGoal && (
            <div className="mt-6 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Objective</span>
                <span className="text-sm font-medium text-game-accent">
                  {gameState.playerGoal.progress}% Progress
                </span>
              </div>
              <p className="text-gray-200">{gameState.playerGoal.description}</p>
              <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-game-accent to-purple-500 transition-all"
                  style={{ width: `${gameState.playerGoal.progress}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Turn Selector Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-4 sticky top-24">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Timeline
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedTurn(null)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg transition-colors',
                    selectedTurn === null
                      ? 'bg-game-accent/20 text-game-accent'
                      : 'hover:bg-white/5 text-gray-400'
                  )}
                >
                  All Events
                </button>
                {turns.map((turn) => (
                  <button
                    key={turn}
                    onClick={() => setSelectedTurn(turn)}
                    className={clsx(
                      'w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between',
                      selectedTurn === turn
                        ? 'bg-game-accent/20 text-game-accent'
                        : 'hover:bg-white/5 text-gray-400'
                    )}
                  >
                    <span>Turn {turn}</span>
                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                      {eventsByTurn[turn].length}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Events Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-game-accent" />
                <h2 className="text-xl font-semibold">
                  {selectedTurn !== null ? `Turn ${selectedTurn} Events` : 'All Events'}
                </h2>
                <span className="text-sm text-gray-500">
                  ({displayEvents.length} events)
                </span>
              </div>

              <div className="space-y-4">
                {displayEvents.map((event) => (
                  <EventCard key={event.id} event={event} gameState={gameState} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* World State Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mt-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-game-accent" />
            <h2 className="text-xl font-semibold">Current World State</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Tension Level</div>
              <div className="text-2xl font-bold">{gameState.worldState.tensionLevel}%</div>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full transition-all',
                    gameState.worldState.tensionLevel > 70 ? 'bg-red-500' :
                    gameState.worldState.tensionLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  )}
                  style={{ width: `${gameState.worldState.tensionLevel}%` }}
                />
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Global Sentiment</div>
              <div className="text-lg font-semibold">{gameState.worldState.globalSentiment}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Diplomatic Status</div>
              <div className="text-lg font-semibold">{gameState.worldState.diplomaticStatus}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl">
              <div className="text-sm text-gray-400 mb-1">Humanitarian</div>
              <div className="text-lg font-semibold">{gameState.worldState.humanitarianSituation}</div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function EventCard({ event, gameState }: { event: GameEvent; gameState: GameState }) {
  const actor = gameState.scenario?.actors.find(a => a.id === event.actorId);
  
  const sentimentColors = {
    positive: 'border-green-500/50 bg-green-500/5',
    negative: 'border-red-500/50 bg-red-500/5',
    neutral: 'border-gray-500/50 bg-gray-500/5',
    escalation: 'border-orange-500/50 bg-orange-500/5',
    deescalation: 'border-blue-500/50 bg-blue-500/5',
  };

  const typeIcons = {
    action: '⚡',
    reaction: '↩️',
    autonomous: '🔄',
    news: '📰',
    system: '🎮',
  };

  return (
    <div
      className={clsx(
        'p-4 rounded-xl border-l-4 transition-colors',
        sentimentColors[event.sentiment || 'neutral']
      )}
    >
      <div className="flex items-start gap-3">
        {/* Actor Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
          style={{ backgroundColor: actor?.color || '#666' }}
        >
          {actor?.name?.[0] || event.actorName[0]}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold">{event.actorName}</span>
            <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full">
              {typeIcons[event.type]} {event.type}
            </span>
            {event.isPlayerAction && (
              <span className="text-xs px-2 py-0.5 bg-game-accent/20 text-game-accent rounded-full">
                Player
              </span>
            )}
            <span className="text-xs text-gray-500">Turn {event.turn}</span>
          </div>

          {/* Content */}
          <p className="text-gray-200 whitespace-pre-wrap">{event.content}</p>

          {/* Impact */}
          {event.impact && (
            <div className="mt-2 text-sm text-gray-400 italic">
              Impact: {event.impact.description}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
