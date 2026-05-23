-- ============================================================
-- Celudo - Initial Schema Migration
-- ============================================================
-- Tables: users, games, game_history
-- Extensions: pgcrypto, moddatetime
-- RLS: enabled, permissive policies (wallet-based auth via service_role)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- ============================================================
-- 1. USERS TABLE
-- Primary identity is wallet_address (0x...)
-- ============================================================
CREATE TABLE public.users (
    wallet_address TEXT PRIMARY KEY,
    username TEXT,
    points INTEGER DEFAULT 0 NOT NULL,
    games_played INTEGER DEFAULT 0 NOT NULL,
    wins INTEGER DEFAULT 0 NOT NULL,
    staked_balance NUMERIC(18, 4) DEFAULT 0.0 NOT NULL,
    earned_yield NUMERIC(18, 4) DEFAULT 0.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast leaderboard queries
CREATE INDEX idx_users_points ON public.users(points DESC);
CREATE INDEX idx_users_wins ON public.users(wins DESC);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

-- Auto-update updated_at on every row modification
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access (profile viewing / leaderboards)
CREATE POLICY "Allow public read access on users"
    ON public.users FOR SELECT
    USING (true);

-- Allow full access via service_role (server-side API routes)
CREATE POLICY "Allow all actions for service role"
    ON public.users FOR ALL
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- 2. GAMES TABLE
-- Tracks lobby creation, joining, and settlement
-- ============================================================
CREATE TYPE game_mode AS ENUM ('free', 'solo', 'duo', '4player', 'tournament');
CREATE TYPE game_status AS ENUM ('waiting', 'active', 'settled', 'cancelled');

CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    on_chain_game_id BIGSERIAL UNIQUE NOT NULL,
    mode game_mode NOT NULL DEFAULT 'free',
    bet_amount NUMERIC(36, 18) DEFAULT 0.0 NOT NULL,
    token_address TEXT,
    players TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    winners TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    status game_status NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Number of players is derivable from array length
    CONSTRAINT games_players_max_4 CHECK (array_length(players, 1) <= 4)
);

-- Indexes for common query patterns
CREATE INDEX idx_games_on_chain_id ON public.games(on_chain_game_id);
CREATE INDEX idx_games_status ON public.games(status);
CREATE INDEX idx_games_mode_status ON public.games(mode, status);
CREATE INDEX idx_games_created_at ON public.games(created_at DESC);
CREATE INDEX idx_games_players ON public.games USING GIN (players);

-- Auto-update updated_at
CREATE TRIGGER handle_games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW
    EXECUTE FUNCTION extensions.moddatetime('updated_at');

-- Enable RLS
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Public read access for lobby browsing
CREATE POLICY "Allow public read access on games"
    ON public.games FOR SELECT
    USING (true);

-- Full access via service_role
CREATE POLICY "Allow all actions for service role"
    ON public.games FOR ALL
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- 3. GAME HISTORY TABLE
-- Individual player results per game
-- ============================================================
CREATE TABLE public.game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_wallet TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    points_earned INTEGER NOT NULL DEFAULT 0,
    won BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for player-specific history queries
CREATE INDEX idx_game_history_user_wallet ON public.game_history(user_wallet, created_at DESC);
CREATE INDEX idx_game_history_game_id ON public.game_history(game_id);
CREATE INDEX idx_game_history_won ON public.game_history(user_wallet, won);

-- Enable RLS
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on game history"
    ON public.game_history FOR SELECT
    USING (true);

-- Full access via service_role
CREATE POLICY "Allow all actions for service role"
    ON public.game_history FOR ALL
    USING (true)
    WITH CHECK (true);


-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Get leaderboard (top N players by points)
CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count INTEGER DEFAULT 20)
RETURNS TABLE (
    wallet_address TEXT,
    username TEXT,
    points INTEGER,
    games_played INTEGER,
    wins INTEGER,
    staked_balance NUMERIC,
    win_rate NUMERIC
) LANGUAGE sql STABLE AS $$
    SELECT
        u.wallet_address,
        u.username,
        u.points,
        u.games_played,
        u.wins,
        u.staked_balance,
        CASE WHEN u.games_played > 0
            THEN ROUND((u.wins::NUMERIC / u.games_played) * 100, 2)
            ELSE 0
        END AS win_rate
    FROM public.users u
    ORDER BY u.points DESC
    LIMIT limit_count;
$$;

-- Get player stats summary
CREATE OR REPLACE FUNCTION public.get_player_stats(player_wallet TEXT)
RETURNS TABLE (
    wallet_address TEXT,
    username TEXT,
    points INTEGER,
    games_played INTEGER,
    wins INTEGER,
    losses INTEGER,
    win_rate NUMERIC,
    staked_balance NUMERIC,
    earned_yield NUMERIC,
    total_points_earned BIGINT,
    last_game_at TIMESTAMPTZ
) LANGUAGE sql STABLE AS $$
    SELECT
        u.wallet_address,
        u.username,
        u.points,
        u.games_played,
        u.wins,
        u.games_played - u.wins AS losses,
        CASE WHEN u.games_played > 0
            THEN ROUND((u.wins::NUMERIC / u.games_played) * 100, 2)
            ELSE 0
        END AS win_rate,
        u.staked_balance,
        u.earned_yield,
        COALESCE(SUM(gh.points_earned), 0)::BIGINT AS total_points_earned,
        MAX(gh.created_at) AS last_game_at
    FROM public.users u
    LEFT JOIN public.game_history gh ON gh.user_wallet = u.wallet_address
    WHERE u.wallet_address = player_wallet
    GROUP BY u.wallet_address, u.username, u.points, u.games_played, u.wins, u.staked_balance, u.earned_yield;
$$;

-- Count online games (waiting or active)
CREATE OR REPLACE FUNCTION public.count_active_games()
RETURNS TABLE (
    mode TEXT,
    count BIGINT
) LANGUAGE sql STABLE AS $$
    SELECT g.mode::TEXT, COUNT(*)::BIGINT
    FROM public.games g
    WHERE g.status IN ('waiting', 'active')
    GROUP BY g.mode
    ORDER BY COUNT(*) DESC;
$$;
