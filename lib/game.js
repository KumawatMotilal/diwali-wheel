// Game engine. SERVER ONLY (it sees the answer key). The browser only receives `plan.rounds`,
// which has no answers. `plan.types` and `plan.key` stay on the server and are used for grading.
//
// Round types:
//   quiz - multiple choice question from the question bank
//   math - quick mental math, multiple choice
//   tap  - several tiles light up, only the real diya counts, the rest are decoys
//   joke - match a joke with its punchline (jokes come live from the internet)
//   laddu - laddus and crackers pop up one by one: tap laddus, never a cracker

import { fetchJokes, fetchTrivia } from "./online";
import { FUNNY_QUESTIONS, LOCAL_JOKES } from "./funny";

const TYPE_WEIGHTS = { quiz: 4, joke: 3, laddu: 2, tap: 2, math: 2, scramble: 2, sequence: 2, odd: 1, memory: 2 };
const DECOYS = ["cracker", "star", "moon", "bell", "sun"];
const SIMILAR = [["marigold", "rangoli"], ["lotus", "marigold"], ["star", "sun"], ["laddu", "coin"], ["gift", "lantern"], ["cracker", "bell"], ["moon", "sun"]];
const WORDS = [
  ["DIWALI", "Festival of lights"], ["DIYA", "Clay lamp"], ["RANGOLI", "Colour art at the doorstep"], ["LAKSHMI", "Goddess of wealth"],
  ["MITHAI", "Indian sweets"], ["JALEBI", "Orange, sticky and crispy"], ["LADDU", "Round sweet"], ["GARBA", "Navratri dance"],
  ["DHOKLA", "Steamed Gujarati snack"], ["GUJARAT", "Home of the Gir lions"], ["DANDIYA", "Dance with sticks"], ["LANTERN", "Akash kandil"],
  ["RAMAYANA", "Epic of Lord Rama"], ["AYODHYA", "Rama's city"], ["CRICKET", "Bat and ball"], ["PEACOCK", "India's national bird"],
  ["LOTUS", "India's national flower"], ["FIREWORKS", "Light up the night sky"], ["BOLLYWOOD", "Mumbai's film industry"], ["SPARKLER", "Phuljhari"],
  ["SOMNATH", "Temple by the sea"], ["KITE", "Flown on Uttarayan"], ["PATOLA", "Famous Patan silk"], ["MARIGOLD", "Orange festive flower"],
];

function rnd(n) {
  const a = new Uint32Array(1);
  globalThis.crypto.getRandomValues(a);
  return Math.floor((a[0] / 4294967296) * n);
}
const between = (lo, hi) => lo + rnd(hi - lo + 1);
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- round makers ----------
function makeQuiz(q, ms) {
  const order = shuffle([0, 1, 2, 3]);
  const options = order.map((i) => q.options[i]);
  const correct = order.indexOf(q.answer);
  return { pub: { type: "quiz", cat: q.cat, q: q.q, options, ms }, key: correct };
}

function makeMath(ms) {
  let expr, ans, trap = null;
  const kind = rnd(5);
  if (kind === 0) {
    const a = between(23, 98), b = between(17, 89);
    expr = `${a} + ${b}`; ans = a + b;
  } else if (kind === 1) {
    const a = between(60, 150), b = between(17, 58);
    expr = `${a} − ${b}`; ans = a - b;
  } else if (kind === 2) {
    const a = between(6, 15), b = between(4, 12);
    expr = `${a} × ${b}`; ans = a * b;
  } else if (kind === 3) {
    const a = between(10, 40), b = between(3, 9), c = between(3, 9);
    expr = `${a} + ${b} × ${c}`; ans = a + b * c; trap = (a + b) * c; // precedence trap
  } else {
    const a = between(5, 12), b = between(4, 9), c = between(5, 40);
    expr = `${a} × ${b} − ${c}`; ans = a * b - c; trap = a * (b - c);
  }
  const cand = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ans + 5, ans - 5];
  let pool = shuffle(cand).filter((x) => x !== ans && x >= 0);
  const wrong = [];
  if (trap !== null && trap !== ans && trap >= 0) wrong.push(trap);
  for (const x of pool) {
    if (wrong.length >= 3) break;
    if (!wrong.includes(x)) wrong.push(x);
  }
  let k = 11;
  while (wrong.length < 3) { if (!wrong.includes(ans + k)) wrong.push(ans + k); k++; }
  const options = shuffle([ans, ...wrong]).map(String);
  return { pub: { type: "math", q: expr + " = ?", options, ms }, key: options.indexOf(String(ans)) };
}

function makeTap(ms) {
  const decoyCount = between(2, 4);
  const tiles = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, decoyCount + 1);
  const diya = tiles[0];
  const icons = shuffle(DECOYS);
  const lit = tiles.map((i, n) => ({ i, icon: n === 0 ? "🪔" : icons[(n - 1) % icons.length] }));
  return { pub: { type: "tap", diya, lit: shuffle(lit), ms }, key: diya };
}

function mcq(ans, extra = []) {
  const cand = shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10, ...extra]).filter((x) => x !== ans && x > 0);
  const wrong = [...new Set(cand)].slice(0, 3);
  for (let k = 11; wrong.length < 3; k++) if (!wrong.includes(ans + k)) wrong.push(ans + k);
  const options = shuffle([ans, ...wrong]).map(String);
  return { options, key: options.indexOf(String(ans)) };
}

function makeSeq(ms) {
  const k = rnd(4), t = [];
  if (k === 0) { const s = between(3, 30), d = between(3, 9); for (let i = 0; i < 6; i++) t.push(s + i * d); }
  else if (k === 1) { const s = between(2, 4), r = between(2, 3); for (let i = 0; i < 6; i++) t.push(s * r ** i); }
  else if (k === 2) { const s = between(2, 9); for (let i = 0; i < 6; i++) t.push((s + i) ** 2); }
  else { let v = between(1, 12); for (let i = 0; i < 6; i++) { t.push(v); v += i + 1; } }
  const { options, key } = mcq(t[5], [t[4]]);
  return { pub: { type: "sequence", q: t.slice(0, 5).join(", ") + ", ?", options, ms }, key };
}

function makeOdd(ms) {
  const [a, b] = shuffle(SIMILAR[rnd(SIMILAR.length)]);
  const cells = Array(16).fill(a), idx = rnd(16);
  cells[idx] = b;
  return { pub: { type: "odd", cells, ms }, key: idx };
}

function makeMemory(ms0) {
  const len = between(4, 6), seq = Array.from({ length: len }, () => rnd(4));
  return { pub: { type: "memory", seq, ms: 3000 + len * 1500 }, key: seq };
}

function makeScramble(ms) {
  const [word, hint] = WORDS[rnd(WORDS.length)];
  let letters = shuffle(word.split(""));
  for (let n = 0; n < 10 && letters.join("") === word; n++) letters = shuffle(letters);
  return { pub: { type: "scramble", hint, letters, ms }, key: word };
}

function makeJoke(joke, pool, ms) {
  // 1 right punchline + 3 punchlines that belong to other jokes
  const others = shuffle(pool.filter((j) => j.delivery !== joke.delivery && j.setup !== joke.setup));
  const wrong = [];
  for (const j of others) if (wrong.length < 3 && !wrong.includes(j.delivery)) wrong.push(j.delivery);
  const options = shuffle([joke.delivery, ...wrong]);
  return { pub: { type: "joke", q: joke.setup, options, ms }, key: options.indexOf(joke.delivery) };
}

function makeLaddu() {
  // 8 pops: 5 laddus, 3 crackers (never a cracker first). Player must tap the laddus and no cracker.
  const kinds = shuffle(["L", "L", "L", "L", "L", "B", "B", "B"]);
  if (kinds[0] === "B") { const k = kinds.indexOf("L"); [kinds[0], kinds[k]] = [kinds[k], kinds[0]]; }
  let prev = -1;
  const steps = kinds.map((k) => {
    let cell = rnd(9);
    while (cell === prev) cell = rnd(9);
    prev = cell;
    return { cell, kind: k === "L" ? "laddu" : "boom" };
  });
  return { pub: { type: "laddu", steps, stepMs: 1250 }, key: kinds };
}

// ---------- plan ----------
function allocate(total, types) {
  // split `total` rounds between types by weight (largest remainder), then shuffle the order
  const sum = types.reduce((s, t) => s + TYPE_WEIGHTS[t], 0);
  const raw = types.map((t) => (total * TYPE_WEIGHTS[t]) / sum);
  const counts = raw.map(Math.floor);
  let left = total - counts.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).forEach(([, i]) => {
    if (left > 0) { counts[i]++; left--; }
  });
  const list = [];
  types.forEach((t, i) => { for (let n = 0; n < counts[i]; n++) list.push(t); });
  return shuffle(list);
}

export async function buildPlan(cfg) {
  const total = cfg.rounds;
  const enabled0 = Object.keys(TYPE_WEIGHTS).filter((t) => cfg.games?.[t]);
  const enabled = enabled0.length ? enabled0 : ["tap"];
  const types = allocate(total, enabled);
  const needQuiz = types.filter((t) => t === "quiz").length;
  const needJoke = types.filter((t) => t === "joke").length;

  // Pick questions live from the internet (in parallel). Failures just return [].
  const [trivia, jokes] = await Promise.all([
    needQuiz ? fetchTrivia(needQuiz + 4) : [],
    needJoke ? fetchJokes() : [],
  ]);

  // Quiz: alternate internet questions and silly ones. Admin's own bank is only the last backup.
  const online = shuffle(trivia), funny = shuffle(FUNNY_QUESTIONS), bank = shuffle(cfg.questions || []);
  let qn = 0;
  const nextQ = () => {
    const order = qn++ % 2 === 0 ? [online, funny, bank] : [funny, online, bank];
    for (const p of order) if (p.length) return p.pop();
    return null;
  };

  // Jokes: internet jokes first, built-in ones as backup. Wrong punchlines come from the same mixed pool.
  const jokePool = [...jokes, ...LOCAL_JOKES];
  const setups = shuffle(jokes).concat(shuffle(LOCAL_JOKES));
  let jn = 0;

  const others = enabled.filter((t) => t !== "quiz" && t !== "joke");
  const rounds = [], key = [], finalTypes = [];
  types.forEach((t0) => {
    let t = t0, q = null;
    if (t === "quiz") { q = nextQ(); if (!q) t = others.length ? others[rnd(others.length)] : "tap"; }
    let r;
    if (t === "quiz") r = makeQuiz(q, cfg.quizMs);
    else if (t === "joke") r = makeJoke(setups[jn++ % setups.length], jokePool, cfg.quizMs + 4000);
    else if (t === "math") r = makeMath(cfg.mathMs);
    else if (t === "sequence") r = makeSeq(Math.round(cfg.puzzleMs * 0.8));
    else if (t === "odd") r = makeOdd(Math.round(cfg.puzzleMs * 0.6));
    else if (t === "memory") r = makeMemory();
    else if (t === "scramble") r = makeScramble(cfg.puzzleMs);
    else if (t === "laddu") r = makeLaddu();
    else r = makeTap(cfg.reactionMs);
    rounds.push(r.pub); key.push(r.key); finalTypes.push(t);
  });
  return { rounds, types: finalTypes, key };
}

// answers[i]: quiz/math/sequence/joke = option index (0-3), laddu = list of tapped step numbers (win: no cracker, at most 1 laddu missed), tap = tile (0-8), odd = tile (0-15), scramble = text,
// memory = array of pad numbers, -1 = timed out.
// Anything that is not an exact match counts as a loss. Never throws.
export function gradePlan(plan, answers) {
  const list = Array.isArray(answers) ? answers : [];
  const same = (t, k, a) =>
    t === "scramble" ? typeof a === "string" && a.trim().toUpperCase() === k
    : t === "memory" ? Array.isArray(a) && a.length === k.length && a.every((v, i) => v === k[i])
    : t === "laddu" ? Array.isArray(a) && a.length <= k.length && new Set(a).size === a.length
        && a.every((v) => Number.isInteger(v) && v >= 0 && v < k.length)
        && a.every((v) => k[v] === "L") && a.length >= k.filter((x) => x === "L").length - 1
    : Number.isInteger(a) && a === k;
  const results = plan.key.map((k, i) => same(plan.types[i], k, list[i]));
  return { wins: results.filter(Boolean).length, results };
}

// Fastest a real person could possibly finish (ms). Used to reject scripted submissions.
export function minPlayMs(rounds) {
  return rounds * 900;
}
