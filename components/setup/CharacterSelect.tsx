'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { User, Users, Building, Flag, ArrowLeft, Check, Shield, Coins, MessageSquare, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Actor } from '@/lib/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  leader: <User className="w-5 h-5" />,
  organization: <Building className="w-5 h-5" />,
  country: <Flag className="w-5 h-5" />,
  entity: <Users className="w-5 h-5" />,
  group: <Users className="w-5 h-5" />,
};

function ResourceBar({ label, value, icon }: { label: string; value?: number; icon: React.ReactNode }) {
  if (value === undefined) return null;
  
  return (
    <div className="flex items-center gap-2">
      <div className="text-gray-500">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between text-[10px] sm:text-xs mb-1">
          <span className="text-gray-500">{label}</span>
          <span className="text-gray-400">{value}</span>
        </div>
        <div className="h-1 sm:h-1.5 bg-game-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-game-accent to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ActorCard({ actor, isSelected, onSelect }: { actor: Actor; isSelected: boolean; onSelect: () => void }) {
  const resources = actor.resources || {};
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`glass-card-hover p-4 sm:p-6 text-left w-full ${
        isSelected ? 'border-game-accent shadow-lg shadow-game-accent/20' : ''
      }`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-lg sm:text-2xl flex-shrink-0"
          style={{ backgroundColor: `${actor.color || '#6366f1'}20` }}
        >
          {actor.avatar || TYPE_ICONS[actor.type] || <User className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <h3 className="font-semibold text-sm sm:text-lg truncate">{actor.name}</h3>
            {isSelected && (
              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-game-accent rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs rounded-full"
              style={{ backgroundColor: `${actor.color || '#6366f1'}30`, color: actor.color || '#6366f1' }}
            >
              {actor.type || 'unknown'}
            </span>
          </div>
          
          <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 line-clamp-2">{actor.description}</p>
          
          <div className="space-y-1.5 sm:space-y-2">
            <ResourceBar label="Military" value={resources.military} icon={<Shield className="w-3 h-3" />} />
            <ResourceBar label="Economic" value={resources.economic} icon={<Coins className="w-3 h-3" />} />
            <ResourceBar label="Diplomatic" value={resources.diplomatic} icon={<MessageSquare className="w-3 h-3" />} />
            <ResourceBar label="Popular" value={resources.popular} icon={<Heart className="w-3 h-3" />} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export function CharacterSelect() {
  const { scenario, playerActorId, selectCharacter, resetGame } = useGameStore();
  const [selectedId, setSelectedId] = useState<string | null>(playerActorId);

  if (!scenario) return null;

  const handleConfirm = () => {
    if (selectedId) {
      selectCharacter(selectedId);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <button
            onClick={resetGame}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3 sm:mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back to scenario selection</span>
            <span className="xs:hidden">Back</span>
          </button>
          
          <h1 className="text-2xl sm:text-4xl font-bold mb-2">{scenario.title}</h1>
          <p className="text-sm sm:text-base text-gray-400 line-clamp-2 sm:line-clamp-none">{scenario.description}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 sm:mb-8"
        >
          <h2 className="text-lg sm:text-2xl font-semibold mb-1 sm:mb-2">Choose Your Role</h2>
          <p className="text-xs sm:text-base text-gray-400">
            Select which actor you want to play as. Each has different capabilities and objectives.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {scenario.actors.map((actor, index) => (
            <motion.div
              key={actor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <ActorCard
                actor={actor}
                isSelected={selectedId === actor.id}
                onSelect={() => setSelectedId(actor.id)}
              />
            </motion.div>
          ))}
        </div>

        {selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center sticky bottom-4 sm:relative sm:bottom-auto"
          >
            <button onClick={handleConfirm} className="btn-primary px-6 sm:px-12 text-sm sm:text-lg w-full sm:w-auto shadow-lg sm:shadow-none">
              <span className="hidden sm:inline">Continue as {scenario.actors.find(a => a.id === selectedId)?.name}</span>
              <span className="sm:hidden">Continue</span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
