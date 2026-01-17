'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store';
import { formatTime, getSentimentColor } from '@/lib/utils';
import { 
  User, Globe, Radio, AlertTriangle, Zap, 
  TrendingUp, TrendingDown, ChevronRight, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameEvent } from '@/lib/types';
import { TweetCard, NewsArticleCard, PressReleaseCard } from './media';
import { SkeletonEventCards } from './SkeletonEventCard';

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
      className={`glass-card p-3 sm:p-5 ${isPlayer ? 'border-game-accent/50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: isSystem 
                ? 'rgba(99, 102, 241, 0.2)' 
                : actorColor ? `${actorColor}20` : 'rgba(156, 163, 175, 0.2)'
            }}
          >
            {isSystem ? (
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-game-accent" />
            ) : (
              <User className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: actorColor }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm sm:text-base truncate">{actorName}</h4>
              {isPlayer && (
                <span className="badge-info text-[10px] sm:text-xs flex-shrink-0">You</span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
              <span className="flex items-center gap-1">
                {TYPE_ICONS[eventType as keyof typeof TYPE_ICONS] || <Zap className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="capitalize hidden xs:inline">{eventType}</span>
              </span>
              <span>•</span>
              <span>Turn {event.turn ?? 1}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {event.sentiment && SENTIMENT_ICONS[event.sentiment as keyof typeof SENTIMENT_ICONS]}
          <span className="text-[10px] sm:text-xs text-gray-500 hidden xs:inline">{formatTime(event.timestamp)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="sm:pl-13">
        <p className="text-gray-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{content}</p>
        
        {/* Impact section */}
        {event.impact && impactDescription && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-game-bg/50 rounded-lg border border-game-border/50">
            <p className="text-xs sm:text-sm text-gray-400">
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

// Wrapper for staggered event entry animations
function StaggeredEventCard({ 
  event, 
  actorColor, 
  delay = 0 
}: { 
  event: GameEvent; 
  actorColor?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth entry
      }}
    >
      <EventCard event={event} actorColor={actorColor} />
    </motion.div>
  );
}

export function EventFeed() {
  const { events, scenario, isProcessing, playerActorId } = useGameStore();
  const feedRef = useRef<HTMLDivElement>(null);
  const lastPlayerActionIndexRef = useRef<number>(-1);
  const [newUpdatesCount, setNewUpdatesCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const seenEventsCountRef = useRef<number>(0);
  
  // Track which events are "new" (just added after processing completed)
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const prevProcessingRef = useRef(isProcessing);
  const prevEventsLengthRef = useRef(events.length);

  // Find the latest player action index
  const latestPlayerActionIndex = events.findLastIndex(e => e.isPlayerAction || e.actorId === playerActorId);

  // Check if user is scrolled to the bottom
  const checkIfAtBottom = useCallback(() => {
    if (!feedRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    if (atBottom) {
      setNewUpdatesCount(0);
      seenEventsCountRef.current = events.length;
    }
  }, [checkIfAtBottom, events.length]);

  // Track when processing completes and mark new events for staggered animation
  useEffect(() => {
    const wasProcessing = prevProcessingRef.current;
    const prevLength = prevEventsLengthRef.current;
    
    // When processing just finished and we have new events
    if (wasProcessing && !isProcessing && events.length > prevLength) {
      const newEvents = events.slice(prevLength);
      const ids = new Set(newEvents.map(e => e.id));
      setNewEventIds(ids);
      
      // Clear the "new" status after animations complete
      const timeout = setTimeout(() => {
        setNewEventIds(new Set());
      }, 500 + newEvents.length * 150); // Base delay + stagger time
      
      return () => clearTimeout(timeout);
    }
    
    prevProcessingRef.current = isProcessing;
    prevEventsLengthRef.current = events.length;
  }, [isProcessing, events]);

  // Track new events and update count
  useEffect(() => {
    // If a new player action was added, scroll to it
    if (latestPlayerActionIndex > lastPlayerActionIndexRef.current && latestPlayerActionIndex !== -1) {
      lastPlayerActionIndexRef.current = latestPlayerActionIndex;
      seenEventsCountRef.current = events.length;
      setNewUpdatesCount(0);
      
      // Scroll to bottom to show the player's action
      if (feedRef.current) {
        feedRef.current.scrollTop = feedRef.current.scrollHeight;
      }
      return;
    }

    // If there are new events after the last seen count
    if (events.length > seenEventsCountRef.current) {
      const newCount = events.length - seenEventsCountRef.current;
      
      if (checkIfAtBottom()) {
        // If at bottom, mark as seen and scroll
        seenEventsCountRef.current = events.length;
        setNewUpdatesCount(0);
        if (feedRef.current) {
          feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
      } else {
        // If not at bottom, show the new updates indicator
        setNewUpdatesCount(newCount);
      }
    }
  }, [events, latestPlayerActionIndex, checkIfAtBottom]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setNewUpdatesCount(0);
      seenEventsCountRef.current = events.length;
    }
  }, [events.length]);

  const getActorColor = (actorId: string) => {
    return scenario?.actors.find(a => a.id === actorId)?.color;
  };

  return (
    <div className="relative h-full">
      <div 
        ref={feedRef} 
        className="h-full overflow-y-auto p-3 sm:p-6"
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
          {events.map((event, index) => {
            const isNewEvent = newEventIds.has(event.id);
            // Calculate stagger index relative to other new events
            const newEventsList = events.filter(e => newEventIds.has(e.id));
            const staggerIndex = newEventsList.findIndex(e => e.id === event.id);
            const delay = isNewEvent ? staggerIndex * 0.12 : 0;
            
            return isNewEvent ? (
              <StaggeredEventCard
                key={event.id}
                event={event}
                actorColor={getActorColor(event.actorId)}
                delay={delay}
              />
            ) : (
              <EventCard 
                key={event.id} 
                event={event} 
                actorColor={getActorColor(event.actorId)}
              />
            );
          })}
          
          {/* Skeleton cards during processing */}
          <AnimatePresence>
            {isProcessing && <SkeletonEventCards count={3} />}
          </AnimatePresence>
        </div>
      </div>

      {/* New updates indicator */}
      <AnimatePresence>
        {newUpdatesCount > 0 && !isAtBottom && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-game-accent hover:bg-game-accent/90 text-white rounded-full shadow-lg shadow-game-accent/25 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            <span className="text-sm font-medium">
              {newUpdatesCount} new update{newUpdatesCount > 1 ? 's' : ''}
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
