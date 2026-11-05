export const DEFAULT_CONFIG = {
  name: "Diwali Lucky Wheel",
  oneSpin: true,
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

// Config -> short URL-safe string (works with any language / emoji)
export function encodeConfig(cfg) {
  const json = JSON.stringify({
    n: cfg.name,
    o: cfg.oneSpin ? 1 : 0,
    g: cfg.gifts.map((g) => [g.name, g.emoji, Number(g.weight) || 0]),
  });
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfig(str) {
  try {
    const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const d = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(d.g) || d.g.length < 2) return null;
    return {
      name: String(d.n || "Diwali Lucky Wheel"),
      oneSpin: d.o === 1,
      gifts: d.g.map((x, i) => ({
        id: "g" + i,
        name: String(x[0] || "Gift"),
        emoji: String(x[1] || "🎁"),
        weight: Number(x[2]) || 0,
      })),
    };
  } catch {
    return null;
  }
}

// Luck based pick: higher weight = higher chance. Uses crypto randomness.
export function pickWeighted(gifts) {
  const total = gifts.reduce((s, g) => s + Math.max(0, Number(g.weight) || 0), 0);
  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  const r = rand[0] / 4294967296;
  if (total <= 0) return Math.floor(r * gifts.length);
  let t = r * total;
  for (let i = 0; i < gifts.length; i++) {
    t -= Math.max(0, Number(gifts[i].weight) || 0);
    if (t < 0) return i;
  }
  return gifts.length - 1;
}

export function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
