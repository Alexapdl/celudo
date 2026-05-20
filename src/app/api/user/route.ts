import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

// GET /api/user?wallet=0x...
// Returns user profile, auto-registering if not found
export async function GET(req: NextRequest) {
  const db = getSupabase();
  const wallet = req.nextUrl.searchParams.get("wallet")?.toLowerCase();
  if (!wallet || !/^0x[0-9a-f]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  // Upsert: return existing user or create a new one
  const { data, error } = await db
    .from("users")
    .upsert({ wallet_address: wallet }, { onConflict: "wallet_address", ignoreDuplicates: true })
    .select()
    .single();

  if (error && error.code !== "23505") {
    // If upsert failed for a non-duplicate reason, try plain select
    const { data: existing, error: selectErr } = await db
      .from("users")
      .select("*")
      .eq("wallet_address", wallet)
      .single();
    if (selectErr) return NextResponse.json({ error: selectErr.message }, { status: 500 });
    return NextResponse.json(existing);
  }

  return NextResponse.json(data);
}

// POST /api/user
// Body: { wallet, username?, points?, staked_balance?, earned_yield?, games_played?, wins? }
export async function POST(req: NextRequest) {
  const db = getSupabase();
  const body = await req.json().catch(() => null);
  if (!body?.wallet) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }

  const wallet: string = (body.wallet as string).toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  const allowed = ["username", "points", "staked_balance", "earned_yield", "games_played", "wins"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await db
    .from("users")
    .update(updates)
    .eq("wallet_address", wallet)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
