import { checkAdmin, deny, err } from "@/lib/auth";
import { dbMode, getConfig, listPlayers } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const auth = checkAdmin(req);
  if (!auth.ok) return deny(auth);
  try {
    const [config, players] = await Promise.all([getConfig(), listPlayers()]);
    return Response.json({ config, players, db: dbMode() });
  } catch (e) {
    return err(e);
  }
}
