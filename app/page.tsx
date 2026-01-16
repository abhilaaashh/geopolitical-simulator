'use client';

import { useGameStore } from '@/lib/store';
import { ScenarioSetup } from '@/components/setup/ScenarioSetup';
import { CharacterSelect } from '@/components/setup/CharacterSelect';
import { MilestoneSelect } from '@/components/setup/MilestoneSelect';
import { GoalSelect } from '@/components/setup/GoalSelect';
import { GameInterface } from '@/components/game/GameInterface';
import { AppHeader } from '@/components/layout/AppHeader';

export default function Home() {
  const { phase, resetGame } = useGameStore();

  const isInGame = phase === 'playing';

  return (
    <div className="min-h-screen bg-game-bg">
      {/* App Header with Auth - hidden when in-game (GameInterface has its own integrated nav) */}
      {!isInGame && <AppHeader />}

      {/* Background gradient effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-game-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Add padding for header - no padding when in-game */}
      <div className={isInGame ? '' : 'pt-20'}>
        {phase === 'character-select' ? (
          <CharacterSelect />
        ) : phase === 'milestone-select' ? (
          <MilestoneSelect />
        ) : phase === 'goal-select' ? (
          <GoalSelect />
        ) : phase === 'playing' ? (
          <GameInterface />
        ) : phase === 'ended' ? (
          <div className="min-h-screen flex items-center justify-center p-8">
            <div className="glass-card p-12 text-center max-w-2xl">
              <h1 className="text-4xl font-bold mb-4">Session Complete</h1>
              <p className="text-gray-400 mb-8">
                Your time in The Situation Room has concluded.
              </p>
              <button onClick={resetGame} className="btn-primary">
                Return to Situation Room
              </button>
            </div>
          </div>
        ) : (
          <ScenarioSetup />
        )}
      </div>
    </div>
  );
}
