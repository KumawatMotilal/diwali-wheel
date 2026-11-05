import { err, validToken } from "@/lib/auth";
import { pickWeighted } from "@/lib/config";
import { gradePlan, minPlayMs } from "@/lib/game";
import { clearPlan, getConfig, getPlan, getPlayer, getStartKey, savePlayer } from "@/lib/store";

export const dynamic = "force-dynamic";

// Player sends their answers. The SERVER grades them against the answer key it kept at start.
// If enough are right, the server picks the gift by luck.
export async function POST(req) {
  try {
    const { t, sessionKey, answers } = await req.json().catch(() => ({}));
    if (!validToken(t)) return Response.json({ error: "Invalid link" }, { status: 404 });
    const p = await getPlayer(t);
    if (!p) return Response.json({ error: "Invalid link" }, { status: 404 });
    if (p.status !== "started") {
      return Response.json({ error: "This game is already finished", status: p.status }, { status: 409 });
    }
    const key = await getStartKey(t);
    if (!key || key !== sessionKey) return Response.json({ error: "Invalid session" }, { status: 403 });
    const plan = await getPlan(t);
    if (!plan) return Response.json({ error: "Game data missing. Ask the organiser to reset your link." }, { status: 409 });

    const rounds = plan.key.length;
    let wins = gradePlan(plan, answers).wins;
    // impossible speed = scripted submission
    if (Date.now() - (p.startedAt || 0) < minPlayMs(rounds)) wins = 0;

    const needed = plan.minWins;
    if (wins < needed) {
      await savePlayer(t, { ...p, status: "failed", wins, finishedAt: Date.now() });
      await clearPlan(t);
      return Response.json({ passed: false, wins, needed, rounds });
    }

    const cfg = await getConfig();
    const gifts = cfg.gifts.filter((g) => g.name);
    const index = pickWeighted(gifts);
    const gift = { name: gifts[index].name, emoji: gifts[index].emoji };
    await savePlayer(t, { ...p, status: "won", wins, gift, finishedAt: Date.now() });
    await clearPlan(t);
    return Response.json({
      passed: true,
      wins,
      rounds,
      giftIndex: index,
      gifts: gifts.map((g, i) => ({ id: "g" + i, name: g.name, emoji: g.emoji })), // no weights
    });
  } catch (e) {
    return err(e);
  }
}
