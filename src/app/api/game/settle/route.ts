import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { JsonRpcProvider, Wallet, Contract } from "ethers";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

const ESCROW_ABI = [
  "function settleGame(uint256 gameId, address[] calldata winners) external",
  "function cancelGame(uint256 gameId) external",
];

function getAdminContract(): Contract | null {
  const pk = process.env.ADMIN_PRIVATE_KEY;
  const rpc = process.env.NEXT_PUBLIC_CELO_RPC_URL;
  const addr = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS;
  if (!pk || !rpc || !addr || pk.startsWith("0xYour")) return null;
  const provider = new JsonRpcProvider(rpc);
  const signer = new Wallet(pk, provider);
  return new Contract(addr, ESCROW_ABI, signer);
}

// Points awarded per game mode
const POINTS_CONFIG: Record<string, { base: number; win: number }> = {
  free: { base: 10, win: 25 },
  solo: { base: 5, win: 15 },
  duo: { base: 8, win: 20 },
  "4player": { base: 10, win: 25 },
  tournament: { base: 20, win: 100 },
};

// POST /api/game/settle
// Body: { game_id, winners: string[] }
// winners: array of wallet addresses (lowercase) that won the game
export async function POST(req: NextRequest) {
  const db = getSupabase();
  const body = await req.json().catch(() => null);
  if (!body?.game_id || !Array.isArray(body?.winners)) {
    return NextResponse.json({ error: "game_id and winners[] are required" }, { status: 400 });
  }

  const winners: string[] = (body.winners as string[]).map((w) => w.toLowerCase());
  for (const w of winners) {
    if (!/^0x[0-9a-f]{40}$/.test(w)) {
      return NextResponse.json({ error: `Invalid winner address: ${w}` }, { status: 400 });
    }
  }

  // Fetch game row
  const { data: game, error: fetchErr } = await db
    .from("games")
    .select("*")
    .eq("id", body.game_id)
    .single();

  if (fetchErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status === "settled") {
    return NextResponse.json({ error: "Game already settled" }, { status: 409 });
  }
  if (game.status === "cancelled") {
    return NextResponse.json({ error: "Game was cancelled" }, { status: 409 });
  }

  const isCashBet = parseFloat(game.bet_amount) > 0;

  // --- On-chain settlement ---
  if (isCashBet) {
    const contract = getAdminContract();
    if (contract) {
      try {
        const tx = await contract.settleGame(game.on_chain_game_id, winners);
        await tx.wait();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "On-chain settleGame failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }
    // Dev mode: skip on-chain if contract not configured
  }

  // --- Update game row ---
  const { error: gameUpdateErr } = await db
    .from("games")
    .update({ status: "settled", winners })
    .eq("id", body.game_id);

  if (gameUpdateErr) return NextResponse.json({ error: gameUpdateErr.message }, { status: 500 });

  // --- Update player stats & insert history ---
  const players: string[] = game.players as string[];
  const pts = POINTS_CONFIG[game.mode] ?? POINTS_CONFIG.free;

  const historyRows: object[] = [];

  for (const player of players) {
    const isWinner = winners.includes(player);
    const pointsEarned = pts.base + (isWinner ? pts.win : 0);

    // Fetch current user stats
    const { data: user } = await db
      .from("users")
      .select("points, games_played, wins")
      .eq("wallet_address", player)
      .single();

    if (user) {
      await db
        .from("users")
        .update({
          points: (user.points as number) + pointsEarned,
          games_played: (user.games_played as number) + 1,
          wins: (user.wins as number) + (isWinner ? 1 : 0),
        })
        .eq("wallet_address", player);
    }

    historyRows.push({
      user_wallet: player,
      game_id: game.id,
      mode: game.mode,
      points_earned: pointsEarned,
      won: isWinner,
    });
  }

  if (historyRows.length > 0) {
    await getSupabase().from("game_history").insert(historyRows);
  }

  return NextResponse.json({ ok: true, winners, game_id: body.game_id });
}
