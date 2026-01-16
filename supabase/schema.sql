-- Supabase Schema for Geopolitical Simulator
-- Run this in Supabase SQL Editor to create the necessary tables

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GAME SESSIONS TABLE
-- Stores saved game states for authenticated users
-- ============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scenario_id TEXT,
  scenario_title TEXT,
  player_actor_name TEXT,
  game_state JSONB NOT NULL,
  current_turn INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_updated_at ON game_sessions(updated_at DESC);

-- ============================================
-- SHARED SESSIONS TABLE
-- Public share links for game sessions
-- ============================================
CREATE TABLE IF NOT EXISTS shared_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_shared_sessions_token ON shared_sessions(share_token);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on game_sessions
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON game_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON game_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON game_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS on shared_sessions
ALTER TABLE shared_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can view shared sessions (for public links)
CREATE POLICY "Anyone can view shared sessions"
  ON shared_sessions FOR SELECT
  USING (true);

-- Users can create shares for their own sessions
CREATE POLICY "Users can share own sessions"
  ON shared_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- Users can delete shares for their own sessions
CREATE POLICY "Users can delete own shares"
  ON shared_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions 
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTION: Get shared session with game data
-- Used for public share links
-- ============================================
CREATE OR REPLACE FUNCTION get_shared_session(token TEXT)
RETURNS TABLE (
  session_id UUID,
  title TEXT,
  scenario_title TEXT,
  player_actor_name TEXT,
  game_state JSONB,
  current_turn INTEGER,
  is_completed BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id as session_id,
    gs.title,
    gs.scenario_title,
    gs.player_actor_name,
    gs.game_state,
    gs.current_turn,
    gs.is_completed,
    gs.created_at
  FROM shared_sessions ss
  JOIN game_sessions gs ON gs.id = ss.session_id
  WHERE ss.share_token = token;
END;
$$;

-- ============================================
-- TRIGGER: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FUNCTION: Get analytics stats
-- Returns aggregate statistics for the platform
-- ============================================
CREATE OR REPLACE FUNCTION get_analytics_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_sessions BIGINT,
  completed_sessions BIGINT,
  avg_session_duration_seconds NUMERIC,
  avg_turns_per_game NUMERIC,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_users BIGINT;
  v_total_sessions BIGINT;
  v_completed_sessions BIGINT;
  v_avg_duration NUMERIC;
  v_avg_turns NUMERIC;
  v_completion_rate NUMERIC;
BEGIN
  -- Count total users from auth.users
  SELECT COUNT(*) INTO v_total_users FROM auth.users;
  
  -- Count total sessions
  SELECT COUNT(*) INTO v_total_sessions FROM game_sessions;
  
  -- Count completed sessions
  SELECT COUNT(*) INTO v_completed_sessions 
  FROM game_sessions WHERE is_completed = true;
  
  -- Calculate average session duration in seconds
  SELECT COALESCE(
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))),
    0
  ) INTO v_avg_duration FROM game_sessions;
  
  -- Calculate average turns per game
  SELECT COALESCE(AVG(current_turn), 0) INTO v_avg_turns FROM game_sessions;
  
  -- Calculate completion rate as percentage
  IF v_total_sessions > 0 THEN
    v_completion_rate := ROUND((v_completed_sessions::NUMERIC / v_total_sessions) * 100, 1);
  ELSE
    v_completion_rate := 0;
  END IF;
  
  RETURN QUERY SELECT 
    v_total_users,
    v_total_sessions,
    v_completed_sessions,
    ROUND(v_avg_duration, 0),
    ROUND(v_avg_turns, 1),
    v_completion_rate;
END;
$$;
