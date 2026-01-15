'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { formatTime, getSentimentColor } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { GameEvent } from '@/lib/types';

function ChatBubble({ event, actorColor, isPlayer }: { 
  event: GameEvent; 
  actorColor?: string;
  isPlayer: boolean;
}) {
  const isSystem = event.type === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-4"
      >
        <div className="px-4 py-2 bg-game-accent/10 border border-game-accent/30 rounded-full text-sm text-game-accent">
          {event.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isPlayer ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isPlayer ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div className={`flex items-end gap-2 max-w-[80%] ${isPlayer ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
          style={{ backgroundColor: actorColor ? `${actorColor}30` : '#374151' }}
        >
          {event.actorName.charAt(0)}
        </div>
        
        {/* Message */}
        <div
          className={`px-4 py-3 rounded-2xl ${
            isPlayer
              ? 'bg-game-accent text-white rounded-br-md'
              : 'bg-game-card border border-game-border rounded-bl-md'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span 
              className="text-xs font-medium"
              style={{ color: isPlayer ? 'rgba(255,255,255,0.8)' : actorColor }}
            >
              {event.actorName}
            </span>
            <span className={`text-xs ${isPlayer ? 'text-white/60' : 'text-gray-500'}`}>
              {formatTime(event.timestamp)}
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${isPlayer ? '' : 'text-gray-200'}`}>
            {event.content}
          </p>
          
          {event.impact && typeof event.impact.description === 'string' && (
            <div className={`mt-2 pt-2 border-t ${
              isPlayer ? 'border-white/20' : 'border-game-border'
            }`}>
              <p className={`text-xs ${isPlayer ? 'text-white/70' : 'text-gray-400'}`}>
                📊 {event.impact.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function NewsAlert({ event }: { event: GameEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-4 my-3"
    >
      <div className="glass-card p-3 border-l-4 border-red-500">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
            Breaking
          </span>
          <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-200">{event.content}</p>
      </div>
    </motion.div>
  );
}

export function ChatView() {
  const { events, scenario, playerActorId, isProcessing } = useGameStore();
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [events]);

  const getActorColor = (actorId: string) => {
    return scenario?.actors.find(a => a.id === actorId)?.color;
  };

  return (
    <div ref={chatRef} className="h-full overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto">
        {events.map((event) => {
          // News events get special treatment
          if (event.type === 'news') {
            return <NewsAlert key={event.id} event={event} />;
          }

          return (
            <ChatBubble
              key={event.id}
              event={event}
              actorColor={getActorColor(event.actorId)}
              isPlayer={event.actorId === playerActorId}
            />
          );
        })}
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start mb-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-game-border flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="px-4 py-3 bg-game-card border border-game-border rounded-2xl rounded-bl-md">
                <span className="text-sm text-gray-400 typing-indicator">Typing</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
