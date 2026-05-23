-- ============================================================
-- Celudo - Seed Data for Local Development
-- ============================================================
-- Ran automatically by `supabase db reset` or `supabase start`
-- ============================================================

-- Sample users (wallet addresses are fake, for dev only)
INSERT INTO public.users (wallet_address, username, points, games_played, wins, staked_balance, earned_yield)
VALUES
    ('0x1234567890abcdef1234567890abcdef12345678', 'AcePlayer',   2500, 42, 28, 500.0000, 12.4500),
    ('0xabcdef1234567890abcdef1234567890abcdef12', 'LudoMaster',  1800, 35, 22, 300.0000, 8.1200),
    ('0x9876543210fedcba9876543210fedcba98765432', 'DiceQueen',   3200, 55, 38, 750.0000, 22.8000),
    ('0x1111111111222222222233333333334444444444', 'CeloWiz',     1200, 20, 10, 200.0000, 4.5000),
    ('0x5555555555666666666677777777778888888888', 'BlockBoss',   4100, 68, 45, 1000.0000, 35.6000),
    ('0x9999999999aaaabbbbccccddddeeeeffff999999', 'TokenTitan',  9000, 120, 85, 2500.0000, 95.3000),
    ('0x0000000000000000000000000000000000000001', 'MiniGamer',   600,  10, 4,  50.0000,  1.2000),
    ('0x0000000000000000000000000000000000000002', 'YieldKing',   2800, 48, 32, 600.0000, 18.0000),
    ('0x0000000000000000000000000000000000000003', 'RollTide',    1500, 28, 16, 150.0000, 5.8000),
    ('0x0000000000000000000000000000000000000004', 'StakeFury',   2200, 38, 24, 450.0000, 14.2000);

-- Sample games (one per mode, in various states)
INSERT INTO public.games (mode, bet_amount, token_address, players, status)
VALUES
    ('free',       0.0,     NULL,                                   ARRAY['0x1234567890abcdef1234567890abcdef12345678', '0xabcdef1234567890abcdef1234567890abcdef12'],                                'active'),
    ('duo',        0.5,     '0x765DE816845861e75A25fCA122bb6898B8B1282a', ARRAY['0x9876543210fedcba9876543210fedcba98765432', '0x1111111111222222222233333333334444444444'],                                'waiting'),
    ('4player',    1.0,     '0x765DE816845861e75A25fCA122bb6898B8B1282a', ARRAY['0x5555555555666666666677777777778888888888', '0x9999999999aaaabbbbccccddddeeeeffff999999', '0x0000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000003'], 'settled'),
    ('tournament', 0.0,     NULL,                                   ARRAY['0x0000000000000000000000000000000000000004', '0x0000000000000000000000000000000000000001'],                                'waiting'),
    ('solo',       0.0,     NULL,                                   ARRAY['0x9999999999aaaabbbbccccddddeeeeffff999999'],                                                                              'active');

-- Sample game history records
INSERT INTO public.game_history (user_wallet, game_id, mode, points_earned, won)
SELECT
    u.wallet_address,
    g.id,
    g.mode::TEXT,
    CASE WHEN g.mode = 'tournament' THEN 100 ELSE 25 END,
    true
FROM public.games g
CROSS JOIN LATERAL unnest(g.players) AS u(wallet_address)
WHERE g.status = 'settled'
LIMIT 4;
