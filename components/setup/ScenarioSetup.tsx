'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Search, Globe, Loader2, Sparkles, Users, Play, Star, Link2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

function PresetCard({ 
  preset, 
  onSelect, 
  isLoading 
}: { 
  preset: PresetScenario; 
  onSelect: () => void; 
  isLoading: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      disabled={isLoading}
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
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-game-accent rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function ScenarioSetup() {
  const [inputMode, setInputMode] = useState<InputMode>('query');
  const [query, setQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    try {
      const body = inputMode === 'url'
        ? { sourceUrl: sourceUrl || urlInput.trim() }
        : { query: scenarioQuery || query.trim() };

      const response = await fetch('/api/scenario/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to discover scenario');
      }

      const data = await response.json();
      setScenario(data.scenario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = async (preset: PresetScenario) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the preset's query to generate a full scenario with AI
      // This ensures we get up-to-date information and proper formatting
      const response = await fetch('/api/scenario/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: preset.query,
          // Pass preset data as hints for the AI
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

      const data = await response.json();
      
      // Merge AI-generated scenario with preset persona data
      const enhancedScenario = {
        ...data.scenario,
        actors: data.scenario.actors.map((actor: any) => {
          const presetActor = preset.actors.find(
            p => p.name.toLowerCase().includes(actor.name.toLowerCase().split(' ').pop()) ||
                 actor.name.toLowerCase().includes(p.name.toLowerCase().split(' ').pop())
          );
          if (presetActor) {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
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
              Geopolitical Simulator
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience history from any perspective. Choose a real-world scenario,
            pick your role, and shape the outcome through strategic decisions.
          </p>
        </motion.div>

        {/* Featured Presets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex items-center gap-2 mb-6">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-2xl font-bold">Featured Scenarios</h2>
          </div>
          
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
                  onSelect={() => handlePresetSelect(preset)}
                  isLoading={isLoading}
                />
              </motion.div>
            ))}
          </div>
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
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {inputMode === 'url' ? 'Extracting content & analyzing...' : 'Analyzing scenario with AI...'}
                </>
              ) : (
                <>
                  {inputMode === 'url' ? <Link2 className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                  {inputMode === 'url' ? 'Import & Build Scenario' : 'Discover & Build Scenario'}
                </>
              )}
            </button>

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
