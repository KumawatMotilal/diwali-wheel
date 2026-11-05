import { err, validToken } from "@/lib/auth";
import { getConfig, getPlayer } from "@/lib/store";

export const dynamic = "force-dynamic";

// Public: what the player page needs. Never returns luck weights.
export async function GET(req) {
  try {
    const t = new URL(req.url).searchParams.get("t") || "";
    if (!validToken(t)) return Response.json({ error: "Invalid link" }, { status: 404 });
    const p = await getPlayer(t);
    if (!p) return Response.json({ error: "Invalid link" }, { status: 404 });
    const cfg = await getConfig();
    return Response.json({
      name: p.name,
      status: p.status,
      wins: p.wins ?? null,
      gift: p.gift || null,
      game: { name: cfg.name, rounds: cfg.rounds, minWins: cfg.minWins, reactionMs: cfg.reactionMs },
    });
  } catch (e) {
    return err(e);
  }
}
