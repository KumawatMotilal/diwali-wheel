import { checkAdmin, deny, err } from "@/lib/auth";
import { sanitizeConfig } from "@/lib/config";
import { saveConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const auth = checkAdmin(req);
  if (!auth.ok) return deny(auth);
  let config;
  try {
    config = sanitizeConfig(await req.json());
  } catch (e) {
    return Response.json({ error: e.message || "Invalid settings" }, { status: 400 });
  }
  try {
    await saveConfig(config);
    return Response.json({ config });
  } catch (e) {
    return err(e);
  }
}
