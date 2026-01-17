'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { 
  Send, Loader2, MessageSquare, Shield, Coins, 
  Globe, FileText, Eye, Phone, Twitter, SkipForward,
  Check, Circle
} from 'lucide-react';
import type { GameEvent, ActionType, MediaType, SimulationResponse } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Progress step configuration
interface ProgressStep {
  id: string;
  label: string;
  shortLabel: string;
}

const SIMULATION_STEPS: ProgressStep[] = [
  { id: 'analyzing', label: 'Analyzing action', shortLabel: 'Analyze' },
  { id: 'generating', label: 'Generating reactions', shortLabel: 'React' },
  { id: 'reactions', label: 'Simulating responses', shortLabel: 'Simulate' },
  { id: 'worldstate', label: 'Updating world', shortLabel: 'Update' },
];

const SKIP_STEPS: ProgressStep[] = [
  { id: 'observing', label: 'Observing world', shortLabel: 'Observe' },
  { id: 'events', label: 'Events unfolding', shortLabel: 'Events' },
  { id: 'worldstate', label: 'Updating world', shortLabel: 'Update' },
];

interface ProgressState {
  step: string;
  stepIndex: number;
  totalSteps: number;
  message: string;
  progress: number;
}

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

/**
 * Process SSE stream from simulation API
 */
async function processSSEStream(
  response: Response,
  onProgress: (state: ProgressState) => void,
  onComplete: (data: SimulationResponse) => void,
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
      buffer = lines.pop() || ''; // Keep incomplete event in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        
        try {
          const jsonStr = line.slice(6); // Remove 'data: ' prefix
          const event = JSON.parse(jsonStr);
          
          if (event.type === 'progress') {
            onProgress({
              step: event.step || 'processing',
              stepIndex: event.stepIndex ?? 0,
              totalSteps: event.totalSteps ?? 4,
              message: event.message,
              progress: event.progress ?? 0,
            });
          } else if (event.type === 'complete') {
            onComplete(event.data);
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

/**
 * Step Progress Indicator Component
 */
function StepProgressIndicator({ 
  progressState, 
  steps 
}: { 
  progressState: ProgressState; 
  steps: ProgressStep[];
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-3"
    >
      {/* Progress bar */}
      <div className="h-1 bg-game-border/50 rounded-full overflow-hidden mb-2">
        <motion.div 
          className="h-full bg-gradient-to-r from-game-accent to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progressState.progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const isComplete = index < progressState.stepIndex;
          const isCurrent = index === progressState.stepIndex;
          const isPending = index > progressState.stepIndex;
          
          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex items-center gap-1.5 min-w-0">
                {/* Step icon */}
                <div className={`
                  w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                  ${isComplete ? 'bg-green-500/20 text-green-400' : ''}
                  ${isCurrent ? 'bg-game-accent/30 text-game-accent ring-2 ring-game-accent/50' : ''}
                  ${isPending ? 'bg-game-border/30 text-gray-600' : ''}
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
                
                {/* Step label */}
                <span className={`
                  text-[10px] sm:text-xs truncate transition-colors duration-300
                  ${isComplete ? 'text-green-400' : ''}
                  ${isCurrent ? 'text-game-accent font-medium' : ''}
                  ${isPending ? 'text-gray-600' : ''}
                `}>
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`
                  flex-1 h-px mx-2 transition-colors duration-300
                  ${isComplete ? 'bg-green-500/50' : 'bg-game-border/30'}
                `} />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ActionInput() {
  const [action, setAction] = useState('');
  const [progressState, setProgressState] = useState<ProgressState | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  
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

  /**
   * Handle successful simulation response (from either streaming or non-streaming)
   */
  const handleSimulationSuccess = (data: SimulationResponse) => {
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
  };

  const handleSubmit = async () => {
    if (!action.trim() || isProcessing || !playerActor) return;

    setProcessing(true);
    setIsSkipping(false);
    setProgressState({
      step: 'analyzing',
      stepIndex: 0,
      totalSteps: 4,
      message: 'Preparing action...',
      progress: 5,
    });

    // Determine media type based on action type
    const mediaType = getMediaTypeForAction(selectedActionType);
    
    // Build media content based on action type
    const mediaContent = mediaType === 'tweet' && playerActor.persona ? {
      platform: playerActor.persona.platform || 'twitter',
      handle: playerActor.persona.socialHandle || `@${playerActor.name.toLowerCase().replace(/\s+/g, '')}`,
      verified: playerActor.persona.verified ?? true,
    } : undefined;

    // Add player action event immediately (optimistic UI)
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
      // Try streaming first
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
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

      if (!response.ok) {
        throw new Error('Simulation request failed');
      }

      // Check if response is SSE stream
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response
        await processSSEStream(
          response,
          (state) => {
            setProgressState(state);
          },
          (data) => {
            setProgressState(null);
            handleSimulationSuccess(data);
          },
          (error) => {
            setProgressState(null);
            console.error('Stream error:', error);
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
          }
        );
      } else {
        // Fallback: Handle regular JSON response
        const data = await response.json();
        setProgressState(null);
        handleSimulationSuccess(data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
      setProgressState(null);
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
      setProgressState(null);
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
    setIsSkipping(true);
    setProgressState({
      step: 'observing',
      stepIndex: 0,
      totalSteps: 3,
      message: 'Observing world events...',
      progress: 5,
    });

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
      // Try streaming first
      const response = await fetch('/api/simulate/skip', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
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

      if (!response.ok) {
        throw new Error('Skip turn request failed');
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        // Handle streaming response
        await processSSEStream(
          response,
          (state) => {
            setProgressState(state);
          },
          (data) => {
            setProgressState(null);
            handleSimulationSuccess(data);
          },
          (error) => {
            setProgressState(null);
            console.error('Stream error:', error);
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
          }
        );
      } else {
        // Fallback: Handle regular JSON response
        const data = await response.json();
        setProgressState(null);
        handleSimulationSuccess(data);
      }
    } catch (err) {
      console.error('Skip turn error:', err);
      setProgressState(null);
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
      setProgressState(null);
      setIsSkipping(false);
    }
  };

  const getPlaceholder = () => {
    if (selectedConfig) {
      return selectedConfig.placeholder;
    }
    return `As ${playerActor?.name}, what do you do? (Select an action type above or just type)`;
  };

  // Select the appropriate steps based on action type
  const currentSteps = isSkipping ? SKIP_STEPS : SIMULATION_STEPS;

  return (
    <div className="glass-card rounded-none border-x-0 border-b-0 p-3 sm:p-4">
      {/* Step-based progress indicator */}
      <AnimatePresence>
        {progressState && (
          <StepProgressIndicator 
            progressState={progressState} 
            steps={currentSteps}
          />
        )}
      </AnimatePresence>

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
