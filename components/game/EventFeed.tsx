'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { formatTime, getSentimentColor } from '@/lib/utils';
import { 
  User, Globe, Radio, AlertTriangle, Zap, 
  TrendingUp, TrendingDown, ChevronRight 
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { GameEvent } from '@/lib/types';
import { TweetCard, NewsArticleCard, PressReleaseCard } from './media';

const TYPE_ICONS = {
  action: <Zap className="w-4 h-4" />,
  reaction: <ChevronRight className="w-4 h-4" />,
  autonomous: <Globe className="w-4 h-4" />,
  news: <Radio className="w-4 h-4" />,
  system: <AlertTriangle className="w-4 h-4" />,
};

const SENTIMENT_ICONS = {
  positive: <TrendingDown className="w-3 h-3 text-green-400" />,
  negative: <TrendingUp className="w-3 h-3 text-red-400" />,
  escalation: <TrendingUp className="w-3 h-3 text-red-400" />,
  deescalation: <TrendingDown className="w-3 h-3 text-green-400" />,
  neutral: null,
};

// Helper to safely convert any value to string
function safeString(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Default event card for system messages and fallback
function DefaultEventCard({ event, actorColor }: { event: GameEvent; actorColor?: string }) {
  const isPlayer = event.isPlayerAction;
  const isSystem = event.type === 'system';
  
  // Safely extract string values
  const actorName = safeString(event.actorName) || 'Unknown';
  const content = safeString(event.content);
  const eventType = safeString(event.type) || 'event';
  const impactDescription = event.impact ? safeString(event.impact.description) : '';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`glass-card p-5 ${isPlayer ? 'border-game-accent/50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: isSystem 
                ? 'rgba(99, 102, 241, 0.2)' 
                : actorColor ? `${actorColor}20` : 'rgba(156, 163, 175, 0.2)'
            }}
          >
            {isSystem ? (
              <Globe className="w-5 h-5 text-game-accent" />
            ) : (
              <User className="w-5 h-5" style={{ color: actorColor }} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{actorName}</h4>
              {isPlayer && (
                <span className="badge-info text-xs">You</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {TYPE_ICONS[eventType as keyof typeof TYPE_ICONS] || <Zap className="w-4 h-4" />}
                <span className="capitalize">{eventType}</span>
              </span>
              <span>•</span>
              <span>Turn {event.turn ?? 1}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {event.sentiment && SENTIMENT_ICONS[event.sentiment as keyof typeof SENTIMENT_ICONS]}
          <span className="text-xs text-gray-500">{formatTime(event.timestamp)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="pl-13">
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {/* Impact section */}
        {event.impact && impactDescription && (
          <div className="mt-4 p-3 bg-game-bg/50 rounded-lg border border-game-border/50">
            <p className="text-sm text-gray-400">
              <span className="font-medium text-gray-300">Impact:</span>{' '}
              {impactDescription}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Route events to appropriate card component based on mediaType
function EventCard({ event, actorColor }: { event: GameEvent; actorColor?: string }) {
  // System events always use default card
  if (event.type === 'system') {
    return <DefaultEventCard event={event} actorColor={actorColor} />;
  }

  // Route based on mediaType
  switch (event.mediaType) {
    case 'tweet':
      return <TweetCard event={event} actorColor={actorColor} />;
    
    case 'article':
      return <NewsArticleCard event={event} actorColor={actorColor} />;
    
    case 'pressRelease':
    case 'statement':
      return <PressReleaseCard event={event} actorColor={actorColor} />;
    
    case 'tvBroadcast':
      // TV broadcasts use news article card with live indicator
      return <NewsArticleCard event={event} actorColor={actorColor} />;
    
    case 'leak':
      // Leaks can use news article card with credibility notice
      return <NewsArticleCard event={event} actorColor={actorColor} />;
    
    case 'speech':
      // Speeches use press release styling
      return <PressReleaseCard event={event} actorColor={actorColor} />;
    
    default:
      // Fallback: infer card type from event type
      if (event.type === 'news') {
        return <NewsArticleCard event={event} actorColor={actorColor} />;
      }
      // Default to the standard card
      return <DefaultEventCard event={event} actorColor={actorColor} />;
  }
}

export function EventFeed() {
  const { events, scenario, isProcessing } = useGameStore();
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [events]);

  const getActorColor = (actorId: string) => {
    return scenario?.actors.find(a => a.id === actorId)?.color;
  };

  return (
    <div ref={feedRef} className="h-full overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            actorColor={getActorColor(event.actorId)}
          />
        ))}
        
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-game-accent/20 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-game-accent border-t-transparent rounded-full animate-spin" />
              </div>
              <div>
                <p className="font-medium">Processing world events...</p>
                <p className="text-sm text-gray-500">The world is responding to your action</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
