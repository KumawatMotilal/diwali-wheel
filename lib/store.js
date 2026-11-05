import { DEFAULT_CONFIG, DEFAULT_QUESTIONS } from "./config";

// Storage: Upstash Redis (Vercel Marketplace) in production.
// Local dev without Redis env vars falls back to in-memory storage.

const KEYS = {
  config: "dw:config",
  players: "dw:players",
  start: (t) => `dw:start:${t}`,
  plan: (t) => `dw:plan:${t}`,
};

const mem = (globalThis.__dwMem ||= { kv: new Map(), h: new Map() });

function redisConf() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

export function dbMode() {
  return redisConf() ? "redis" : "memory";
}

function guard() {
  if (!redisConf() && process.env.NODE_ENV === "production") throw new Error("NO_DB");
}

async function cmd(args) {
  const c = redisConf();
  const res = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Redis error");
  return data.result;
}

async function kvGet(k) {
  guard();
  if (redisConf()) return cmd(["GET", k]);
  return mem.kv.has(k) ? mem.kv.get(k) : null;
}
async function kvSet(k, v) {
  guard();
  if (redisConf()) return cmd(["SET", k, v]);
  mem.kv.set(k, v);
}
async function kvSetNx(k, v) {
  guard();
  if (redisConf()) return (await cmd(["SET", k, v, "NX"])) === "OK";
  if (mem.kv.has(k)) return false;
  mem.kv.set(k, v);
  return true;
}
async function kvDel(k) {
  guard();
  if (redisConf()) return cmd(["DEL", k]);
  mem.kv.delete(k);
}
async function hGetAll(k) {
  guard();
  if (redisConf()) {
    const r = await cmd(["HGETALL", k]);
    if (Array.isArray(r)) {
      const o = {};
      for (let i = 0; i < r.length; i += 2) o[r[i]] = r[i + 1];
      return o;
    }
    return r || {};
  }
  return Object.fromEntries(mem.h.get(k) || []);
}
async function hGet(k, f) {
  guard();
  if (redisConf()) return cmd(["HGET", k, f]);
  return mem.h.get(k)?.get(f) ?? null;
}
async function hSet(k, f, v) {
  guard();
  if (redisConf()) return cmd(["HSET", k, f, v]);
  if (!mem.h.has(k)) mem.h.set(k, new Map());
  mem.h.get(k).set(f, v);
}
async function hDel(k, f) {
  guard();
  if (redisConf()) return cmd(["HDEL", k, f]);
  mem.h.get(k)?.delete(f);
}

// ---------- game config ----------
export async function getConfig() {
  const raw = await kvGet(KEYS.config);
  const base = { ...DEFAULT_CONFIG, questions: DEFAULT_QUESTIONS };
  if (!raw) return base;
  try {
    // merge so configs saved by older versions still get the new settings
    const saved = JSON.parse(raw);
    return { ...base, ...saved, games: { ...base.games, ...(saved.games || {}) } };
  } catch {
    return base;
  }
}
export async function saveConfig(cfg) {
  await kvSet(KEYS.config, JSON.stringify(cfg));
}

// ---------- players ----------
// player = { name, status: new|started|failed|won, wins, gift, createdAt, startedAt, finishedAt }
export async function listPlayers() {
  const all = await hGetAll(KEYS.players);
  return Object.entries(all)
    .map(([token, raw]) => {
      try {
        return { token, ...JSON.parse(raw) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}
export async function getPlayer(token) {
  const raw = await hGet(KEYS.players, token);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export async function savePlayer(token, player) {
  await hSet(KEYS.players, token, JSON.stringify(player));
}
export async function deletePlayer(token) {
  await hDel(KEYS.players, token);
  await kvDel(KEYS.start(token));
  await kvDel(KEYS.plan(token));
}

// ---------- one-time start lock ----------
export async function claimStart(token, sessionKey) {
  return kvSetNx(KEYS.start(token), sessionKey);
}
export async function getStartKey(token) {
  return kvGet(KEYS.start(token));
}
export async function clearStart(token) {
  return kvDel(KEYS.start(token));
}

// ---------- answer key for a running game (server only) ----------
export async function savePlan(token, plan) {
  await kvSet(KEYS.plan(token), JSON.stringify(plan));
}
export async function getPlan(token) {
  const raw = await kvGet(KEYS.plan(token));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export async function clearPlan(token) {
  return kvDel(KEYS.plan(token));
}
