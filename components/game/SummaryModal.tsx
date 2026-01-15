'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { X, Loader2, ScrollText, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SummaryModal({ isOpen, onClose }: SummaryModalProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { scenario, playerActorId, currentTurn, events, worldState } = useGameStore();

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          >
            <div className="glass-card flex flex-col w-full h-full max-w-4xl max-h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-game-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-game-accent/20 flex items-center justify-center">
                    <ScrollText className="w-5 h-5 text-game-accent" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Game Summary</h2>
                    <p className="text-sm text-gray-400">
                      {currentTurn} turn{currentTurn !== 1 ? 's' : ''} • {events.length} event{events.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-game-border rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-game-accent" />
                    <p className="text-gray-400">Generating summary...</p>
                  </div>
                )}

                {error && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <p className="text-red-400 text-center">{error}</p>
                    <button
                      onClick={fetchSummary}
                      className="btn-primary flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                )}

                {summary && (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {summary.split('\n').map((paragraph, index) => {
                        if (!paragraph.trim()) return null;
                        
                        // Handle markdown bold syntax
                        const formattedParagraph = paragraph.replace(
                          /\*\*(.*?)\*\*/g,
                          '<strong class="text-white">$1</strong>'
                        );
                        
                        return (
                          <p 
                            key={index} 
                            className="mb-4"
                            dangerouslySetInnerHTML={{ __html: formattedParagraph }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              {summary && (
                <div className="p-4 border-t border-game-border flex justify-between items-center">
                  <button
                    onClick={fetchSummary}
                    disabled={isLoading}
                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={onClose}
                    className="btn-primary px-6"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
