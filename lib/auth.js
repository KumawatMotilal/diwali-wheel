import { timingSafeEqual } from "node:crypto";

// Admin password comes from the ADMIN_PASSWORD env var.
// Only in local dev, "diwali123" is used if it is not set.
export function checkAdmin(req) {
  const expected =
    process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== "production" ? "diwali123" : "");
  if (!expected) return { ok: false, status: 500, error: "Set ADMIN_PASSWORD in Vercel environment variables" };
  const given = Buffer.from(req.headers.get("x-admin-key") || "");
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return { ok: false, status: 401, error: "Wrong password" };
  }
  return { ok: true };
}

export function deny(auth) {
  return Response.json({ error: auth.error }, { status: auth.status });
}

export function validToken(t) {
  return typeof t === "string" && /^[A-Za-z0-9_-]{6,32}$/.test(t);
}

export function err(e) {
  const msg =
    e?.message === "NO_DB"
      ? "Database not connected. Add Upstash Redis from Vercel Storage and redeploy."
      : e?.message || "Server error";
  return Response.json({ error: msg }, { status: 500 });
}
