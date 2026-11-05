import { err, validToken } from "@/lib/auth";
import { pickWeighted } from "@/lib/config";
import { getConfig, getPlayer, getStartKey, savePlayer } from "@/lib/store";

export const dynamic = "force-dynamic";

// Player reports how many rounds they won. If enough, the SERVER picks the gift by luck.
export async function POST(req) {
  try {
    const { t, sessionKey, wins } = await req.json().catch(() => ({}));
    if (!validToken(t)) return Response.json({ error: "Invalid link" }, { status: 404 });
    const p = await getPlayer(t);
    if (!p) return Response.json({ error: "Invalid link" }, { status: 404 });
    if (p.status !== "started") {
      return Response.json({ error: "This game is already finished", status: p.status }, { status: 409 });
    }
    const key = await getStartKey(t);
    if (!key || key !== sessionKey) return Response.json({ error: "Invalid session" }, { status: 403 });

    const cfg = await getConfig();
    const w = Math.max(0, Math.min(cfg.rounds, parseInt(wins) || 0));

    if (w < cfg.minWins) {
      await savePlayer(t, { ...p, status: "failed", wins: w, finishedAt: Date.now() });
      return Response.json({ passed: false, wins: w, needed: cfg.minWins });
    }

    const gifts = cfg.gifts.filter((g) => g.name);
    const index = pickWeighted(gifts);
    const gift = { name: gifts[index].name, emoji: gifts[index].emoji };
    await savePlayer(t, { ...p, status: "won", wins: w, gift, finishedAt: Date.now() });
    return Response.json({
      passed: true,
      wins: w,
      giftIndex: index,
      gifts: gifts.map((g, i) => ({ id: "g" + i, name: g.name, emoji: g.emoji })), // no weights
    });
  } catch (e) {
    return err(e);
  }
}
