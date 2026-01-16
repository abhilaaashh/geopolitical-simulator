'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { X, Loader2, AlertCircle, RefreshCw, Copy, Check, Share2, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createShareLink, getShareToken } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BulletinSummary {
  headline: string;
  subheadline: string;
  stats: {
    turns: number;
    tensionStart: number;
    tensionEnd: number;
    tensionDelta: string;
    outcome: string;
  };
  highlights: string[];
  verdict: string;
}

export function SummaryModal({ isOpen, onClose }: SummaryModalProps) {
  const [summary, setSummary] = useState<BulletinSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const { scenario, playerActorId, currentTurn, events, worldState, cloudSessionId } = useGameStore();
  const { user } = useAuth();

  const fetchSummary = async () => {
    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: {
            scenario,
            playerActorId,
            currentTurn,
            events,
            worldState,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for existing share link
  useEffect(() => {
    if (isOpen && cloudSessionId && user) {
      getShareToken(cloudSessionId).then(token => {
        if (token) {
          setShareUrl(`${window.location.origin}/shared/${token}`);
        }
      }).catch(console.error);
    }
  }, [isOpen, cloudSessionId, user]);

  // Fetch summary when modal opens
  useEffect(() => {
    if (isOpen && !summary && !isLoading) {
      fetchSummary();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSummary(null);
      setError(null);
      setCopied(false);
      setShareUrl(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Format summary as copyable text
  const formatForCopy = (bulletin: BulletinSummary): string => {
    const lines = [
      `🔥 ${bulletin.headline}`,
      bulletin.subheadline,
      '',
      `📊 ${bulletin.stats.turns} turns | Tension: ${bulletin.stats.tensionStart}% → ${bulletin.stats.tensionEnd}% (${bulletin.stats.tensionDelta}) | ${bulletin.stats.outcome}`,
      '',
      'THE HIGHLIGHTS:',
      ...bulletin.highlights.map(h => `• ${h}`),
      '',
      `💀 ${bulletin.verdict}`,
    ];
    
    if (shareUrl) {
      lines.push('', `🔗 ${shareUrl}`);
    }
    
    return lines.join('\n');
  };

  const handleCopy = async () => {
    if (!summary) return;
    
    try {
      await navigator.clipboard.writeText(formatForCopy(summary));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (!cloudSessionId || !user) return;
    
    setIsSharing(true);
    try {
      const token = await createShareLink(cloudSessionId);
      const url = `${window.location.origin}/shared/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to create share link:', err);
    } finally {
      setIsSharing(false);
    }
  };

  // Get tension trend icon
  const getTensionIcon = () => {
    if (!summary) return null;
    const delta = summary.stats.tensionEnd - summary.stats.tensionStart;
    if (delta > 10) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (delta < -10) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-yellow-400" />;
  };

  // Get tension color
  const getTensionColor = (value: number) => {
    if (value >= 70) return 'text-red-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-black border border-white/10 shadow-2xl">
              {/* Decorative top gradient */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Content */}
              <div className="overflow-y-auto max-h-[90vh] p-6 md:p-8">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                      <Zap className="w-4 h-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    <p className="text-gray-400 text-sm">Generating your viral recap...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-400" />
                    </div>
                    <p className="text-red-400 text-center">{error}</p>
                    <button
                      onClick={fetchSummary}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                )}

                {summary && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Headline */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-orange-500 text-xs font-semibold tracking-widest uppercase">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        Breaking
                      </div>
                      <h1 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">
                        🔥 {summary.headline}
                      </h1>
                      <p className="text-gray-400 text-base md:text-lg">
                        {summary.subheadline}
                      </p>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex flex-wrap items-center gap-3 py-4 border-y border-white/10">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm">
                        <span className="text-gray-400">Turns:</span>
                        <span className="font-bold text-white">{summary.stats.turns}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full text-sm">
                        {getTensionIcon()}
                        <span className="text-gray-400">Tension:</span>
                        <span className={`font-bold ${getTensionColor(summary.stats.tensionStart)}`}>
                          {summary.stats.tensionStart}%
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className={`font-bold ${getTensionColor(summary.stats.tensionEnd)}`}>
                          {summary.stats.tensionEnd}%
                        </span>
                      </div>
                      <div className="px-3 py-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full text-sm font-semibold text-orange-300">
                        {summary.stats.outcome}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-3">
                      <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">
                        The Highlights
                      </h2>
                      <ul className="space-y-3">
                        {summary.highlights.map((highlight, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 text-gray-200"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs font-bold text-white mt-0.5">
                              {index + 1}
                            </span>
                            <span className="leading-relaxed">{highlight}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Verdict */}
                    <div className="p-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-2 mb-2 text-xs font-semibold tracking-widest uppercase text-gray-500">
                        <span>💀</span>
                        <span>Verdict</span>
                      </div>
                      <p className="text-lg font-medium text-white italic">
                        "{summary.verdict}"
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                      <button
                        onClick={handleCopy}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy to Clipboard
                          </>
                        )}
                      </button>
                      
                      {user && cloudSessionId && (
                        <button
                          onClick={handleShare}
                          disabled={isSharing}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-colors disabled:opacity-50"
                        >
                          {isSharing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Share2 className="w-4 h-4" />
                              {shareUrl ? 'Copy Share Link' : 'Create Share Link'}
                            </>
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={fetchSummary}
                        disabled={isLoading}
                        className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Share URL display */}
                    {shareUrl && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-center"
                      >
                        <p className="text-xs text-gray-500 break-all">
                          🔗 {shareUrl}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
