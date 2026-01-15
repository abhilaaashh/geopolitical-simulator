'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Target, ArrowLeft, Check, PenLine, Play, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlayerGoal } from '@/lib/types';

export function GoalSelect() {
  const { scenario, playerActorId, resetToMilestone, setPlayerGoal, startGame } = useGameStore();
  const [selectedObjectiveIndex, setSelectedObjectiveIndex] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customGoalText, setCustomGoalText] = useState('');

  if (!scenario) return null;

  const playerActor = scenario.actors.find(a => a.id === playerActorId);
  const objectives = playerActor?.objectives || [];

  const handleObjectiveClick = (index: number) => {
    setSelectedObjectiveIndex(index);
    setIsCustom(false);
  };

  const handleCustomClick = () => {
    setIsCustom(true);
    setSelectedObjectiveIndex(null);
  };

  const handleStart = () => {
    if (isCustom && customGoalText.trim()) {
      const goal: PlayerGoal = {
        type: 'custom',
        customText: customGoalText.trim(),
        description: customGoalText.trim(),
        progress: 0,
      };
      setPlayerGoal(goal);
      startGame();
    } else if (selectedObjectiveIndex !== null) {
      const objective = objectives[selectedObjectiveIndex];
      const goal: PlayerGoal = {
        type: 'suggested',
        objectiveId: String(selectedObjectiveIndex),
        description: objective,
        progress: 0,
      };
      setPlayerGoal(goal);
      startGame();
    }
  };

  const canStart = (isCustom && customGoalText.trim().length > 10) || selectedObjectiveIndex !== null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={resetToMilestone}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to milestone selection
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8 text-game-accent" />
            <h1 className="text-4xl font-bold">Define Your Goal</h1>
          </div>
          <p className="text-gray-400">
            Playing as <span className="text-game-accent font-semibold">{playerActor?.name}</span>.
            Choose your primary objective for this simulation - your progress towards it will be tracked throughout the game.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Goal options */}
          <div className="lg:col-span-2 space-y-6">
            {/* Suggested objectives */}
            {objectives.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Suggested Objectives
                </h2>
                <div className="space-y-3">
                  {objectives.map((objective, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                      onClick={() => handleObjectiveClick(index)}
                      className={`glass-card-hover p-4 w-full text-left transition-all ${
                        selectedObjectiveIndex === index 
                          ? 'border-game-accent shadow-lg shadow-game-accent/20' 
                          : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                          selectedObjectiveIndex === index 
                            ? 'border-game-accent bg-game-accent' 
                            : 'border-gray-600'
                        }`}>
                          {selectedObjectiveIndex === index && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-200">{objective}</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-game-border" />
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-game-border" />
            </div>

            {/* Custom goal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <PenLine className="w-5 h-5 text-purple-400" />
                Custom Goal
              </h2>
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={handleCustomClick}
                className={`glass-card-hover p-4 cursor-pointer transition-all ${
                  isCustom 
                    ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isCustom 
                      ? 'border-purple-500 bg-purple-500' 
                      : 'border-gray-600'
                  }`}>
                    {isCustom && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-3">
                      Define your own objective for this scenario
                    </p>
                    <textarea
                      value={customGoalText}
                      onChange={(e) => setCustomGoalText(e.target.value)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomClick();
                      }}
                      placeholder="e.g., Negotiate a ceasefire within 10 turns while maintaining international support..."
                      className="input-field w-full resize-none min-h-[100px]"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Be specific about what you want to achieve. The AI will evaluate your progress each turn.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Preview panel */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 sticky top-8"
            >
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Selected Goal
              </h3>
              
              {(selectedObjectiveIndex !== null || (isCustom && customGoalText.trim())) ? (
                <div className="space-y-4">
                  <div className="p-4 bg-game-accent/10 border border-game-accent/30 rounded-xl">
                    <p className="text-gray-200">
                      {isCustom 
                        ? customGoalText.trim() || 'Enter your custom goal...'
                        : objectives[selectedObjectiveIndex!]
                      }
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="text-gray-300">
                        {isCustom ? 'Custom Goal' : 'Suggested Objective'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Starting Progress:</span>
                      <span className="text-gray-300">0%</span>
                    </div>
                  </div>

                  <button
                    onClick={handleStart}
                    disabled={!canStart}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Begin Simulation
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">
                    Select an objective or write your own goal to continue
                  </p>
                </div>
              )}
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-4"
            >
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Tips
              </h4>
              <ul className="text-xs text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-game-accent">•</span>
                  <span>Your goal will be the primary metric displayed during gameplay</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-game-accent">•</span>
                  <span>Progress is evaluated by AI based on your actions and world events</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-game-accent">•</span>
                  <span>Custom goals can be more specific than suggested objectives</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
