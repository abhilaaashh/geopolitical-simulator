'use client';

import { useGameStore } from '@/lib/store';
import { X, Shield, Coins, MessageSquare, Heart, Crown, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Actor } from '@/lib/types';

function MiniResourceBar({ value }: { value?: number }) {
  if (value === undefined) return null;
  return (
    <div className="w-full h-1 bg-game-bg rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-game-accent/50 to-game-accent rounded-full"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function ActorRow({ actor, isPlayer }: { actor: Actor; isPlayer: boolean }) {
  const objectives = actor.objectives || [];
  const resources = actor.resources || {};
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl transition-colors ${
        isPlayer ? 'bg-game-accent/10 border border-game-accent/30' : 'hover:bg-game-border/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${actor.color || '#6366f1'}20` }}
        >
          {actor.avatar || actor.name?.charAt(0) || '?'}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{actor.name}</h4>
            {isPlayer && <Crown className="w-3 h-3 text-game-accent" />}
          </div>
          
          <p className="text-xs text-gray-500 capitalize mb-2">{actor.type}</p>
          
          {/* Resource bars */}
          <div className="space-y-1">
            {resources.military !== undefined && (
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-red-400 flex-shrink-0" />
                <MiniResourceBar value={resources.military} />
              </div>
            )}
            {resources.economic !== undefined && (
              <div className="flex items-center gap-2">
                <Coins className="w-3 h-3 text-amber-400 flex-shrink-0" />
                <MiniResourceBar value={resources.economic} />
              </div>
            )}
            {resources.diplomatic !== undefined && (
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3 h-3 text-blue-400 flex-shrink-0" />
                <MiniResourceBar value={resources.diplomatic} />
              </div>
            )}
            {resources.popular !== undefined && (
              <div className="flex items-center gap-2">
                <Heart className="w-3 h-3 text-pink-400 flex-shrink-0" />
                <MiniResourceBar value={resources.popular} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Objectives preview */}
      {objectives.length > 0 && (
        <div className="mt-3 pl-13">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Target className="w-3 h-3" />
            <span>Objectives</span>
          </div>
          <ul className="text-xs text-gray-400 space-y-0.5">
            {objectives.slice(0, 2).map((obj, i) => (
              <li key={i} className="truncate">• {obj}</li>
            ))}
            {objectives.length > 2 && (
              <li className="text-gray-600">+{objectives.length - 2} more</li>
            )}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

export function ActorsSidebar({ onClose }: { onClose: () => void }) {
  const { scenario, playerActorId } = useGameStore();

  if (!scenario) return null;

  const playerActor = scenario.actors.find(a => a.id === playerActorId);
  const otherActors = scenario.actors.filter(a => a.id !== playerActorId);

  return (
    <>
      <div className="p-4 border-b border-game-border flex items-center justify-between">
        <h3 className="font-semibold">Actors</h3>
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-game-border rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {playerActor && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">You</p>
            <ActorRow actor={playerActor} isPlayer />
          </div>
        )}
        
        {otherActors.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Other Actors</p>
            <div className="space-y-2">
              {otherActors.map((actor) => (
                <ActorRow key={actor.id} actor={actor} isPlayer={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
