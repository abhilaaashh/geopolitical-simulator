'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Calendar, ArrowLeft, Check, AlertTriangle, AlertCircle, Info, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const SIGNIFICANCE_CONFIG = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Critical',
  },
  major: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <AlertCircle className="w-4 h-4" />,
    label: 'Major',
  },
  minor: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <Info className="w-4 h-4" />,
    label: 'Minor',
  },
};

export function MilestoneSelect() {
  const { scenario, playerActorId, startingMilestoneId, selectMilestone, resetToSetup } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(startingMilestoneId);

  if (!scenario) return null;

  const playerActor = scenario.actors.find(a => a.id === playerActorId);

  const handleContinue = () => {
    // selectMilestone now transitions to goal-select phase
    selectMilestone(selectedId || '');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={resetToSetup}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to character selection
          </button>
          
          <h1 className="text-4xl font-bold mb-2">Choose Your Starting Point</h1>
          <p className="text-gray-400">
            Playing as <span className="text-game-accent font-semibold">{playerActor?.name}</span>.
            Select when to begin your journey in the timeline.
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-game-border" />

          <div className="space-y-4">
            {scenario.milestones.map((milestone, index) => {
              const config = SIGNIFICANCE_CONFIG[milestone.significance] || SIGNIFICANCE_CONFIG.minor;
              const isSelected = selectedId === milestone.id;
              const actorsInvolved = milestone.actorsInvolved || [];
              const playerInvolved = actorsInvolved.includes(playerActorId || '');

              return (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-20"
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute left-6 w-5 h-5 rounded-full border-2 transition-all ${
                      isSelected
                        ? 'bg-game-accent border-game-accent scale-125'
                        : `${config.bg} ${config.border}`
                    }`}
                  />

                  <button
                    onClick={() => setSelectedId(milestone.id)}
                    className={`glass-card-hover p-6 w-full text-left transition-all ${
                      isSelected ? 'border-game-accent shadow-lg shadow-game-accent/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {milestone.date}
                          </span>
                          <span className={`flex items-center gap-1 text-xs ${config.color}`}>
                            {config.icon}
                            {config.label}
                          </span>
                          {playerInvolved && (
                            <span className="badge-info text-xs">You were involved</span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-semibold mb-2">{milestone.title}</h3>
                        <p className="text-gray-400 text-sm">{milestone.description}</p>
                        
                        {actorsInvolved.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {actorsInvolved.map(actorId => {
                              const actor = scenario.actors.find(a => a.id === actorId);
                              if (!actor) return null;
                              return (
                                <span
                                  key={actorId}
                                  className="text-xs px-2 py-1 rounded-full"
                                  style={{ backgroundColor: `${actor.color}20`, color: actor.color }}
                                >
                                  {actor.name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      {isSelected && (
                        <div className="w-8 h-8 bg-game-accent rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  </button>
                </motion.div>
              );
            })}

            {/* "Start from beginning" option */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: scenario.milestones.length * 0.05 }}
              className="relative pl-20"
            >
              <div
                className={`absolute left-6 w-5 h-5 rounded-full border-2 transition-all ${
                  selectedId === null
                    ? 'bg-game-accent border-game-accent scale-125'
                    : 'bg-game-card border-game-border'
                }`}
              />

              <button
                onClick={() => setSelectedId(null)}
                className={`glass-card-hover p-6 w-full text-left transition-all ${
                  selectedId === null ? 'border-game-accent shadow-lg shadow-game-accent/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Start from the Beginning</h3>
                    <p className="text-gray-400 text-sm">
                      Begin at {scenario.timeframe.start} with full historical context
                    </p>
                  </div>
                  {selectedId === null && (
                    <div className="w-8 h-8 bg-game-accent rounded-full flex items-center justify-center">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <button onClick={handleContinue} className="btn-primary px-12 text-lg flex items-center gap-2">
            <ArrowRight className="w-5 h-5" />
            Continue to Goal Selection
          </button>
        </motion.div>
      </div>
    </div>
  );
}
