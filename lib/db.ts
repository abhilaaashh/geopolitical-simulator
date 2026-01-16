import { getSupabaseClient } from './supabase';
import type { GameState } from './types';
import type { GameSession, GameSessionRow, Json } from './database.types';

// Helper to convert raw row to GameSession with proper GameState typing
function toGameSession(row: GameSessionRow): GameSession {
  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    scenario_id: row.scenario_id,
    scenario_title: row.scenario_title,
    player_actor_name: row.player_actor_name,
    game_state: row.game_state as unknown as GameState,
    current_turn: row.current_turn,
    is_completed: row.is_completed,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ============================================
// GAME SESSIONS
// ============================================

export async function getSessions(): Promise<GameSession[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    throw error;
  }

  return (data ?? []).map(toGameSession);
}

export async function getSession(id: string): Promise<GameSession | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching session:', error);
    throw error;
  }

  return toGameSession(data);
}

export async function createSession(
  userId: string,
  title: string,
  gameState: GameState
): Promise<GameSession> {
  const supabase = getSupabaseClient();
  
  const sessionData = {
    user_id: userId,
    title,
    scenario_id: gameState.scenario?.id ?? null,
    scenario_title: gameState.scenario?.title ?? null,
    player_actor_name: gameState.scenario?.actors.find(a => a.id === gameState.playerActorId)?.name ?? null,
    game_state: gameState as unknown as Json,
    current_turn: gameState.currentTurn,
    is_completed: gameState.phase === 'ended',
  };

  const { data, error } = await supabase
    .from('game_sessions')
    .insert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return toGameSession(data);
}

export async function updateSession(
  id: string,
  gameState: GameState,
  title?: string
): Promise<GameSession> {
  const supabase = getSupabaseClient();
  
  const updateData = {
    game_state: gameState as unknown as Json,
    current_turn: gameState.currentTurn,
    is_completed: gameState.phase === 'ended',
    ...(title && { title }),
  };

  const { data, error } = await supabase
    .from('game_sessions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating session:', error);
    throw error;
  }

  return toGameSession(data);
}

export async function deleteSession(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('game_sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

// ============================================
// SHARED SESSIONS
// ============================================

function generateShareToken(): string {
  // Generate a URL-safe random token
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createShareLink(sessionId: string): Promise<string> {
  const supabase = getSupabaseClient();
  
  // Check if share already exists
  const { data: existing } = await supabase
    .from('shared_sessions')
    .select('share_token')
    .eq('session_id', sessionId)
    .single();

  if (existing) {
    return existing.share_token;
  }

  // Create new share
  const shareToken = generateShareToken();
  
  const { error } = await supabase
    .from('shared_sessions')
    .insert({
      session_id: sessionId,
      share_token: shareToken,
    });

  if (error) {
    console.error('Error creating share link:', error);
    throw error;
  }

  return shareToken;
}

export async function getSharedSession(token: string): Promise<{
  session_id: string;
  title: string;
  scenario_title: string | null;
  player_actor_name: string | null;
  game_state: GameState;
  current_turn: number;
  is_completed: boolean;
  created_at: string;
} | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .rpc('get_shared_session', { token });

  if (error) {
    console.error('Error fetching shared session:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const row = data[0];
  return {
    session_id: row.session_id,
    title: row.title,
    scenario_title: row.scenario_title,
    player_actor_name: row.player_actor_name,
    game_state: row.game_state as unknown as GameState,
    current_turn: row.current_turn,
    is_completed: row.is_completed,
    created_at: row.created_at,
  };
}

export async function deleteShareLink(sessionId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('shared_sessions')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error deleting share link:', error);
    throw error;
  }
}

export async function getShareToken(sessionId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('shared_sessions')
    .select('share_token')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching share token:', error);
    throw error;
  }

  return data?.share_token ?? null;
}
