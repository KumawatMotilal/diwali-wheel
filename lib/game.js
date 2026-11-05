// Game engine. SERVER ONLY (it sees the answer key). The browser only receives `plan.rounds`,
// which has no answers. `plan.types` and `plan.key` stay on the server and are used for grading.
//
// Round types:
//   quiz - multiple choice question from the question bank
//   math - quick mental math, multiple choice
//   tap  - several tiles light up, only the real diya counts, the rest are decoys

const TYPE_WEIGHTS = { quiz: 5, tap: 3, math: 2 };
const DECOYS = ["🕯️", "🧨", "🔥", "⭐", "🌙"];

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

export function buildPlan(cfg) {
  const total = cfg.rounds;
  const bank = (cfg.questions || []).filter((q) => (cfg.cats || []).includes(q.cat));
  let enabled = ["quiz", "tap", "math"].filter((t) => cfg.games?.[t]);
  if (!bank.length) enabled = enabled.filter((t) => t !== "quiz");
  if (!enabled.length) enabled = ["tap"];

  let types = allocate(total, enabled);
  let pool = shuffle(bank);
  const others = enabled.filter((t) => t !== "quiz");
  const rounds = [], key = [], finalTypes = [];
  types.forEach((t) => {
    if (t === "quiz" && !pool.length) {
      if (others.length) t = others[rnd(others.length)]; // bank is smaller than quiz rounds: swap
      else pool = shuffle(bank); // quiz only: repeats are unavoidable
    }
    let r;
    if (t === "quiz") r = makeQuiz(pool.pop(), cfg.quizMs);
    else if (t === "math") r = makeMath(cfg.mathMs);
    else r = makeTap(cfg.reactionMs);
    rounds.push(r.pub); key.push(r.key); finalTypes.push(t);
  });
  return { rounds, types: finalTypes, key };
}

// answers[i]: quiz/math = chosen option index (0-3), tap = tapped tile index (0-8), -1 = timed out.
// Anything that is not an exact match counts as a loss. Never throws.
export function gradePlan(plan, answers) {
  const list = Array.isArray(answers) ? answers : [];
  const results = plan.key.map((k, i) => Number.isInteger(list[i]) && list[i] === k);
  return { wins: results.filter(Boolean).length, results };
}

// Fastest a real person could possibly finish (ms). Used to reject scripted submissions.
export function minPlayMs(rounds) {
  return rounds * 900;
}
