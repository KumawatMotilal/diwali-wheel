import { randomBytes } from "node:crypto";
import { checkAdmin, deny, err, validToken } from "@/lib/auth";
import { clearPlan, clearStart, deletePlayer, getPlayer, savePlayer } from "@/lib/store";

export const dynamic = "force-dynamic";

// Create players: { names: ["Ravi", "Priya"] } -> each gets a unique one-time token
export async function POST(req) {
  const auth = checkAdmin(req);
  if (!auth.ok) return deny(auth);
  try {
    const body = await req.json().catch(() => ({}));
    const names = (Array.isArray(body.names) ? body.names : [])
      .map((n) => String(n).trim().slice(0, 40))
      .filter(Boolean)
      .slice(0, 200);
    if (!names.length) return Response.json({ error: "Add at least one name" }, { status: 400 });
    const created = [];
    for (const name of names) {
      const token = randomBytes(9).toString("base64url");
      const player = { name, status: "new", wins: null, gift: null, createdAt: Date.now() };
      await savePlayer(token, player);
      created.push({ token, ...player });
    }
    return Response.json({ created });
  } catch (e) {
    return err(e);
  }
}

// Reset a player so the link can be used again: { token, action: "reset" }
export async function PATCH(req) {
  const auth = checkAdmin(req);
  if (!auth.ok) return deny(auth);
  try {
    const { token, action } = await req.json().catch(() => ({}));
    if (!validToken(token) || action !== "reset") return Response.json({ error: "Bad request" }, { status: 400 });
    const p = await getPlayer(token);
    if (!p) return Response.json({ error: "Player not found" }, { status: 404 });
    await clearStart(token);
    await clearPlan(token);
    await savePlayer(token, { name: p.name, status: "new", wins: null, gift: null, createdAt: p.createdAt });
    return Response.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}

// Delete a player: /api/admin/players?token=...
export async function DELETE(req) {
  const auth = checkAdmin(req);
  if (!auth.ok) return deny(auth);
  try {
    const token = new URL(req.url).searchParams.get("token");
    if (!validToken(token)) return Response.json({ error: "Bad request" }, { status: 400 });
    await deletePlayer(token);
    return Response.json({ ok: true });
  } catch (e) {
    return err(e);
  }
}
