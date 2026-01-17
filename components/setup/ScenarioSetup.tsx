'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Search, Globe, Loader2, Sparkles, Users, Play, Star, Link2, AlertCircle, RefreshCw, Check, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Scenario } from '@/lib/types';

// Discovery progress state
interface DiscoveryProgressState {
  step: string;
  stepIndex: number;
  message: string;
  progress: number;
}

// Discovery step configuration
const DISCOVERY_STEPS = [
  { id: 'extracting', label: 'Extracting' },
  { id: 'searching', label: 'Searching' },
  { id: 'generating', label: 'Building' },
];

/**
 * Inline Step Progress Indicator - compact version for below the button
 */
function DiscoveryProgressInline({ progressState }: { progressState: DiscoveryProgressState }) {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-4"
    >
      {/* Progress bar */}
      <div className="h-1 bg-game-border/50 rounded-full overflow-hidden mb-3">
        <motion.div 
          className="h-full bg-gradient-to-r from-game-accent to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressState.progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      
      {/* Steps */}
      <div className="flex items-center justify-between gap-2">
        {DISCOVERY_STEPS.map((step, index) => {
          const isComplete = index < progressState.stepIndex;
          const isCurrent = step.id === progressState.step || 
                           (progressState.step === 'searched' && step.id === 'searching') ||
                           (progressState.step === 'extracted' && step.id === 'extracting');
          
          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex items-center gap-1.5">
                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                  ${isComplete ? 'bg-green-500/20 text-green-400' : ''}
                  ${isCurrent ? 'bg-game-accent/30 text-game-accent ring-1 ring-game-accent/50' : ''}
                  ${!isComplete && !isCurrent ? 'bg-game-border/30 text-gray-600' : ''}
                `}>
                  {isComplete ? (
                    <Check className="w-3 h-3" />
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <Circle className="w-2 h-2" />
                  )}
                </div>
                <span className={`
                  text-xs transition-colors duration-300 truncate
                  ${isComplete ? 'text-green-400' : ''}
                  ${isCurrent ? 'text-game-accent font-medium' : ''}
                  ${!isComplete && !isCurrent ? 'text-gray-600' : ''}
                `}>
                  {step.label}
                </span>
              </div>
              
              {index < DISCOVERY_STEPS.length - 1 && (
                <div className={`
                  flex-1 h-px mx-2 transition-colors duration-300
                  ${isComplete ? 'bg-green-500/50' : 'bg-game-border/30'}
                `} />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Current message */}
      <p className="text-xs text-game-accent/80 mt-2 text-center">{progressState.message}</p>
    </motion.div>
  );
}

// Import preset scenarios
import presets from '@/resources/scenarios/presets.json';

type InputMode = 'query' | 'url';

const EXAMPLE_SCENARIOS = [
  { query: 'Russia-Ukraine conflict', icon: '🇺🇦' },
  { query: 'Israel-Palestine Gaza 2023', icon: '🕊️' },
  { query: 'US-China trade war', icon: '💹' },
  { query: 'Taiwan strait tensions', icon: '🌊' },
  { query: 'Brexit aftermath', icon: '🇬🇧' },
];

/**
 * Validate if a string is a valid HTTP/HTTPS URL
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

interface PresetScenario {
  id: string;
  title: string;
  description: string;
  query: string;
  region: string;
  thumbnail: string;
  actors: any[];
  milestones: any[];
  fullScenario?: any; // JSON data, cast to Scenario when used
}

/**
 * Process SSE stream from scenario discovery API
 */
async function processDiscoveryStream(
  response: Response,
  onProgress: (message: string, step?: string, progress?: number) => void,
  onComplete: (scenario: Scenario) => void,
  onError: (error: string) => void
) {
  const reader = response.body?.getReader();
  if (!reader) {
    onError('No response stream available');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE events
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        try {
          const jsonStr = line.slice(6);
          const event = JSON.parse(jsonStr);
          
          if (event.type === 'progress') {
            onProgress(event.message, event.step, event.progress);
          } else if (event.type === 'complete') {
            onComplete(event.scenario);
          } else if (event.type === 'error') {
            onError(event.message);
          }
        } catch (parseError) {
          console.warn('Failed to parse SSE event:', line);
        }
      }
    }
  } catch (error) {
    onError('Stream reading error');
  }
}

function PresetCard({ 
  preset, 
  onSelect, 
  onRefresh,
  isLoading 
}: { 
  preset: PresetScenario; 
  onSelect: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="glass-card-hover p-6 text-left w-full group"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{preset.thumbnail}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg truncate">{preset.title}</h3>
            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          </div>
          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
            {preset.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {preset.actors.length} actors
            </span>
            <span>{preset.region}</span>
          </div>
          
          {/* Actor previews */}
          <div className="flex items-center gap-2 mt-3">
            {preset.actors.slice(0, 4).map((actor) => (
              <div
                key={actor.id}
                className="flex items-center gap-1.5 px-2 py-1 bg-game-bg rounded-full text-xs"
              >
                <span>{actor.avatar}</span>
                <span className="text-gray-400 truncate max-w-[80px]">
                  {actor.name.split(' ').pop()}
                </span>
              </div>
            ))}
            {preset.actors.length > 4 && (
              <span className="text-xs text-gray-500">
                +{preset.actors.length - 4} more
              </span>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onSelect}
            disabled={isLoading}
            className="w-10 h-10 bg-game-accent rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="Play now (instant)"
          >
            <Play className="w-5 h-5 text-white ml-0.5" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            disabled={isLoading}
            className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 disabled:opacity-50"
            title="Refresh with latest news"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export function ScenarioSetup() {
  const [inputMode, setInputMode] = useState<InputMode>('query');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const [progressState, setProgressState] = useState<DiscoveryProgressState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setScenario } = useGameStore();

  const handleDiscover = async (scenarioQuery?: string, sourceUrl?: string) => {
    // Validate based on mode
    if (inputMode === 'url') {
      const url = sourceUrl || urlInput.trim();
      if (!url) return;
      if (!isValidUrl(url)) {
        setError('Please enter a valid URL (starting with http:// or https://)');
        return;
      }
    } else {
      const q = scenarioQuery || query.trim();
      if (!q) return;
    }
    
    setIsLoading(true);
    setError(null);
    setProgressState({
      step: inputMode === 'url' ? 'extracting' : 'searching',
      stepIndex: 0,
      message: inputMode === 'url' ? 'Extracting content from URL...' : 'Searching for context...',
      progress: 5,
    });

    try {
      const body = inputMode === 'url'
        ? { sourceUrl: sourceUrl || urlInput.trim() }
        : { query: scenarioQuery || query.trim() };

      // Try streaming first
      const response = await fetch('/api/scenario/discover', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to discover scenario');
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response
        await processDiscoveryStream(
          response,
          (message, step, progress) => {
            // Map step to stepIndex
            let stepIndex = 0;
            if (step === 'extracted' || step === 'searched') stepIndex = 1;
            if (step === 'generating') stepIndex = 2;
            
            // Calculate progress based on step to ensure bar aligns with step indicators
            // Each step represents ~33% of progress
            const baseProgress = stepIndex * 33;
            const stepProgress = progress ? Math.min(33, (progress / 100) * 33) : 0;
            const calculatedProgress = Math.min(100, baseProgress + stepProgress);
            
            setProgressState({
              step: step || 'searching',
              stepIndex,
              message,
              progress: calculatedProgress,
            });
          },
          (scenario) => {
            setProgressState(null);
            setScenario(scenario);
          },
          (errorMsg) => {
            setProgressState(null);
            setError(errorMsg);
          }
        );
      } else {
        // Fallback: Handle regular JSON response
        const data = await response.json();
        setProgressState(null);
        setScenario(data.scenario);
      }
    } catch (err) {
      setProgressState(null);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setProgressState(null);
    }
  };

  /**
   * INSTANT LOAD: Load preset scenario directly from presets.json
   * No API call needed - instant start!
   */
  const handlePresetSelectInstant = (preset: PresetScenario) => {
    if (preset.fullScenario) {
      // Use the pre-built full scenario - INSTANT!
      setScenario(preset.fullScenario as Scenario);
    } else {
      // Fallback: use API if no fullScenario available
      handlePresetRefresh(preset);
    }
  };

  /**
   * REFRESH: Regenerate preset scenario with latest news via API (with streaming)
   */
  const handlePresetRefresh = async (preset: PresetScenario) => {
    setLoadingPresetId(preset.id);
    setIsLoading(true);
    setError(null);
    setProgressState({
      step: 'searching',
      stepIndex: 0,
      message: 'Fetching latest news...',
      progress: 5,
    });

    try {
      // Use streaming for refresh too
      const response = await fetch('/api/scenario/discover', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ 
          query: preset.query,
          presetHints: {
            title: preset.title,
            actors: preset.actors.map(a => a.name),
            region: preset.region
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load scenario');
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        await processDiscoveryStream(
          response,
          (message, step, progress) => {
            let stepIndex = 0;
            if (step === 'extracted' || step === 'searched') stepIndex = 1;
            if (step === 'generating') stepIndex = 2;
            
            // Calculate progress based on step to ensure bar aligns with step indicators
            // Each step represents ~33% of progress
            const baseProgress = stepIndex * 33;
            const stepProgress = progress ? Math.min(33, (progress / 100) * 33) : 0;
            const calculatedProgress = Math.min(100, baseProgress + stepProgress);
            
            setProgressState({
              step: step || 'searching',
              stepIndex,
              message,
              progress: calculatedProgress,
            });
          },
          (scenario) => {
            setProgressState(null);
            // Merge AI-generated scenario with preset persona data
            const enhancedScenario = {
              ...scenario,
              actors: scenario.actors.map((actor: any) => {
                const presetActor = preset.fullScenario?.actors.find(
                  (p: any) => p.name.toLowerCase().includes(actor.name.toLowerCase().split(' ').pop()) ||
                       actor.name.toLowerCase().includes(p.name.toLowerCase().split(' ').pop())
                );
                if (presetActor?.persona) {
                  return {
                    ...actor,
                    persona: presetActor.persona,
                    avatar: presetActor.avatar || actor.avatar,
                  };
                }
                return actor;
              }),
            };
            setScenario(enhancedScenario);
          },
          (errorMsg) => {
            setProgressState(null);
            setError(errorMsg);
          }
        );
      } else {
        const data = await response.json();
        setProgressState(null);
        
        const enhancedScenario = {
          ...data.scenario,
          actors: data.scenario.actors.map((actor: any) => {
            const presetActor = preset.fullScenario?.actors.find(
              (p: any) => p.name.toLowerCase().includes(actor.name.toLowerCase().split(' ').pop()) ||
                   actor.name.toLowerCase().includes(p.name.toLowerCase().split(' ').pop())
            );
            if (presetActor?.persona) {
              return {
                ...actor,
                persona: presetActor.persona,
                avatar: presetActor.avatar || actor.avatar,
              };
            }
            return actor;
          }),
        };
        
        setScenario(enhancedScenario);
      }
    } catch (err) {
      setProgressState(null);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
      setLoadingPresetId(null);
      setProgressState(null);
    }
  };

  return (
    <div className="min-h-screen p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Globe className="w-12 h-12 text-game-accent" />
            <h1 className="text-5xl font-bold text-gradient">
              The Situation Room
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Step into the room where history is made. Choose a real-world scenario,
            assume your role, and shape the outcome through strategic decisions.
          </p>
        </motion.div>

        {/* Featured Presets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-bold">Featured Scenarios</h2>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Click <Play className="w-3 h-3 inline" /> for instant start, or <RefreshCw className="w-3 h-3 inline" /> to refresh with latest news
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(presets.presets as PresetScenario[]).map((preset, index) => (
              <motion.div
                key={preset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <PresetCard
                  preset={preset}
                  onSelect={() => handlePresetSelectInstant(preset)}
                  onRefresh={() => handlePresetRefresh(preset)}
                  isLoading={isLoading && loadingPresetId === preset.id}
                />
              </motion.div>
            ))}
          </div>
          
          {/* Progress indicator for preset refresh */}
          <AnimatePresence>
            {progressState && loadingPresetId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <DiscoveryProgressInline progressState={progressState} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Custom Scenario Discovery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <div className="glass-card p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-game-accent" />
              Create Custom Scenario
            </h2>

            {/* Tab Toggle */}
            <div className="flex mb-6 bg-game-bg rounded-xl p-1">
              <button
                onClick={() => {
                  setInputMode('query');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'query'
                    ? 'bg-game-accent text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Search className="w-4 h-4" />
                Text Query
              </button>
              <button
                onClick={() => {
                  setInputMode('url');
                  setError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'url'
                    ? 'bg-game-accent text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Link2 className="w-4 h-4" />
                Import from URL
              </button>
            </div>

            {/* Text Query Input */}
            {inputMode === 'query' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative mb-6"
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDiscover(query)}
                  placeholder="Describe any current affairs scenario..."
                  className="input-field pl-12 pr-4"
                  disabled={isLoading}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              </motion.div>
            )}

            {/* URL Input */}
            {inputMode === 'url' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6"
              >
                <div className="relative">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
                    placeholder="Paste a tweet or news article URL..."
                    className="input-field pl-12 pr-4"
                    disabled={isLoading}
                  />
                  <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Works with tweets, news articles, blog posts, and most web pages
                </p>
              </motion.div>
            )}

            <button
              onClick={() => handleDiscover()}
              disabled={isLoading || (inputMode === 'query' ? !query.trim() : !urlInput.trim())}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading && !loadingPresetId ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Building scenario...
                </>
              ) : (
                <>
                  {inputMode === 'url' ? <Link2 className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  {inputMode === 'url' ? 'Import & Build Scenario' : 'Discover & Build Scenario'}
                </>
              )}
            </button>

            {/* Step-based progress indicator - shown below button when loading */}
            <AnimatePresence>
              {progressState && !loadingPresetId && (
                <DiscoveryProgressInline progressState={progressState} />
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Quick suggestions - only show for query mode */}
          {inputMode === 'query' && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Quick suggestions:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.query}
                    onClick={() => {
                      setQuery(scenario.query);
                      handleDiscover(scenario.query);
                    }}
                    disabled={isLoading}
                    className="btn-secondary text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <span>{scenario.icon}</span>
                    {scenario.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Example URLs - only show for URL mode */}
          {inputMode === 'url' && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Supported sources:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="btn-secondary text-sm opacity-60 cursor-default">Twitter/X</span>
                <span className="btn-secondary text-sm opacity-60 cursor-default">Reuters</span>
                <span className="btn-secondary text-sm opacity-60 cursor-default">BBC</span>
                <span className="btn-secondary text-sm opacity-60 cursor-default">CNN</span>
                <span className="btn-secondary text-sm opacity-60 cursor-default">NYT</span>
                <span className="btn-secondary text-sm opacity-60 cursor-default">+ any URL</span>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center text-gray-600 text-sm"
        >
          <p>Powered by LLMs • Real-time scenario analysis • Unlimited possibilities</p>
        </motion.div>
      </div>
    </div>
  );
}
