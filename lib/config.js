import { CAT_KEYS } from "./cats";
import { DEFAULT_QUESTIONS } from "./questions";
export { newId } from "./ids";
import { newId } from "./ids";

export { DEFAULT_QUESTIONS };

// Note: the question bank is NOT part of DEFAULT_CONFIG. It holds answers and lives on the server only.
export const DEFAULT_CONFIG = {
  name: "Diwali Lucky Wheel",
  rounds: 10, // how many mini games a player plays
  minWins: 8, // how many they must win to unlock the wheel
  reactionMs: 1100, // time to tap the real diya (Tap the Diya)
  quizMs: 12000, // time to answer a quiz question
  mathMs: 8000, // time to answer a quick math question
  games: { quiz: true, tap: true, math: true }, // which round types are used
  cats: CAT_KEYS, // which quiz categories are used
  gifts: [
    { id: "g1", name: "Gold Coin", emoji: "🪙", weight: 5 },
    { id: "g2", name: "Sweet Box", emoji: "🍬", weight: 30 },
    { id: "g3", name: "Diya Set", emoji: "🪔", weight: 25 },
    { id: "g4", name: "Dry Fruits", emoji: "🥜", weight: 20 },
    { id: "g5", name: "Gift Voucher", emoji: "🎁", weight: 10 },
    { id: "g6", name: "Rangoli Kit", emoji: "🎨", weight: 10 },
  ],
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function sanitizeQuestions(list) {
  if (!Array.isArray(list)) return DEFAULT_QUESTIONS;
  const seen = new Set();
  const out = [];
  for (const x of list) {
    if (!x || !CAT_KEYS.includes(x.cat)) continue;
    const q = String(x.q ?? "").trim().slice(0, 200);
    const options = (Array.isArray(x.options) ? x.options : []).map((o) => String(o ?? "").trim().slice(0, 80));
    const answer = Number.isInteger(x.answer) ? x.answer : parseInt(x.answer);
    if (!q || options.length !== 4 || options.some((o) => !o)) continue;
    if (new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
    if (!(answer >= 0 && answer < 4)) continue;
    if (seen.has(q.toLowerCase())) continue;
    seen.add(q.toLowerCase());
    out.push({ id: String(x.id || newId()).slice(0, 20), cat: x.cat, q, options, answer });
    if (out.length >= 300) break;
  }
  return out;
}

// Cleans whatever the admin sends, throws a readable message if invalid
export function sanitizeConfig(input) {
  const gifts = (Array.isArray(input?.gifts) ? input.gifts : [])
    .map((g) => ({
      id: String(g.id || newId()).slice(0, 20),
      name: String(g.name || "").trim().slice(0, 40),
      emoji: String(g.emoji || "🎁").slice(0, 8),
      weight: clamp(Number(g.weight) || 0, 0, 100000),
    }))
    .filter((g) => g.name)
    .slice(0, 12);
  if (gifts.length < 2) throw new Error("Add at least 2 gifts");
  const rounds = clamp(parseInt(input.rounds) || 10, 1, 30);
  const minWins = clamp(parseInt(input.minWins) || 1, 1, rounds);
  const reactionMs = clamp(parseInt(input.reactionMs) || DEFAULT_CONFIG.reactionMs, 400, 5000);
  const quizMs = clamp(parseInt(input.quizMs) || DEFAULT_CONFIG.quizMs, 3000, 60000);
  const mathMs = clamp(parseInt(input.mathMs) || DEFAULT_CONFIG.mathMs, 3000, 60000);
  let games = {
    quiz: input.games ? !!input.games.quiz : true,
    tap: input.games ? !!input.games.tap : true,
    math: input.games ? !!input.games.math : true,
  };
  if (!games.quiz && !games.tap && !games.math) games = { ...DEFAULT_CONFIG.games };
  let cats = (Array.isArray(input.cats) ? input.cats : CAT_KEYS).filter((c) => CAT_KEYS.includes(c));
  cats = [...new Set(cats)];
  if (!cats.length) cats = [...CAT_KEYS];
  const questions = sanitizeQuestions(input.questions);
  const name = String(input.name || "").trim().slice(0, 60) || DEFAULT_CONFIG.name;
  return { name, rounds, minWins, reactionMs, quizMs, mathMs, games, cats, questions, gifts };
}

// Luck based pick: higher weight = higher chance (crypto randomness)
export function pickWeighted(gifts) {
  const total = gifts.reduce((s, g) => s + Math.max(0, Number(g.weight) || 0), 0);
  const rand = new Uint32Array(1);
  globalThis.crypto.getRandomValues(rand);
  const r = rand[0] / 4294967296;
  if (total <= 0) return Math.floor(r * gifts.length);
  let t = r * total;
  for (let i = 0; i < gifts.length; i++) {
    t -= Math.max(0, Number(gifts[i].weight) || 0);
    if (t < 0) return i;
  }
  return gifts.length - 1;
}
