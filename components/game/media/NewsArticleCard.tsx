'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, ExternalLink, AlertCircle, TrendingUp, ImageIcon } from 'lucide-react';
import type { GameEvent, NewsBias } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface NewsArticleCardProps {
  event: GameEvent;
  actorColor?: string;
}

// News outlet styling and branding
const OUTLET_STYLES: Record<string, {
  bg: string;
  accent: string;
  logo: string;
  bias: NewsBias;
}> = {
  'CNN': {
    bg: 'bg-gradient-to-r from-red-900/20 to-red-800/10',
    accent: 'text-red-500',
    logo: 'CNN',
    bias: 'left',
  },
  'Fox News': {
    bg: 'bg-gradient-to-r from-blue-900/20 to-blue-800/10',
    accent: 'text-blue-500',
    logo: 'FOX',
    bias: 'right',
  },
  'BBC': {
    bg: 'bg-gradient-to-r from-gray-800/30 to-gray-700/20',
    accent: 'text-white',
    logo: 'BBC',
    bias: 'center',
  },
  'RT': {
    bg: 'bg-gradient-to-r from-green-900/20 to-green-800/10',
    accent: 'text-green-500',
    logo: 'RT',
    bias: 'state',
  },
  'Al Jazeera': {
    bg: 'bg-gradient-to-r from-amber-900/20 to-amber-800/10',
    accent: 'text-amber-500',
    logo: 'AJ',
    bias: 'center',
  },
  'Reuters': {
    bg: 'bg-gradient-to-r from-orange-900/20 to-orange-800/10',
    accent: 'text-orange-500',
    logo: 'R',
    bias: 'center',
  },
  'AP News': {
    bg: 'bg-gradient-to-r from-blue-900/20 to-blue-800/10',
    accent: 'text-blue-400',
    logo: 'AP',
    bias: 'center',
  },
  'MSNBC': {
    bg: 'bg-gradient-to-r from-purple-900/20 to-purple-800/10',
    accent: 'text-purple-500',
    logo: 'MSNBC',
    bias: 'left',
  },
  'New York Times': {
    bg: 'bg-gradient-to-r from-gray-900/30 to-gray-800/20',
    accent: 'text-gray-300',
    logo: 'NYT',
    bias: 'left',
  },
  'CGTN': {
    bg: 'bg-gradient-to-r from-red-900/20 to-red-800/10',
    accent: 'text-red-400',
    logo: 'CGTN',
    bias: 'state',
  },
  'default': {
    bg: 'bg-gradient-to-r from-gray-900/30 to-gray-800/20',
    accent: 'text-gray-400',
    logo: 'NEWS',
    bias: 'center',
  },
};

const BIAS_LABELS: Record<NewsBias, { label: string; color: string }> = {
  left: { label: 'Left-leaning', color: 'text-blue-400' },
  center: { label: 'Neutral', color: 'text-gray-400' },
  right: { label: 'Right-leaning', color: 'text-red-400' },
  state: { label: 'State Media', color: 'text-yellow-400' },
};

export function NewsArticleCard({ event, actorColor }: NewsArticleCardProps) {
  const outlet = event.media?.outlet || 'Breaking News';
  const outletStyle = OUTLET_STYLES[outlet] || OUTLET_STYLES['default'];
  const bias = event.media?.bias || outletStyle.bias;
  const biasInfo = BIAS_LABELS[bias];
  const headline = event.media?.headline || event.content.split('.')[0];
  const byline = event.media?.byline || 'Staff Reporter';
  const isBreaking = event.sentiment === 'escalation' || event.type === 'news';
  const imageDesc = event.media?.imageDescription;

  // Image state management
  const [imageUrl, setImageUrl] = useState<string | null>(event.media?.imageUrl || null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch image from Unsplash when imageDescription exists
  useEffect(() => {
    if (!imageDesc || imageUrl || imageError) return;

    const fetchImage = async () => {
      setIsLoadingImage(true);
      try {
        const response = await fetch(`/api/image/search?query=${encodeURIComponent(imageDesc)}`);
        const data = await response.json();
        
        if (data.url) {
          setImageUrl(data.url);
        } else {
          setImageError(true);
        }
      } catch (error) {
        console.error('Failed to fetch image:', error);
        setImageError(true);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchImage();
  }, [imageDesc, imageUrl, imageError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`${outletStyle.bg} rounded-2xl border border-gray-800 overflow-hidden`}
    >
      {/* Breaking news banner */}
      {isBreaking && (
        <div className="bg-red-600 px-4 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-sm font-bold uppercase tracking-wider">
            Breaking News
          </span>
        </div>
      )}

      {/* Outlet header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${outletStyle.accent}`}>
            {outletStyle.logo}
          </span>
          <div>
            <span className="text-white font-semibold">{outlet}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className={biasInfo.color}>{biasInfo.label}</span>
            </div>
          </div>
        </div>
        <button className="text-gray-500 hover:text-white transition-colors">
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Image section */}
      {imageDesc && (
        <div className="relative h-48 bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          {/* Loading state */}
          {isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
                <span className="text-gray-500 text-xs">Loading image...</span>
              </div>
            </div>
          )}
          
          {/* Actual image */}
          {imageUrl && !isLoadingImage && (
            <img
              src={imageUrl}
              alt={imageDesc}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => {
                setImageError(true);
                setImageUrl(null);
              }}
            />
          )}
          
          {/* Fallback placeholder */}
          {!imageUrl && !isLoadingImage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 px-4">
                <ImageIcon className="w-8 h-8 text-gray-600" />
                <span className="text-gray-500 text-sm italic text-center">{imageDesc}</span>
              </div>
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          
          {/* Impact description overlay */}
          {event.impact && typeof event.impact.description === 'string' && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">{event.impact.description}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Article content */}
      <div className="p-4">
        {/* Headline */}
        <h3 className="text-xl font-bold text-white leading-tight mb-2">
          {headline}
        </h3>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          <span>By {byline}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{formatTime(event.timestamp)}</span>
          </div>
        </div>

        {/* Article excerpt */}
        <p className="text-gray-300 leading-relaxed">
          {event.content}
        </p>

        {/* Related actors */}
        {event.impact?.affectedActors && Array.isArray(event.impact.affectedActors) && event.impact.affectedActors.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Related:</span>
            {event.impact.affectedActors.slice(0, 3).map((actorId, idx) => (
              <span
                key={typeof actorId === 'string' ? actorId : idx}
                className="text-xs px-2 py-1 bg-gray-800 rounded-full text-gray-300"
              >
                {typeof actorId === 'string' ? actorId : String(actorId)}
              </span>
            ))}
          </div>
        )}

        {/* Read more button */}
        <button className={`mt-4 ${outletStyle.accent} text-sm font-medium flex items-center gap-1 hover:underline`}>
          Read full coverage
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Credibility notice for leaks/unverified */}
      {event.media?.credibility && event.media.credibility !== 'confirmed' && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">
              {event.media.credibility === 'unverified' 
                ? 'This report has not been independently verified.'
                : 'Some details in this report are still being confirmed.'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
