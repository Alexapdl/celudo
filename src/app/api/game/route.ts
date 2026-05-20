import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

const ESCROW_ABI = [
  "function initializeGame(uint256 gameId, address token, uint256 betAmount, uint8 numPlayers, uint8 mode) external",
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

// POST /api/game
// Body: { wallet, mode, bet_amount, token_address?, num_players }
// mode: 'free' | 'solo' | 'duo' | '4player'
export async function POST(req: NextRequest) {
  const db = getSupabase();
  const body = await req.json().catch(() => null);
  if (!body?.wallet || !body?.mode || body?.num_players === undefined) {
    return NextResponse.json({ error: "wallet, mode, num_players are required" }, { status: 400 });
  }

  const wallet: string = (body.wallet as string).toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const numPlayers: number = Number(body.num_players);
  const betAmount: string = body.bet_amount ?? "0";
  const tokenAddress: string =
    body.token_address ?? process.env.NEXT_PUBLIC_USDM_ADDRESS ?? "";

  // Derive escrow mode byte: 0 = Solo 1v1 (2p), 1 = Duo 2v2 (4p), 2 = 4-Player FFA (4p)
  const modeMap: Record<string, number> = { solo: 0, duo: 1, "4player": 2 };
  const escrowMode: number = modeMap[body.mode] ?? -1;

  // Insert game row; on_chain_game_id is auto-assigned by BIGSERIAL
  const { data: gameRow, error: insertErr } = await db
    .from("games")
    .insert({
      mode: body.mode,
      bet_amount: betAmount,
      token_address: tokenAddress || null,
      players: [wallet],
      status: "waiting",
    })
    .select()
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // If this is a cash bet game, initialise on-chain
  if (escrowMode >= 0 && parseFloat(betAmount) > 0) {
    const contract = getAdminContract();
    if (contract) {
      try {
        const betWei = parseUnits(betAmount, 18);
        const tx = await contract.initializeGame(
          gameRow.on_chain_game_id,
          tokenAddress,
          betWei,
          numPlayers,
          escrowMode
        );
        await tx.wait();
      } catch (err: unknown) {
        // On-chain init failed — mark game cancelled and surface error
        await getSupabase().from("games").update({ status: "cancelled" }).eq("id", gameRow.id);
        const msg = err instanceof Error ? err.message : "On-chain initializeGame failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }
    // If contract is unconfigured (dev mode), skip on-chain step silently
  }

  return NextResponse.json(gameRow, { status: 201 });
}

// GET /api/game?status=waiting
export async function GET(req: NextRequest) {
  const db = getSupabase();
  const status = req.nextUrl.searchParams.get("status") ?? "waiting";
  const allowed = ["waiting", "active", "settled", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data, error } = await db
    .from("games")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
