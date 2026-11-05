"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { newId } from "@/lib/config";

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
      setCfg(d.config);
      setSaved("Saved ✓");
      setTimeout(() => setSaved(""), 2000);
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

  function whatsapp(p) {
    const text = `Hi ${p.name}! 🪔 Happy Diwali! Play the ${cfg?.name || "Lucky Wheel"} and win a gift. Your personal link (works only once): ${linkFor(p.token)}`;
    window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
  }

  const setGift = (id, patch) =>
    setCfg((c) => ({ ...c, gifts: c.gifts.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));

  // ---------- login ----------
  if (!authed) {
    return (
      <main className="page">
        <h1 className="title">🪔 Admin 🪔</h1>
        <form className="card panel" onSubmit={login}>
          <h2>Organiser login</h2>
          <input type="password" placeholder="Admin password" value={key} onChange={(e) => setKey(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(251,191,36,.4)", background: "rgba(0,0,0,.3)", color: "#fff", fontSize: 15 }} />
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn" type="submit">Login</button>
          </div>
          {msg && <p className="err">{msg}</p>}
        </form>
      </main>
    );
  }

  if (!cfg) return null;

  const totalWeight = cfg.gifts.reduce((s, g) => s + Math.max(0, Number(g.weight) || 0), 0);
  const count = (s) => players.filter((p) => p.status === s).length;
  const label = { new: "Not played", started: "Started / used", failed: "Lost", won: "Won" };

  return (
    <main className="page">
      <h1 className="title">🪔 Diwali Game Admin 🪔</h1>
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
          <p className="hint" style={{ marginTop: 0 }}>
            Players must win {cfg.minWins} of {cfg.rounds} rounds to unlock the wheel. Lower "Tap time" makes it harder.
          </p>

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
    </main>
  );
}
