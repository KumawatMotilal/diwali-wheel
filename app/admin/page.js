"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { newId } from "@/lib/ids";
import { CATS, CAT_KEYS, GAMES, GAME_KEYS } from "@/lib/cats";
import Icon, { Toran } from "@/components/Icon";

const EMOJIS = ["🎁", "🍬", "🪔", "🪙", "🥜", "🎨", "🍫", "🎆", "📱", "💰"];

export default function Admin() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [cfg, setCfg] = useState(null);
  const [players, setPlayers] = useState([]);
  const [db, setDb] = useState("");
  const [msg, setMsg] = useState("");
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [copied, setCopied] = useState("");
  const [qfilter, setQfilter] = useState("all");
  const keyRef = useRef("");

  const api = useCallback(async (path, opts = {}) => {
    const res = await fetch(path, {
      ...opts,
      cache: "no-store",
      headers: { "Content-Type": "application/json", "x-admin-key": keyRef.current },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }, []);

  const load = useCallback(
    async (initial) => {
      const d = await api("/api/admin/state");
      setPlayers(d.players);
      setDb(d.db);
      if (initial) setCfg(d.config);
    },
    [api]
  );

  async function login(e) {
    e.preventDefault();
    keyRef.current = key;
    try {
      await load(true);
      setAuthed(true);
      setMsg("");
      try { sessionStorage.setItem("dw-admin", key); } catch {}
    } catch (er) {
      setMsg(er.message);
    }
  }

  useEffect(() => {
    let k = "";
    try { k = sessionStorage.getItem("dw-admin") || ""; } catch {}
    if (k) {
      keyRef.current = k;
      setKey(k);
      load(true).then(() => setAuthed(true)).catch(() => {});
    }
  }, [load]);

  // refresh players every 8s so you can watch results live
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => load(false).catch(() => {}), 8000);
    return () => clearInterval(id);
  }, [authed, load]);

  async function run(fn) {
    setBusy(true);
    setMsg("");
    try { await fn(); } catch (er) { setMsg(er.message); }
    setBusy(false);
  }

  const saveCfg = () =>
    run(async () => {
      const d = await api("/api/admin/config", { method: "POST", body: JSON.stringify(cfg) });
      const dropped = cfg.questions.length - d.config.questions.length;
      setCfg(d.config);
      setSaved(dropped > 0 ? `Saved ✓ (${dropped} incomplete question${dropped > 1 ? "s" : ""} removed)` : "Saved ✓");
      setTimeout(() => setSaved(""), 3500);
    });

  const addPlayers = () =>
    run(async () => {
      const list = names.split("\n").map((s) => s.trim()).filter(Boolean);
      if (!list.length) return;
      await api("/api/admin/players", { method: "POST", body: JSON.stringify({ names: list }) });
      setNames("");
      await load(false);
    });

  const resetPlayer = (token) => {
    if (!confirm("Reset this player? Their link will work one more time.")) return;
    run(async () => {
      await api("/api/admin/players", { method: "PATCH", body: JSON.stringify({ token, action: "reset" }) });
      await load(false);
    });
  };

  const removePlayer = (token) => {
    if (!confirm("Delete this player and their link?")) return;
    run(async () => {
      await api("/api/admin/players?token=" + encodeURIComponent(token), { method: "DELETE" });
      await load(false);
    });
  };

  const linkFor = (t) => `${window.location.origin}/?p=${t}`;

  async function copy(t) {
    try {
      await navigator.clipboard.writeText(linkFor(t));
      setCopied(t);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      window.prompt("Copy this link:", linkFor(t));
    }
  }

  // copy many links at once, one per line: "Name - link"
  async function copyAll(onlyNew) {
    const list = players.filter((p) => !onlyNew || p.status === "new");
    if (!list.length) return setMsg("No players to copy");
    const text = list.map((p) => `${p.name} - ${linkFor(p.token)}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(onlyNew ? "all-new" : "all");
      setTimeout(() => setCopied(""), 1800);
    } catch {
      window.prompt("Copy these links:", text);
    }
  }

  function whatsapp(p) {
    const text = `Hi ${p.name}! 🪔 Happy Diwali! Play the ${cfg?.name || "Lucky Wheel"} and win a gift. Your personal link (works only once): ${linkFor(p.token)}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  const setGift = (id, patch) =>
    setCfg((c) => ({ ...c, gifts: c.gifts.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));

  const setQ = (id, patch) =>
    setCfg((c) => ({ ...c, questions: c.questions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const setOpt = (id, n, v) =>
    setCfg((c) => ({
      ...c,
      questions: c.questions.map((x) => (x.id === id ? { ...x, options: x.options.map((o, k) => (k === n ? v : o)) } : x)),
    }));
  const toggle = (group, key) =>
    setCfg((c) => {
      const cur = group === "cats" ? c.cats : GAME_KEYS.filter((k) => c.games[k]);
      const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      if (!next.length) return c; // keep at least one
      return group === "cats"
        ? { ...c, cats: next }
        : { ...c, games: Object.fromEntries(GAME_KEYS.map((k) => [k, next.includes(k)])) };
    });
  const addQuestion = () =>
    setCfg((c) => ({
      ...c,
      questions: [
        { id: newId(), cat: qfilter === "all" ? "general" : qfilter, q: "", options: ["", "", "", ""], answer: 0 },
        ...c.questions,
      ],
    }));

  // ---------- login ----------
  if (!authed) {
    return (
      <><Toran /><main className="page">
        <h1 className="title"><Icon name="diya" size={36} /> Admin <Icon name="diya" size={36} /></h1>
        <form className="card panel" onSubmit={login}>
          <h2>Organiser login</h2>
          <input type="password" placeholder="Admin password" value={key} onChange={(e) => setKey(e.target.value)}
            />
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn" type="submit">Login</button>
          </div>
          {msg && <p className="err">{msg}</p>}
        </form>
      </main></>
    );
  }

  if (!cfg) return null;

  const totalWeight = cfg.gifts.reduce((s, g) => s + Math.max(0, Number(g.weight) || 0), 0);
  const count = (s) => players.filter((p) => p.status === s).length;
  const shownQs = cfg.questions.filter((x) => qfilter === "all" || x.cat === qfilter);
  const label = { new: "Not played", started: "Started / used", failed: "Lost", won: "Won" };

  return (
    <><Toran /><main className="page">
      <h1 className="title"><Icon name="diya" size={36} /> Diwali Game Admin <Icon name="diya" size={36} /></h1>
      <p className="sub">Set up the game, add players, and send each person their own one-time link.</p>

      {db === "memory" && (
        <div className="warn">
          Running on temporary memory storage (local testing only). On Vercel, connect Upstash Redis in Storage so data is not lost.
        </div>
      )}
      {msg && <p className="err" style={{ textAlign: "center", marginBottom: 10 }}>{msg}</p>}

      <div className="layout edit">
        {/* ---------- settings ---------- */}
        <section className="card">
          <h2>Game Settings</h2>
          <label className="field">Game name</label>
          <input type="text" value={cfg.name} onChange={(e) => setCfg({ ...cfg, name: e.target.value })} />

          <div className="cfg-grid">
            <div>
              <label className="field">Total rounds</label>
              <input type="number" min="1" max="30" value={cfg.rounds}
                onChange={(e) => setCfg({ ...cfg, rounds: Number(e.target.value) })} />
            </div>
            <div>
              <label className="field">Must win (min)</label>
              <input type="number" min="1" max={cfg.rounds} value={cfg.minWins}
                onChange={(e) => setCfg({ ...cfg, minWins: Number(e.target.value) })} />
            </div>
            <div>
              <label className="field">Tap time (ms)</label>
              <input type="number" min="400" max="5000" step="100" value={cfg.reactionMs}
                onChange={(e) => setCfg({ ...cfg, reactionMs: Number(e.target.value) })} />
            </div>
          </div>
          <div className="cfg-grid">
            <div>
              <label className="field">Quiz time (ms)</label>
              <input type="number" min="3000" max="60000" step="1000" value={cfg.quizMs}
                onChange={(e) => setCfg({ ...cfg, quizMs: Number(e.target.value) })} />
            </div>
            <div>
              <label className="field">Math time (ms)</label>
              <input type="number" min="3000" max="60000" step="1000" value={cfg.mathMs}
                onChange={(e) => setCfg({ ...cfg, mathMs: Number(e.target.value) })} />
            </div>
            <div>
              <label className="field">Puzzle time (ms)</label>
              <input type="number" min="5000" max="90000" step="1000" value={cfg.puzzleMs}
                onChange={(e) => setCfg({ ...cfg, puzzleMs: Number(e.target.value) })} />
            </div>
          </div>
          <p className="hint" style={{ marginTop: 0 }}>
            Players must win {cfg.minWins} of {cfg.rounds} rounds to unlock the wheel. Lower times make it harder.
          </p>

          <label className="field" style={{ marginTop: 12 }}>Round types (mixed in every game)</label>
          <div className="checks">
            {GAME_KEYS.map((k) => (
              <label className="check" key={k}>
                <input type="checkbox" checked={!!cfg.games[k]} onChange={() => toggle("games", k)} /> {GAMES[k].label}
              </label>
            ))}
          </div>
          <label className="field" style={{ marginTop: 8 }}>Quiz categories</label>
          <div className="checks">
            {CAT_KEYS.map((k) => (
              <label className="check" key={k}>
                <input type="checkbox" checked={cfg.cats.includes(k)} onChange={() => toggle("cats", k)} /> {CATS[k].emoji} {CATS[k].label}
              </label>
            ))}
          </div>

          <div className="head" style={{ marginTop: 14 }}>Emoji · Gift name · Luck (higher = wins more often)</div>
          {cfg.gifts.map((g) => {
            const pct = totalWeight > 0 ? ((Math.max(0, Number(g.weight) || 0) / totalWeight) * 100).toFixed(1) : "0";
            return (
              <div className="row" key={g.id}>
                <input type="text" value={g.emoji} maxLength={4} onChange={(e) => setGift(g.id, { emoji: e.target.value })} />
                <input type="text" value={g.name} onChange={(e) => setGift(g.id, { name: e.target.value })} />
                <div>
                  <input type="number" min="0" value={g.weight}
                    onChange={(e) => setGift(g.id, { weight: e.target.value === "" ? 0 : Number(e.target.value) })} />
                  <div className="pct">{pct}% chance</div>
                </div>
                <button className="btn danger" title="Remove"
                  onClick={() => cfg.gifts.length > 2 && setCfg({ ...cfg, gifts: cfg.gifts.filter((x) => x.id !== g.id) })}>
                  ✕
                </button>
              </div>
            );
          })}
          <div className="actions">
            <button className="btn ghost" disabled={cfg.gifts.length >= 12}
              onClick={() => setCfg({ ...cfg, gifts: [...cfg.gifts, { id: newId(), name: "New Gift", emoji: EMOJIS[cfg.gifts.length % EMOJIS.length], weight: 10 }] })}>
              + Add gift
            </button>
            <button className="btn" onClick={saveCfg} disabled={busy}>{saved || "Save settings"}</button>
          </div>
          <p className="hint">Changes apply to all players immediately. No new links needed. Min 2 and max 12 gifts.</p>
        </section>

        {/* ---------- players ---------- */}
        <section className="card">
          <h2>Players &amp; One-time Links</h2>
          <label className="field">Add player names (one per line)</label>
          <textarea value={names} placeholder={"Ravi Patel\nPriya Shah\nAmit"} onChange={(e) => setNames(e.target.value)} />
          <div className="actions">
            <button className="btn" onClick={addPlayers} disabled={busy || !names.trim()}>Create links</button>
          </div>

          <div className="stats" style={{ marginTop: 16 }}>
            <span>Total: <b>{players.length}</b></span>
            <span>Not played: <b>{count("new")}</b></span>
            <span>Won: <b>{count("won")}</b></span>
            <span>Lost: <b>{count("failed")}</b></span>
            <span>Started: <b>{count("started")}</b></span>
          </div>

          <div className="actions" style={{ marginTop: 0, marginBottom: 10 }}>
            <button className="btn small" disabled={!players.length} onClick={() => copyAll(false)}>
              {copied === "all" ? "Copied ✓" : `Copy all links (${players.length})`}
            </button>
            <button className="btn small ghost" disabled={!count("new")} onClick={() => copyAll(true)}>
              {copied === "all-new" ? "Copied ✓" : `Copy not-played links (${count("new")})`}
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Status</th><th>Result</th><th>Link</th></tr>
              </thead>
              <tbody>
                {players.length === 0 && (
                  <tr><td colSpan={4} style={{ opacity: .7 }}>No players yet. Add names above.</td></tr>
                )}
                {players.map((p) => (
                  <tr key={p.token}>
                    <td>{p.name}</td>
                    <td><span className={"badge " + p.status}>{label[p.status] || p.status}</span></td>
                    <td>
                      {p.status === "won" && `${p.gift?.emoji || ""} ${p.gift?.name || ""} (${p.wins}/${cfg.rounds})`}
                      {p.status === "failed" && `${p.wins}/${cfg.rounds}`}
                      {(p.status === "new" || p.status === "started") && "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn small" onClick={() => copy(p.token)}>{copied === p.token ? "Copied" : "Copy"}</button>
                        <button className="btn small ghost" onClick={() => whatsapp(p)}>WhatsApp</button>
                        {p.status !== "new" && (
                          <button className="btn small ghost" onClick={() => resetPlayer(p.token)}>Reset</button>
                        )}
                        <button className="btn small danger" onClick={() => removePlayer(p.token)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">
            Each link works one time only. "Started / used" means the link was opened and the game began, so it cannot be opened again
            (even in another browser). Use Reset to give that player one more chance.
          </p>
        </section>
      </div>

      {/* ---------- question bank ---------- */}
      <section className="card" style={{ marginTop: 24 }}>
        <h2>Quiz Questions ({cfg.questions.length})</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          Each game picks random questions from the categories ticked above. Mark the correct answer with the green dot. Answers are checked on the server and are never sent to players.
          Press "Save settings" after editing.
        </p>
        <div className="actions" style={{ marginBottom: 12 }}>
          <select className="sel" value={qfilter} onChange={(e) => setQfilter(e.target.value)}>
            <option value="all">All categories</option>
            {CAT_KEYS.map((k) => (
              <option key={k} value={k}>{CATS[k].label} ({cfg.questions.filter((x) => x.cat === k).length})</option>
            ))}
          </select>
          <button className="btn ghost" onClick={addQuestion}>+ Add question</button>
          <button className="btn" onClick={saveCfg} disabled={busy}>{saved || "Save settings"}</button>
        </div>
        {shownQs.length === 0 && <p className="hint">No questions here yet.</p>}
        {shownQs.map((x) => (
          <div className="qbox" key={x.id}>
            <div className="qtop">
              <select className="sel" value={x.cat} onChange={(e) => setQ(x.id, { cat: e.target.value })}>
                {CAT_KEYS.map((k) => <option key={k} value={k}>{CATS[k].label}</option>)}
              </select>
              <input type="text" placeholder="Question" value={x.q} onChange={(e) => setQ(x.id, { q: e.target.value })} />
              <button className="btn danger" title="Delete question"
                onClick={() => setCfg({ ...cfg, questions: cfg.questions.filter((y) => y.id !== x.id) })}>✕</button>
            </div>
            <div className="qopts">
              {x.options.map((o, n) => (
                <label key={n} className={"qopt" + (x.answer === n ? " right" : "")}>
                  <input type="radio" name={"ans-" + x.id} checked={x.answer === n} onChange={() => setQ(x.id, { answer: n })} />
                  <input type="text" placeholder={`Option ${n + 1}`} value={o} onChange={(e) => setOpt(x.id, n, e.target.value)} />
                </label>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main></>
  );
}