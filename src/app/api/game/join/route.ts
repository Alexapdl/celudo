import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

// POST /api/game/join
// Body: { game_id, wallet }
export async function POST(req: NextRequest) {
  const db = getSupabase();
  const body = await req.json().catch(() => null);
  if (!body?.game_id || !body?.wallet) {
    return NextResponse.json({ error: "game_id and wallet are required" }, { status: 400 });
  }

  const wallet: string = (body.wallet as string).toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  // Fetch current game
  const { data: game, error: fetchErr } = await db
    .from("games")
    .select("id, status, players, mode")
    .eq("id", body.game_id)
    .single();

  if (fetchErr || !game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  if (game.status !== "waiting") {
    return NextResponse.json({ error: "Game is not open for joining" }, { status: 409 });
  }
  if ((game.players as string[]).includes(wallet)) {
    return NextResponse.json({ error: "Already joined" }, { status: 409 });
  }

  // Append player
  const updatedPlayers = [...(game.players as string[]), wallet];
  const { data, error: updateErr } = await db
    .from("games")
    .update({ players: updatedPlayers })
    .eq("id", body.game_id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
  return NextResponse.json(data);
}
