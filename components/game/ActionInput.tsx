'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { 
  Send, Loader2, MessageSquare, Shield, Coins, 
  Globe, FileText, Eye, Phone, Twitter, SkipForward
} from 'lucide-react';
import type { GameEvent, ActionType, MediaType } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { motion } from 'framer-motion';

// Action type configuration
const ACTION_TYPES: {
  type: ActionType;
  label: string;
  icon: React.ReactNode;
  mediaType: MediaType;
  placeholder: string;
  color: string;
}[] = [
  {
    type: 'social_media',
    label: 'Tweet',
    icon: <Twitter className="w-4 h-4" />,
    mediaType: 'tweet',
    placeholder: 'Write a tweet or social media post...',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
  },
  {
    type: 'press_release',
    label: 'Statement',
    icon: <FileText className="w-4 h-4" />,
    mediaType: 'pressRelease',
    placeholder: 'Issue an official statement or press release...',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
  },
  {
    type: 'diplomatic',
    label: 'Diplomatic',
    icon: <Globe className="w-4 h-4" />,
    mediaType: 'statement',
    placeholder: 'Initiate diplomatic talks, sign agreements, call meetings...',
    color: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30',
  },
  {
    type: 'military',
    label: 'Military',
    icon: <Shield className="w-4 h-4" />,
    mediaType: 'statement',
    placeholder: 'Order troop movements, change military posture, deploy forces...',
    color: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
  },
  {
    type: 'economic',
    label: 'Economic',
    icon: <Coins className="w-4 h-4" />,
    mediaType: 'statement',
    placeholder: 'Impose sanctions, sign trade deals, adjust tariffs...',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30',
  },
  {
    type: 'covert',
    label: 'Covert',
    icon: <Eye className="w-4 h-4" />,
    mediaType: 'leak',
    placeholder: 'Intelligence operations, covert actions, back-channel communications...',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30',
  },
  {
    type: 'personal',
    label: 'Call',
    icon: <Phone className="w-4 h-4" />,
    mediaType: 'statement',
    placeholder: 'Make a personal phone call to another leader...',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30',
  },
];

export function ActionInput() {
  const [action, setAction] = useState('');
  
  const { 
    scenario, 
    playerActorId, 
    playerGoal,
    worldState, 
    currentTurn,
    isProcessing,
    selectedActionType,
    setProcessing,
    setActionType,
    addEvent,
    addEvents,
    updateWorldState,
    updateGoalProgress,
    nextTurn,
  } = useGameStore();

  const playerActor = scenario?.actors.find(a => a.id === playerActorId);
  const selectedConfig = ACTION_TYPES.find(a => a.type === selectedActionType);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAction(e.target.value);
  };

  const getMediaTypeForAction = (actionType?: ActionType): MediaType | undefined => {
    if (!actionType) return undefined;
    return ACTION_TYPES.find(a => a.type === actionType)?.mediaType;
  };

  const handleSubmit = async () => {
    if (!action.trim() || isProcessing || !playerActor) return;

    setProcessing(true);

    // Determine media type based on action type
    const mediaType = getMediaTypeForAction(selectedActionType);
    
    // Build media content based on action type
    const mediaContent = mediaType === 'tweet' && playerActor.persona ? {
      platform: playerActor.persona.platform || 'twitter',
      handle: playerActor.persona.socialHandle || `@${playerActor.name.toLowerCase().replace(/\s+/g, '')}`,
      verified: playerActor.persona.verified ?? true,
    } : undefined;

    // Add player action event immediately
    const playerEvent: GameEvent = {
      id: generateId(),
      timestamp: new Date(),
      turn: currentTurn,
      type: 'action',
      actorId: playerActorId!,
      actorName: playerActor.name,
      content: action,
      isPlayerAction: true,
      sentiment: 'neutral',
      mediaType,
      media: mediaContent,
    };
    
    addEvent(playerEvent);
    const savedAction = action;
    setAction('');

    try {
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: {
            scenario,
            playerActorId,
            playerGoal,
            currentTurn,
            events: [...useGameStore.getState().events],
            worldState,
          },
          playerAction: savedAction,
          actionType: selectedActionType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add response events
        if (data.events && data.events.length > 0) {
          const formattedEvents: GameEvent[] = data.events.map((e: any) => ({
            ...e,
            id: generateId(),
            timestamp: new Date(),
            turn: currentTurn,
          }));
          addEvents(formattedEvents);
        }

        // Update world state
        if (data.worldStateUpdate) {
          updateWorldState(data.worldStateUpdate);
        }

        // Update goal progress
        if (data.goalProgressUpdate && playerGoal) {
          updateGoalProgress(
            data.goalProgressUpdate.progress,
            data.goalProgressUpdate.evaluation,
            currentTurn
          );
        }

        nextTurn();
      }
    } catch (err) {
      console.error('Simulation error:', err);
      addEvent({
        id: generateId(),
        timestamp: new Date(),
        turn: currentTurn,
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        content: 'An error occurred while processing your action. Please try again.',
        sentiment: 'negative',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSkipTurn = async () => {
    if (isProcessing || !playerActor) return;

    setProcessing(true);

    // Add a system event indicating the player is observing
    const observeEvent: GameEvent = {
      id: generateId(),
      timestamp: new Date(),
      turn: currentTurn,
      type: 'system',
      actorId: playerActorId!,
      actorName: playerActor.name,
      content: `${playerActor.name} observes the situation without taking action.`,
      sentiment: 'neutral',
    };
    
    addEvent(observeEvent);

    try {
      const response = await fetch('/api/simulate/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: {
            scenario,
            playerActorId,
            playerGoal,
            currentTurn,
            events: [...useGameStore.getState().events],
            worldState,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add response events
        if (data.events && data.events.length > 0) {
          const formattedEvents: GameEvent[] = data.events.map((e: any) => ({
            ...e,
            id: generateId(),
            timestamp: new Date(),
            turn: currentTurn,
          }));
          addEvents(formattedEvents);
        }

        // Update world state
        if (data.worldStateUpdate) {
          updateWorldState(data.worldStateUpdate);
        }

        // Update goal progress (for skip, progress might change due to world events)
        if (data.goalProgressUpdate && playerGoal) {
          updateGoalProgress(
            data.goalProgressUpdate.progress,
            data.goalProgressUpdate.evaluation,
            currentTurn
          );
        }

        nextTurn();
      }
    } catch (err) {
      console.error('Skip turn error:', err);
      addEvent({
        id: generateId(),
        timestamp: new Date(),
        turn: currentTurn,
        type: 'system',
        actorId: 'system',
        actorName: 'System',
        content: 'An error occurred while skipping the turn. Please try again.',
        sentiment: 'negative',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPlaceholder = () => {
    if (selectedConfig) {
      return selectedConfig.placeholder;
    }
    return `As ${playerActor?.name}, what do you do? (Select an action type above or just type)`;
  };

  return (
    <div className="glass-card rounded-none border-x-0 border-b-0 p-3 sm:p-4">
      {/* Action Type Selector - horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible scrollbar-hide">
        {ACTION_TYPES.map((actionType) => (
          <motion.button
            key={actionType.type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActionType(
              selectedActionType === actionType.type ? undefined : actionType.type
            )}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0 ${
              selectedActionType === actionType.type
                ? actionType.color + ' ring-2 ring-offset-1 ring-offset-game-bg'
                : 'bg-game-card border-game-border text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {actionType.icon}
            <span className="whitespace-nowrap">{actionType.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Input area - stacks on mobile */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1">
          <textarea
            value={action}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isProcessing}
            className={`input-field resize-none h-16 sm:h-20 text-sm sm:text-base ${
              selectedConfig ? 'border-l-4' : ''
            }`}
            style={selectedConfig ? {
              borderLeftColor: selectedConfig.color.includes('blue') ? '#3b82f6' :
                              selectedConfig.color.includes('purple') ? '#a855f7' :
                              selectedConfig.color.includes('green') ? '#22c55e' :
                              selectedConfig.color.includes('red') ? '#ef4444' :
                              selectedConfig.color.includes('yellow') ? '#eab308' :
                              selectedConfig.color.includes('gray') ? '#6b7280' :
                              selectedConfig.color.includes('cyan') ? '#06b6d4' : undefined
            } : undefined}
            rows={2}
          />
        </div>
        
        {/* Buttons - horizontal on mobile, vertical on desktop */}
        <div className="flex flex-row sm:flex-col gap-2">
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !action.trim()}
            className="btn-primary flex-1 sm:flex-none px-4 sm:px-6 h-[44px] sm:h-[38px] flex items-center justify-center gap-2 min-w-[44px]"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="text-xs hidden xs:inline sm:inline">
              {isProcessing ? 'Processing...' : 'Send'}
            </span>
          </button>
          
          <button
            onClick={handleSkipTurn}
            disabled={isProcessing}
            className="flex-1 sm:flex-none px-4 sm:px-6 h-[44px] sm:h-[38px] flex items-center justify-center gap-2 rounded-xl sm:rounded-lg border border-game-border bg-game-card text-gray-400 hover:text-white hover:border-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[44px]"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SkipForward className="w-4 h-4" />
            )}
            <span className="text-xs hidden xs:inline sm:inline">Skip</span>
          </button>
        </div>
      </div>
      
      <p className="text-[10px] sm:text-xs text-gray-500 mt-2">
        {selectedConfig ? (
          <>
            <span className="text-gray-400">{selectedConfig.label} action selected</span> • 
          </>
        ) : null}
        <span className="hidden sm:inline">Press Enter to send • Shift+Enter for new line • Skip to observe without acting</span>
        <span className="sm:hidden">Enter to send • Skip to observe</span>
      </p>
    </div>
  );
}
