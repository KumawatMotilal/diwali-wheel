import { randomBytes } from "node:crypto";
import { err, validToken } from "@/lib/auth";
import { buildPlan } from "@/lib/game";
import { claimStart, getConfig, getPlayer, savePlan, savePlayer } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 20; // live questions are fetched here (each source has a 3.5 s limit)

// One-time start. The first browser to call this gets a session key and the rounds
// (questions only, never the answers). Every other call gets 409 "already used".
export async function POST(req) {
  try {
    const { t, lang: l } = await req.json().catch(() => ({}));
    const lang = l === "hi" ? "hi" : "en";
    if (!validToken(t)) return Response.json({ error: "Invalid link" }, { status: 404 });
    const p = await getPlayer(t);
    if (!p) return Response.json({ error: "Invalid link" }, { status: 404 });
    if (p.status !== "new") {
      return Response.json({ error: "This link has already been used", status: p.status }, { status: 409 });
    }
    const cfg = await getConfig();
    const plan = await buildPlan(cfg, lang);
    const sessionKey = randomBytes(16).toString("base64url");
    const ok = await claimStart(t, sessionKey);
    if (!ok) return Response.json({ error: "This link has already been used", status: "started" }, { status: 409 });
    // the answer key stays on the server
    await savePlan(t, { types: plan.types, key: plan.key, minWins: cfg.minWins });
    await savePlayer(t, { ...p, status: "started", startedAt: Date.now() });
    return Response.json({ sessionKey, rounds: plan.rounds, minWins: cfg.minWins });
  } catch (e) {
    return err(e);
  }
}
