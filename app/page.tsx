'use client';

import { useGameStore } from '@/lib/store';
import { ScenarioSetup } from '@/components/setup/ScenarioSetup';
import { CharacterSelect } from '@/components/setup/CharacterSelect';
import { MilestoneSelect } from '@/components/setup/MilestoneSelect';
import { GoalSelect } from '@/components/setup/GoalSelect';
import { GameInterface } from '@/components/game/GameInterface';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { phase, resetGame } = useGameStore();

  return (
    <div className="min-h-screen bg-game-bg">
      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ScenarioSetup />
          </motion.div>
        )}

        {phase === 'character-select' && (
          <motion.div
            key="character"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CharacterSelect />
          </motion.div>
        )}

        {phase === 'milestone-select' && (
          <motion.div
            key="milestone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MilestoneSelect />
          </motion.div>
        )}

        {phase === 'goal-select' && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <GoalSelect />
          </motion.div>
        )}

        {phase === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameInterface />
          </motion.div>
        )}

        {phase === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="glass-card p-12 text-center max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">Simulation Complete</h1>
              <p className="text-gray-400 mb-8">
                Your journey through this geopolitical scenario has concluded.
              </p>
              <button onClick={resetGame} className="btn-primary">
                Start New Simulation
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
