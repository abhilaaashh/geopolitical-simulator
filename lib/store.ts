import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  GameState, 
  Scenario, 
  Actor, 
  GameEvent, 
  WorldState,
  Milestone,
  ActionType,
  PlayerGoal
} from './types';

const initialWorldState: WorldState = {
  tensionLevel: 50,
  globalSentiment: 'Uncertain',
  activeConflicts: [],
  economicImpact: 'Moderate disruption',
  humanitarianSituation: 'Concerning',
  diplomaticStatus: 'Strained',
  keyMetrics: {},
};

const initialState: GameState = {
  scenario: null,
  playerId: null,
  playerActorId: null,
  startingMilestoneId: null,
  playerGoal: null,
  currentTurn: 0,
  events: [],
  worldState: initialWorldState,
  phase: 'setup',
  viewMode: 'graphics',
  isProcessing: false,
  selectedActionType: undefined,
};

interface CloudSyncState {
  cloudSessionId: string | null;
  lastSyncedAt: Date | null;
  isDirty: boolean; // Has changes since last sync
}

interface GameStore extends GameState, CloudSyncState {
  // Setup actions
  setScenario: (scenario: Scenario) => void;
  selectCharacter: (actorId: string) => void;
  selectMilestone: (milestoneId: string) => void;
  setPlayerGoal: (goal: PlayerGoal) => void;
  setViewMode: (mode: 'graphics' | 'chat' | 'social') => void;
  setActionType: (actionType: ActionType | undefined) => void;
  
  // Game actions
  startGame: () => void;
  addEvent: (event: GameEvent) => void;
  addEvents: (events: GameEvent[]) => void;
  updateWorldState: (update: Partial<WorldState>) => void;
  updateGoalProgress: (progress: number, evaluation: string, turn: number) => void;
  updateActor: (actorId: string, update: Partial<Actor>) => void;
  nextTurn: () => void;
  setProcessing: (isProcessing: boolean) => void;
  
  // Cloud sync actions
  setCloudSession: (sessionId: string | null) => void;
  markSynced: () => void;
  loadFromCloud: (state: GameState, sessionId: string) => void;
  getGameState: () => GameState;
  
  // Reset
  resetGame: () => void;
  resetToSetup: () => void;
  resetToMilestone: () => void;
}

const initialCloudState: CloudSyncState = {
  cloudSessionId: null,
  lastSyncedAt: null,
  isDirty: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      ...initialCloudState,

      setScenario: (scenario) => set({ 
        scenario, 
        phase: 'character-select',
        worldState: {
          ...initialWorldState,
          tensionLevel: 60,
          activeConflicts: [scenario.title],
        },
        isDirty: true,
      }),

      selectCharacter: (actorId) => {
        const { scenario } = get();
        if (!scenario) return;
        
        const updatedActors = scenario.actors.map(actor => ({
          ...actor,
          isPlayer: actor.id === actorId,
        }));
        
        set({ 
          playerActorId: actorId,
          scenario: { ...scenario, actors: updatedActors },
          phase: 'milestone-select',
          isDirty: true,
        });
      },

      selectMilestone: (milestoneId) => set({ 
        startingMilestoneId: milestoneId,
        phase: 'goal-select',
        isDirty: true,
      }),

      setPlayerGoal: (goal) => set({ playerGoal: goal, isDirty: true }),

      setViewMode: (mode) => set({ viewMode: mode }),

      setActionType: (actionType) => set({ selectedActionType: actionType }),

      startGame: () => {
        const { scenario, startingMilestoneId, playerActorId, playerGoal } = get();
        if (!scenario || !playerActorId) return;

        const milestone = scenario.milestones.find(m => m.id === startingMilestoneId);
        const playerActor = scenario.actors.find(a => a.id === playerActorId);
        
        const goalText = playerGoal 
          ? `\n\nYour objective: ${playerGoal.description}`
          : '';
        
        const initialEvent: GameEvent = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          turn: 0,
          type: 'system',
          actorId: 'system',
          actorName: 'Game Master',
          content: milestone 
            ? `The game begins at: ${milestone.title} (${milestone.date})\n\n${milestone.description}\n\nYou are playing as ${playerActor?.name}.${goalText} What will you do?`
            : `The simulation begins. You are playing as ${playerActor?.name}.${goalText} The world awaits your decisions.`,
          sentiment: 'neutral',
        };

        set({ 
          phase: 'playing',
          currentTurn: 1,
          events: [initialEvent],
          isDirty: true,
        });
      },

      addEvent: (event) => set((state) => ({ 
        events: [...state.events, event],
        isDirty: true,
      })),

      addEvents: (events) => set((state) => ({ 
        events: [...state.events, ...events],
        isDirty: true,
      })),

      updateWorldState: (update) => set((state) => ({
        worldState: { ...state.worldState, ...update },
        isDirty: true,
      })),

      updateGoalProgress: (progress, evaluation, turn) => set((state) => ({
        playerGoal: state.playerGoal 
          ? {
              ...state.playerGoal,
              progress,
              lastEvaluation: evaluation,
              evaluatedAt: turn,
            }
          : null,
        isDirty: true,
      })),

      updateActor: (actorId, update) => set((state) => {
        if (!state.scenario) return state;
        
        const updatedActors = state.scenario.actors.map(actor => 
          actor.id === actorId ? { ...actor, ...update } : actor
        );
        
        return {
          scenario: { ...state.scenario, actors: updatedActors },
          isDirty: true,
        };
      }),

      nextTurn: () => set((state) => ({ 
        currentTurn: state.currentTurn + 1,
        isDirty: true,
      })),

      setProcessing: (isProcessing) => set({ isProcessing }),

      // Cloud sync actions
      setCloudSession: (sessionId) => set({ cloudSessionId: sessionId }),
      
      markSynced: () => set({ 
        lastSyncedAt: new Date(), 
        isDirty: false,
      }),
      
      loadFromCloud: (state, sessionId) => {
        set({
          ...state,
          cloudSessionId: sessionId,
          lastSyncedAt: new Date(),
          isDirty: false,
          isProcessing: false,
        });
      },
      
      getGameState: () => {
        const state = get();
        return {
          scenario: state.scenario,
          playerId: state.playerId,
          playerActorId: state.playerActorId,
          startingMilestoneId: state.startingMilestoneId,
          playerGoal: state.playerGoal,
          currentTurn: state.currentTurn,
          events: state.events,
          worldState: state.worldState,
          phase: state.phase,
          viewMode: state.viewMode,
          isProcessing: state.isProcessing,
          selectedActionType: state.selectedActionType,
        };
      },

      resetGame: () => set({ 
        ...initialState, 
        ...initialCloudState,
      }),

      resetToSetup: () => set({
        ...initialState,
        ...initialCloudState,
        scenario: get().scenario,
        phase: 'character-select',
      }),

      resetToMilestone: () => set({
        ...initialState,
        ...initialCloudState,
        scenario: get().scenario,
        playerActorId: get().playerActorId,
        phase: 'milestone-select',
      }),
    }),
    {
      name: 'geopolitical-simulator-storage',
      partialize: (state) => ({
        scenario: state.scenario,
        playerActorId: state.playerActorId,
        startingMilestoneId: state.startingMilestoneId,
        playerGoal: state.playerGoal,
        events: state.events,
        worldState: state.worldState,
        currentTurn: state.currentTurn,
        phase: state.phase,
        viewMode: state.viewMode,
        cloudSessionId: state.cloudSessionId,
      }),
    }
  )
);
