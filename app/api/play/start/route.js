import { randomBytes } from "node:crypto";
import { err, validToken } from "@/lib/auth";
import { claimStart, getPlayer, savePlayer } from "@/lib/store";

export const dynamic = "force-dynamic";

// One-time start. The first browser to call this gets a session key,
// every other call (same or another browser) gets 409 "already used".
export async function POST(req) {
  try {
    const { t } = await req.json().catch(() => ({}));
    if (!validToken(t)) return Response.json({ error: "Invalid link" }, { status: 404 });
    const p = await getPlayer(t);
    if (!p) return Response.json({ error: "Invalid link" }, { status: 404 });
    if (p.status !== "new") {
      return Response.json({ error: "This link has already been used", status: p.status }, { status: 409 });
    }
    const sessionKey = randomBytes(16).toString("base64url");
    const ok = await claimStart(t, sessionKey);
    if (!ok) return Response.json({ error: "This link has already been used", status: "started" }, { status: 409 });
    await savePlayer(t, { ...p, status: "started", startedAt: Date.now() });
    return Response.json({ sessionKey });
  } catch (e) {
    return err(e);
  }
}
