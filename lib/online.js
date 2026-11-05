// Live questions from the internet. SERVER ONLY.
// Nothing here is category based: we ask for random EASY trivia from every topic,
// and random clean jokes. If a service is slow or down we return [] and the game
// quietly uses the built-in funny bank instead, so a player never sees an error.

const TIMEOUT_MS = 3500;

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

const clean = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

// Open Trivia DB: random easy questions, any topic (no category filter)
export async function fetchTrivia(n) {
  try {
    const d = await getJson(`https://opentdb.com/api.php?amount=${Math.min(50, Math.max(1, n))}&type=multiple&difficulty=easy&encode=url3986`);
    if (d.response_code !== 0 || !Array.isArray(d.results)) return [];
    const out = [];
    for (const r of d.results) {
      const q = clean(decodeURIComponent(r.question));
      const correct = clean(decodeURIComponent(r.correct_answer));
      const wrong = (r.incorrect_answers || []).map((x) => clean(decodeURIComponent(x)));
      const options = [correct, ...wrong];
      if (!q || q.length > 170 || wrong.length !== 3) continue;
      if (options.some((o) => !o || o.length > 60)) continue;
      if (new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
      out.push({ id: "o" + out.length, cat: "online", q, options, answer: 0 });
    }
    return out;
  } catch {
    return [];
  }
}

// JokeAPI: clean two-part jokes (setup + punchline). Safe mode plus a blacklist.
export async function fetchJokes() {
  try {
    const d = await getJson("https://v2.jokeapi.dev/joke/Misc,Pun?safe-mode&type=twopart&amount=10&blacklistFlags=nsfw,religious,political,racist,sexist,explicit");
    const list = Array.isArray(d.jokes) ? d.jokes : d.setup ? [d] : [];
    const seen = new Set();
    const out = [];
    for (const j of list) {
      const setup = clean(j.setup), delivery = clean(j.delivery);
      if (!setup || !delivery || setup.length > 150 || delivery.length > 100) continue;
      if (seen.has(setup.toLowerCase())) continue;
      seen.add(setup.toLowerCase());
      out.push({ id: "oj" + out.length, setup, delivery });
    }
    return out;
  } catch {
    return [];
  }
}
