'use client';

import { useRef, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { formatTime } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Hash, TrendingUp, Search, Settings, Home, Bell, Mail, Bookmark } from 'lucide-react';
import type { GameEvent, TrendingTopic } from '@/lib/types';
import { TweetCard, NewsArticleCard, PressReleaseCard } from './media';

// Sidebar navigation item
function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className={`flex items-center gap-4 px-4 py-3 rounded-full w-full transition-colors ${
      active ? 'bg-gray-800 font-bold' : 'hover:bg-gray-900'
    }`}>
      {icon}
      <span className="text-lg">{label}</span>
    </button>
  );
}

// Trending topic item
function TrendingItem({ topic, index }: { topic: TrendingTopic; index: number }) {
  const sentimentColor = topic.sentiment === 'positive' ? 'text-green-400' :
                        topic.sentiment === 'negative' ? 'text-red-400' : 'text-gray-400';
  
  return (
    <div className="px-4 py-3 hover:bg-gray-900/50 cursor-pointer transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500">{index + 1} · Trending</p>
          <p className="font-bold text-white">{topic.hashtag}</p>
          <p className="text-xs text-gray-500">{Math.floor(topic.volume * 100)}K posts</p>
        </div>
        <TrendingUp className={`w-4 h-4 ${sentimentColor}`} />
      </div>
    </div>
  );
}

// Default trending topics when none exist
const DEFAULT_TRENDING: TrendingTopic[] = [
  { hashtag: '#WorldNews', sentiment: 'mixed', volume: 85, associatedActors: [] },
  { hashtag: '#Breaking', sentiment: 'negative', volume: 75, associatedActors: [] },
  { hashtag: '#Diplomacy', sentiment: 'positive', volume: 60, associatedActors: [] },
];

// Render event based on type - prioritizing Twitter-style timeline
function SocialEventCard({ event, actorColor }: { event: GameEvent; actorColor?: string }) {
  // System events as centered announcements (timeline dividers)
  if (event.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-2 sm:mx-4 my-2 sm:my-4"
      >
        <div className="text-center py-3 sm:py-4 border-y border-gray-800">
          <p className="text-gray-400 text-xs sm:text-sm">{event.content}</p>
        </div>
      </motion.div>
    );
  }

  // Route based on mediaType - prefer tweets for clean timeline feel
  switch (event.mediaType) {
    case 'tweet':
      return (
        <div className="border-b border-gray-800">
          <TweetCard event={event} actorColor={actorColor} />
        </div>
      );
    
    case 'article':
      // Only show as article card for long-form content, otherwise convert to tweet style
      if (event.media?.headline && event.content.length > 200) {
        return (
          <div className="border-b border-gray-800 p-2 sm:p-4">
            <NewsArticleCard event={event} actorColor={actorColor} />
          </div>
        );
      }
      // Short news items render as tweets
      return (
        <div className="border-b border-gray-800">
          <TweetCard event={event} actorColor={actorColor} />
        </div>
      );
    
    case 'tvBroadcast':
    case 'leak':
      // TV broadcasts and leaks as article cards (they have visual elements)
      return (
        <div className="border-b border-gray-800 p-2 sm:p-4">
          <NewsArticleCard event={event} actorColor={actorColor} />
        </div>
      );
    
    case 'pressRelease':
    case 'statement':
    case 'speech':
      // Official statements keep their formal styling
      return (
        <div className="border-b border-gray-800 p-2 sm:p-4">
          <PressReleaseCard event={event} actorColor={actorColor} />
        </div>
      );
    
    default:
      // Default to tweet-style for clean timeline feel
      return (
        <div className="border-b border-gray-800">
          <TweetCard event={event} actorColor={actorColor} />
        </div>
      );
  }
}

export function SocialView() {
  const { events, scenario, worldState, isProcessing } = useGameStore();
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

  const trending = worldState.publicOpinion?.trending || DEFAULT_TRENDING;

  return (
    <div className="h-full flex bg-black">
      {/* Left Sidebar - Navigation (hidden on mobile and tablet) */}
      <div className="hidden lg:flex flex-col w-64 border-r border-gray-800 p-2">
        <div className="p-4">
          <span className="text-2xl font-bold">𝕏</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavItem icon={<Home className="w-6 h-6" />} label="Home" active />
          <NavItem icon={<Search className="w-6 h-6" />} label="Explore" />
          <NavItem icon={<Bell className="w-6 h-6" />} label="Notifications" />
          <NavItem icon={<Mail className="w-6 h-6" />} label="Messages" />
          <NavItem icon={<Bookmark className="w-6 h-6" />} label="Bookmarks" />
          <NavItem icon={<Settings className="w-6 h-6" />} label="Settings" />
        </nav>

        {/* Player info */}
        {scenario && (
          <div className="p-4 border-t border-gray-800">
            <p className="text-xs text-gray-500">Playing as</p>
            <p className="font-bold">{scenario.actors.find(a => a.isPlayer)?.name}</p>
          </div>
        )}
      </div>

      {/* Main Feed - full width on mobile */}
      <div className="flex-1 flex flex-col min-w-0 xl:border-r border-gray-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-gray-800 px-3 sm:px-4 py-2 sm:py-3">
          <h1 className="text-lg sm:text-xl font-bold">For You</h1>
          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{scenario?.title}</p>
        </div>

        {/* Feed */}
        <div ref={feedRef} className="flex-1 overflow-y-auto">
          {events.map((event) => (
            <SocialEventCard
              key={event.id}
              event={event}
              actorColor={getActorColor(event.actorId)}
            />
          ))}

          {/* Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 sm:p-4 border-b border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div>
                  <p className="text-gray-400 text-xs sm:text-sm">Loading new posts...</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Trending (hidden on mobile/tablet) */}
      <div className="hidden xl:block w-80 p-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-gray-900 border border-gray-800 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* What's happening */}
        <div className="bg-gray-900/50 rounded-2xl overflow-hidden mb-4">
          <h2 className="font-bold text-xl px-4 py-3">What&apos;s happening</h2>
          
          {/* Scenario context */}
          <div className="px-4 py-3 border-b border-gray-800">
            <p className="text-xs text-blue-400">LIVE</p>
            <p className="font-bold">{scenario?.title}</p>
            <p className="text-xs text-gray-500">
              {typeof worldState.globalSentiment === 'string' ? worldState.globalSentiment : 'Developing'}
            </p>
          </div>

          {/* Trending topics */}
          {trending.map((topic, index) => (
            <TrendingItem key={topic.hashtag} topic={topic} index={index} />
          ))}

          <button className="w-full px-4 py-3 text-left text-blue-500 hover:bg-gray-900/50">
            Show more
          </button>
        </div>

        {/* World State Summary */}
        <div className="bg-gray-900/50 rounded-2xl p-4">
          <h2 className="font-bold mb-3">World State</h2>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Tension Level</span>
                <span className={worldState.tensionLevel > 70 ? 'text-red-400' : 
                               worldState.tensionLevel > 40 ? 'text-yellow-400' : 'text-green-400'}>
                  {worldState.tensionLevel}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    worldState.tensionLevel > 70 ? 'bg-red-500' :
                    worldState.tensionLevel > 40 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${worldState.tensionLevel}%` }}
                />
              </div>
            </div>

            <div className="text-sm">
              <span className="text-gray-400">Diplomatic Status:</span>
              <p className="text-white">
                {typeof worldState.diplomaticStatus === 'string' ? worldState.diplomaticStatus : 'Active'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
