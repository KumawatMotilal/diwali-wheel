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
  quiz: { label: "Surprise Quiz", glyph: "?", color: "#b45309", desc: "Easy random questions picked live from the internet, plus silly ones" },
  joke: { label: "Punchline Match", glyph: ":)", color: "#db2777", desc: "Read the joke, pick the right punchline" },
  laddu: { label: "Laddu or Boom", glyph: "!", color: "#ea580c", desc: "Tap the laddus, dodge the crackers" },
  math: { label: "Quick Math", glyph: "×", color: "#15803d", desc: "Fast sums with tricky order of operations" },
  tap: { label: "Tap the Diya", glyph: "◉", color: "#c2410c", desc: "Tap only the real diya, ignore the decoys" },
  scramble: { label: "Word Scramble", glyph: "Aa", color: "#be185d", desc: "Unscramble Diwali and India words" },
  sequence: { label: "Number Pattern", glyph: "#", color: "#4338ca", desc: "Find the next number in the pattern" },
  odd: { label: "Odd One Out", glyph: "≠", color: "#0f766e", desc: "Spot the one icon that is different" },
  memory: { label: "Diya Memory", glyph: "♪", color: "#7e22ce", desc: "Watch the diyas light up, then repeat the order" },
};
export const GAME_KEYS = Object.keys(GAMES);

// Labels for questions that come from the internet or the funny bank (not admin categories).
export const ROUND_LABELS = { online: "Surprise question", funny: "Funny question" };

// Hindi names for the round types (client safe)
export const GAMES_HI = {
  quiz: { label: "सरप्राइज़ क्विज़", desc: "आसान और मज़ेदार सवाल" },
  joke: { label: "पंचलाइन मिलाओ", desc: "चुटकुला पढ़ो, सही पंचलाइन चुनो" },
  laddu: { label: "लड्डू या बम", desc: "लड्डू पर टैप करो, पटाखे से बचो" },
  math: { label: "झटपट गणित", desc: "तेज़ जोड़-घटाव, चालाक सवालों से सावधान" },
  tap: { label: "दिया पकड़ो", desc: "सिर्फ़ असली दिये पर टैप करो, नकली से बचो" },
  scramble: { label: "शब्द पहेली", desc: "दिवाली और भारत के शब्द सुलझाओ" },
  sequence: { label: "संख्या पैटर्न", desc: "अगली संख्या ढूँढो" },
  odd: { label: "अलग कौन?", desc: "अलग दिखने वाला आइकन ढूँढो" },
  memory: { label: "दिया याद रखो", desc: "दिये जलने का क्रम देखो, फिर दोहराओ" },
};
export const gameInfo = (lang, k) => ({ ...GAMES[k], ...(lang === "hi" ? GAMES_HI[k] : {}) });
