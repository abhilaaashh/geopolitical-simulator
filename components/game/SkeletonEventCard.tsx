'use client';

import { motion } from 'framer-motion';

interface SkeletonEventCardProps {
  delay?: number;
  variant?: 'default' | 'tweet' | 'article';
}

/**
 * Animated skeleton placeholder for event cards during loading
 */
export function SkeletonEventCard({ delay = 0, variant = 'default' }: SkeletonEventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, delay }}
      className="glass-card p-3 sm:p-5 overflow-hidden"
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      
      {/* Header skeleton */}
      <div className="flex items-start gap-2 sm:gap-3 mb-3">
        {/* Avatar */}
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 animate-pulse" />
        
        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className="h-4 sm:h-5 bg-white/10 rounded-lg w-32 sm:w-40 mb-2 animate-pulse" />
          {/* Meta info */}
          <div className="h-3 bg-white/5 rounded w-24 sm:w-32 animate-pulse" />
        </div>
        
        {/* Timestamp skeleton */}
        <div className="h-3 bg-white/5 rounded w-12 animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-2 sm:pl-13">
        <div className="h-4 bg-white/10 rounded-lg w-full animate-pulse" />
        <div className="h-4 bg-white/10 rounded-lg w-5/6 animate-pulse" />
        <div className="h-4 bg-white/8 rounded-lg w-4/6 animate-pulse" />
        
        {variant === 'article' && (
          <>
            {/* Image placeholder for article variant */}
            <div className="h-32 sm:h-40 bg-white/5 rounded-lg mt-3 animate-pulse" />
          </>
        )}
        
        {variant === 'tweet' && (
          <>
            {/* Engagement metrics for tweet variant */}
            <div className="flex gap-4 mt-3 pt-3 border-t border-game-border/30">
              <div className="h-4 bg-white/5 rounded w-16 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-16 animate-pulse" />
              <div className="h-4 bg-white/5 rounded w-16 animate-pulse" />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Multiple skeleton cards with staggered animation
 */
export function SkeletonEventCards({ count = 3 }: { count?: number }) {
  // Vary the variants for visual interest
  const variants: Array<'default' | 'tweet' | 'article'> = ['tweet', 'default', 'article'];
  
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonEventCard 
          key={`skeleton-${i}`} 
          delay={i * 0.1} 
          variant={variants[i % variants.length]}
        />
      ))}
    </>
  );
}
