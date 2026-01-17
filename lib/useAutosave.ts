'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './store';
import { useAuth } from './auth-context';
import { createSession, updateSession } from './db';
import type { GameState } from './types';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveReturn {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  error: string | null;
}

const AUTOSAVE_DEBOUNCE_MS = 3000; // 3 seconds debounce

/**
 * Autosave hook that automatically saves game state to the cloud
 * when changes are detected (isDirty flag).
 * 
 * - Only runs for authenticated users
 * - Only saves when in 'playing' phase
 * - Debounces saves to avoid excessive API calls
 * - Auto-creates a session if none exists
 */
export function useAutosave(): UseAutosaveReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // Get store state and actions
  const isDirty = useGameStore((state) => state.isDirty);
  const phase = useGameStore((state) => state.phase);
  const cloudSessionId = useGameStore((state) => state.cloudSessionId);
  const scenario = useGameStore((state) => state.scenario);
  const currentTurn = useGameStore((state) => state.currentTurn);
  const getGameState = useGameStore((state) => state.getGameState);
  const setCloudSession = useGameStore((state) => state.setCloudSession);
  const markSynced = useGameStore((state) => state.markSynced);

  const performSave = useCallback(async () => {
    // Prevent concurrent saves
    if (isSavingRef.current) return;
    
    // Only save for authenticated users in playing phase with a scenario
    if (!user || phase !== 'playing' || !scenario) return;

    isSavingRef.current = true;
    setStatus('saving');
    setError(null);

    try {
      const gameState = getGameState();
      
      if (cloudSessionId) {
        // Update existing session
        await updateSession(cloudSessionId, gameState);
      } else {
        // Create new session with auto-generated title
        const title = `${scenario.title} - Turn ${currentTurn}`;
        const newSession = await createSession(user.id, title, gameState);
        setCloudSession(newSession.id);
      }
      
      markSynced();
      setLastSavedAt(new Date());
      setStatus('saved');
      
      // Reset to idle after a short delay
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Autosave failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStatus('error');
      
      // Reset to idle after showing error
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 5000);
    } finally {
      isSavingRef.current = false;
    }
  }, [user, phase, scenario, cloudSessionId, currentTurn, getGameState, setCloudSession, markSynced]);

  // Watch for dirty state changes and debounce saves
  useEffect(() => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Only trigger autosave if dirty, authenticated, and in playing phase
    if (!isDirty || !user || phase !== 'playing' || !scenario) {
      return;
    }

    // Debounce the save
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isDirty, user, phase, scenario, performSave]);

  // Initialize lastSavedAt from store if available
  useEffect(() => {
    const storeLastSynced = useGameStore.getState().lastSyncedAt;
    if (storeLastSynced && !lastSavedAt) {
      setLastSavedAt(storeLastSynced);
    }
  }, [lastSavedAt]);

  return {
    status,
    lastSavedAt,
    error,
  };
}
