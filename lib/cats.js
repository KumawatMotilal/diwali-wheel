// Quiz categories. Safe to import in the browser (no answers here).
export const CATS = {
  bollywood: { label: "Bollywood", emoji: "🎬" },
  gujarat: { label: "Gujarat", emoji: "🦁" },
  history: { label: "India History", emoji: "🏛️" },
  politics: { label: "Politics", emoji: "🗳️" },
  festival: { label: "Diwali & Festivals", emoji: "🪔" },
  sports: { label: "Sports", emoji: "🏏" },
  general: { label: "General Knowledge", emoji: "🧠" },
};
export const CAT_KEYS = Object.keys(CATS);

// Round types shown in admin and on the intro screen (client safe).
export const GAMES = {
  quiz: { label: "Quiz", glyph: "?", color: "#b45309", desc: "Bollywood, Gujarat, history, politics and more" },
  math: { label: "Quick Math", glyph: "×", color: "#15803d", desc: "Fast sums with tricky order of operations" },
  tap: { label: "Tap the Diya", glyph: "◉", color: "#c2410c", desc: "Tap only the real diya, ignore the decoys" },
  scramble: { label: "Word Scramble", glyph: "Aa", color: "#be185d", desc: "Unscramble Diwali and India words" },
  sequence: { label: "Number Pattern", glyph: "#", color: "#4338ca", desc: "Find the next number in the pattern" },
  odd: { label: "Odd One Out", glyph: "≠", color: "#0f766e", desc: "Spot the one icon that is different" },
  memory: { label: "Diya Memory", glyph: "♪", color: "#7e22ce", desc: "Watch the diyas light up, then repeat the order" },
};
export const GAME_KEYS = Object.keys(GAMES);
