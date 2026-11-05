export const DEFAULT_CONFIG = {
  name: "Diwali Lucky Wheel",
  rounds: 10, // how many mini games a player plays
  minWins: 8, // how many they must win to unlock the wheel
  reactionMs: 1400, // time to tap the diya in each round
  gifts: [
    { id: "g1", name: "Gold Coin", emoji: "🪙", weight: 5 },
    { id: "g2", name: "Sweet Box", emoji: "🍬", weight: 30 },
    { id: "g3", name: "Diya Set", emoji: "🪔", weight: 25 },
    { id: "g4", name: "Dry Fruits", emoji: "🥜", weight: 20 },
    { id: "g5", name: "Gift Voucher", emoji: "🎁", weight: 10 },
    { id: "g6", name: "Rangoli Kit", emoji: "🎨", weight: 10 },
  ],
};

export function newId() {
  return "g" + Math.random().toString(36).slice(2, 9);
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

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
  const reactionMs = clamp(parseInt(input.reactionMs) || 1400, 400, 5000);
  const name = String(input.name || "").trim().slice(0, 60) || DEFAULT_CONFIG.name;
  return { name, rounds, minWins, reactionMs, gifts };
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
