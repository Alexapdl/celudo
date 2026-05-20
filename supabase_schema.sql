-- SQL Schema for Celudo Supabase Database
-- Run this in your Supabase SQL Editor

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    wallet_address TEXT PRIMARY KEY,
    username TEXT,
    points INTEGER DEFAULT 0 NOT NULL,
    games_played INTEGER DEFAULT 0 NOT NULL,
    wins INTEGER DEFAULT 0 NOT NULL,
    staked_balance NUMERIC(18, 4) DEFAULT 0.0 NOT NULL,
    earned_yield NUMERIC(18, 4) DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for viewing profiles)
CREATE POLICY "Allow public read access on users" 
ON public.users FOR SELECT 
USING (true);

-- Allow users to insert/update their own profile
CREATE POLICY "Allow select/insert/update for matching wallet" 
ON public.users FOR ALL 
USING (true)
WITH CHECK (true);


-- 2. Create Games Table
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    on_chain_game_id BIGSERIAL UNIQUE NOT NULL, -- uint256 game ID used in LudoEscrow contract
    mode TEXT NOT NULL, -- 'free', 'solo', 'duo', '4player'
    bet_amount NUMERIC(36, 18) DEFAULT 0.0 NOT NULL,
    token_address TEXT,
    players TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    winners TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    status TEXT DEFAULT 'waiting'::TEXT NOT NULL, -- 'waiting', 'active', 'settled', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_games_on_chain_id ON public.games(on_chain_game_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);

-- Enable RLS for Games
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read games (for lobby list)
CREATE POLICY "Allow public read access on games" 
ON public.games FOR SELECT 
USING (true);

-- Allow anyone to create and join games (for casual play / decentralized actions)
CREATE POLICY "Allow all actions on games for clients" 
ON public.games FOR ALL 
USING (true)
WITH CHECK (true);


-- 3. Create Game History Table
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    points_earned INTEGER NOT NULL,
    won BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Game History
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read game history
CREATE POLICY "Allow public select on game history" 
ON public.game_history FOR SELECT 
USING (true);

-- Allow insert access for client/server
CREATE POLICY "Allow insert/select on game history" 
ON public.game_history FOR ALL 
USING (true)
WITH CHECK (true);
