'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Share, BadgeCheck, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import type { GameEvent, SocialPlatform, TweetReply, PublicQuote } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface TweetCardProps {
  event: GameEvent;
  actorColor?: string;
}

// Platform-specific styling
const PLATFORM_STYLES: Record<SocialPlatform, {
  bg: string;
  accent: string;
  name: string;
  logo: string;
}> = {
  twitter: {
    bg: 'bg-black',
    accent: 'text-blue-400',
    name: 'X',
    logo: '𝕏',
  },
  truth_social: {
    bg: 'bg-[#0a0a0a]',
    accent: 'text-[#5448ee]',
    name: 'Truth Social',
    logo: '𝕋',
  },
  weibo: {
    bg: 'bg-[#1a1a1a]',
    accent: 'text-[#ff8200]',
    name: 'Weibo',
    logo: '微',
  },
  telegram: {
    bg: 'bg-[#0e1621]',
    accent: 'text-[#2AABEE]',
    name: 'Telegram',
    logo: '✈️',
  },
  threads: {
    bg: 'bg-black',
    accent: 'text-white',
    name: 'Threads',
    logo: '@',
  },
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Reply component for public comments
function ReplyItem({ reply, accentColor }: { reply: TweetReply; accentColor: string }) {
  const avatarBg = reply.author.type === 'memer' ? '#fbbf24' : 
                   reply.author.type === 'influencer' ? '#8b5cf6' :
                   reply.author.type === 'celebrity' ? '#ec4899' :
                   reply.author.type === 'journalist' ? '#3b82f6' :
                   reply.author.type === 'expert' ? '#10b981' : '#6b7280';
  
  return (
    <div className="flex gap-2 sm:gap-3 py-2 sm:py-3">
      <div 
        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm flex-shrink-0"
        style={{ backgroundColor: `${avatarBg}30`, color: avatarBg }}
      >
        {reply.author.avatar || reply.author.displayName.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="font-semibold text-white text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{reply.author.displayName}</span>
          {reply.author.verified && (
            <BadgeCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
          )}
          <span className="text-gray-500 text-xs sm:text-sm hidden xs:inline">{reply.author.handle}</span>
          {reply.isPopular && (
            <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-400 px-1 sm:px-1.5 py-0.5 rounded ml-1">
              Top
            </span>
          )}
        </div>
        <p className="text-gray-200 text-xs sm:text-sm mt-1 whitespace-pre-wrap">{reply.content}</p>
        <div className="flex items-center gap-3 sm:gap-4 mt-2">
          <button className="flex items-center gap-1 text-gray-500 hover:text-blue-400 text-[10px] sm:text-xs">
            <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button className="flex items-center gap-1 text-gray-500 hover:text-green-400 text-[10px] sm:text-xs">
            <Repeat2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
          <button className="flex items-center gap-1 text-gray-500 hover:text-pink-400 text-[10px] sm:text-xs">
            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{formatNumber(reply.likes)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Quote tweet from public users
function PublicQuoteItem({ quote, styles }: { quote: PublicQuote; styles: { accent: string } }) {
  const avatarBg = quote.author.type === 'memer' ? '#fbbf24' : 
                   quote.author.type === 'influencer' ? '#8b5cf6' :
                   quote.author.type === 'celebrity' ? '#ec4899' : '#6b7280';
  
  return (
    <div className="border border-gray-700 rounded-xl p-3 bg-gray-900/30">
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
          style={{ backgroundColor: `${avatarBg}30`, color: avatarBg }}
        >
          {quote.author.avatar || quote.author.displayName.charAt(0)}
        </div>
        <span className="font-semibold text-white text-sm">{quote.author.displayName}</span>
        {quote.author.verified && (
          <BadgeCheck className="w-4 h-4 text-blue-400" />
        )}
        <span className="text-gray-500 text-sm">{quote.author.handle}</span>
      </div>
      <p className="text-gray-200 text-sm">{quote.content}</p>
      <div className="flex items-center gap-3 mt-2 text-gray-500 text-xs">
        <span className="flex items-center gap-1">
          <Repeat2 className="w-3 h-3" />
          {formatNumber(quote.retweets)}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {formatNumber(quote.likes)}
        </span>
      </div>
    </div>
  );
}

// News outlet handles for special styling
const NEWS_HANDLES = ['@CNN', '@BBCBreaking', '@Reuters', '@AP', '@FoxNews', '@MSNBC', '@nytimes', '@washingtonpost', '@RT_com', '@AJEnglish', '@CGTN'];

// Check if handle is a news outlet
function isNewsAccount(handle: string): boolean {
  return NEWS_HANDLES.some(nh => handle.toLowerCase().includes(nh.toLowerCase().replace('@', '')));
}

export function TweetCard({ event, actorColor }: TweetCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [showQuotes, setShowQuotes] = useState(false);
  
  const platform = event.media?.platform || 'twitter';
  const styles = PLATFORM_STYLES[platform];
  const handle = event.media?.handle || `@${event.actorName.toLowerCase().replace(/\s+/g, '')}`;
  const verified = event.media?.verified ?? true;
  const likes = event.media?.likes ?? Math.floor(Math.random() * 50000) + 1000;
  const retweets = event.media?.retweets ?? Math.floor(Math.random() * 20000) + 500;
  const replies = event.media?.replies ?? Math.floor(Math.random() * 5000) + 100;
  
  const publicReplies = event.media?.publicReplies || [];
  const publicQuotes = event.media?.publicQuotes || [];
  const hasReplies = publicReplies.length > 0;
  const hasQuotes = publicQuotes.length > 0;

  const isPlayer = event.isPlayerAction;
  const isNews = event.actorId === 'news' || isNewsAccount(handle) || event.type === 'news';
  const isPublicUser = event.actorId === 'public';
  const isBreaking = event.content.includes('BREAKING') || event.content.includes('🚨');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${styles.bg} rounded-xl sm:rounded-2xl border border-gray-800 overflow-hidden ${
        isPlayer ? 'ring-2 ring-game-accent/50' : ''
      } ${isBreaking ? 'ring-1 ring-red-500/30' : ''}`}
    >
      {/* Breaking news banner for news accounts */}
      {isBreaking && (
        <div className="bg-red-600 px-3 sm:px-4 py-1 sm:py-1.5 flex items-center gap-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            Breaking News
          </span>
        </div>
      )}

      {/* Platform header */}
      <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-800 flex items-center justify-between">
        <span className={`text-base sm:text-lg font-bold ${styles.accent}`}>{styles.logo}</span>
        <div className="flex items-center gap-2">
          {isNews && !isBreaking && (
            <span className="text-[10px] sm:text-xs bg-blue-500/20 text-blue-400 px-1.5 sm:px-2 py-0.5 rounded-full">
              News
            </span>
          )}
          <span className="text-[10px] sm:text-xs text-gray-500">{styles.name}</span>
        </div>
      </div>

      {/* Tweet content */}
      <div className="p-3 sm:p-4">
        {/* Author row */}
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Avatar - different styles for different account types */}
          <div
            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-xl font-bold flex-shrink-0 ${
              isNews ? 'bg-red-500/20' : 
              isPublicUser ? 'bg-gray-700' : ''
            }`}
            style={{ 
              backgroundColor: isNews ? undefined : 
                              isPublicUser ? undefined :
                              actorColor ? `${actorColor}30` : '#374151' 
            }}
          >
            {isNews ? '📰' : event.actorName.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name and handle */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-bold text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{event.actorName}</span>
              {verified && (
                <BadgeCheck className={`w-4 h-4 sm:w-5 sm:h-5 ${isNews ? 'text-yellow-500' : styles.accent} flex-shrink-0`} />
              )}
              {isPlayer && (
                <span className="text-[10px] sm:text-xs bg-game-accent/20 text-game-accent px-1.5 sm:px-2 py-0.5 rounded-full ml-1">
                  You
                </span>
              )}
              {isPublicUser && (
                <span className="text-[10px] sm:text-xs bg-gray-700 text-gray-400 px-1.5 sm:px-2 py-0.5 rounded-full ml-1">
                  Public
                </span>
              )}
            </div>
            <span className="text-gray-500 text-xs sm:text-sm">{handle}</span>
          </div>

          <button className="text-gray-500 hover:text-gray-400 p-1 hidden sm:block">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Tweet text */}
        <div className="mt-2 sm:mt-3 text-white text-[13px] sm:text-[15px] leading-relaxed whitespace-pre-wrap">
          {event.content}
        </div>

        {/* Quote tweet if present */}
        {event.media?.quoteTweet && (
          <div className="mt-2 sm:mt-3 border border-gray-700 rounded-lg sm:rounded-xl p-2 sm:p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-xs sm:text-sm text-white truncate">
                {event.media.quoteTweet.authorName}
              </span>
              <span className="text-gray-500 text-xs sm:text-sm hidden xs:inline">
                {event.media.quoteTweet.authorHandle}
              </span>
            </div>
            <p className="text-gray-300 text-xs sm:text-sm">{event.media.quoteTweet.content}</p>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-2 sm:mt-3 text-gray-500 text-[10px] sm:text-sm">
          {formatTime(event.timestamp)} · {styles.name}
        </div>

        {/* Engagement stats */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-800 flex items-center gap-1 text-[11px] sm:text-sm text-gray-500">
          <span className="font-bold text-white">{formatNumber(retweets)}</span>
          <span className="hidden xs:inline">Reposts</span>
          <span className="mx-1 sm:mx-2">·</span>
          <span className="font-bold text-white">{formatNumber(likes)}</span>
          <span className="hidden xs:inline">Likes</span>
        </div>

        {/* Action buttons */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-800 flex items-center justify-around">
          <button 
            onClick={() => hasReplies && setShowReplies(!showReplies)}
            className={`flex items-center gap-1 sm:gap-2 transition-colors group ${
              hasReplies ? 'text-blue-400 hover:text-blue-300' : 'text-gray-500 hover:text-blue-400'
            }`}
          >
            <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-blue-400/10">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm">{formatNumber(replies)}</span>
          </button>
          
          <button 
            onClick={() => hasQuotes && setShowQuotes(!showQuotes)}
            className={`flex items-center gap-1 sm:gap-2 transition-colors group ${
              hasQuotes ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-green-400'
            }`}
          >
            <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-green-400/10">
              <Repeat2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm">{formatNumber(retweets)}</span>
          </button>
          
          <button className="flex items-center gap-1 sm:gap-2 text-gray-500 hover:text-pink-400 transition-colors group">
            <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-pink-400/10">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm">{formatNumber(likes)}</span>
          </button>
          
          <button className="text-gray-500 hover:text-blue-400 transition-colors group">
            <div className="p-1.5 sm:p-2 rounded-full group-hover:bg-blue-400/10">
              <Share className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </button>
        </div>

        {/* Public Replies Section */}
        <AnimatePresence>
          {showReplies && hasReplies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-800"
            >
              <button 
                onClick={() => setShowReplies(false)}
                className="flex items-center gap-2 text-gray-500 text-sm mb-2 hover:text-gray-400"
              >
                <ChevronUp className="w-4 h-4" />
                Hide replies
              </button>
              <div className="divide-y divide-gray-800/50">
                {publicReplies.map((reply, idx) => (
                  <ReplyItem key={reply.id || idx} reply={reply} accentColor={styles.accent} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show Replies Button when collapsed */}
        {!showReplies && hasReplies && (
          <button
            onClick={() => setShowReplies(true)}
            className="mt-3 pt-3 border-t border-gray-800 w-full flex items-center justify-center gap-2 text-blue-400 text-sm hover:text-blue-300"
          >
            <ChevronDown className="w-4 h-4" />
            Show {publicReplies.length} {publicReplies.length === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Public Quotes Section */}
        <AnimatePresence>
          {showQuotes && hasQuotes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-800"
            >
              <button 
                onClick={() => setShowQuotes(false)}
                className="flex items-center gap-2 text-gray-500 text-sm mb-2 hover:text-gray-400"
              >
                <ChevronUp className="w-4 h-4" />
                Hide quotes
              </button>
              <div className="space-y-2">
                {publicQuotes.map((quote, idx) => (
                  <PublicQuoteItem key={quote.id || idx} quote={quote} styles={styles} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show Quotes Button when collapsed */}
        {!showQuotes && hasQuotes && (
          <button
            onClick={() => setShowQuotes(true)}
            className="mt-3 pt-3 border-t border-gray-800 w-full flex items-center justify-center gap-2 text-green-400 text-sm hover:text-green-300"
          >
            <ChevronDown className="w-4 h-4" />
            Show {publicQuotes.length} quote{publicQuotes.length === 1 ? '' : 's'}
          </button>
        )}
      </div>

      {/* Impact section if present */}
      {event.impact && typeof event.impact.description === 'string' && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="p-2 sm:p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <p className="text-xs sm:text-sm text-gray-400">
              <span className="font-medium text-gray-300">Impact:</span>{' '}
              {event.impact.description}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
