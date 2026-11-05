"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Wheel from "../components/Wheel";
import {
  DEFAULT_CONFIG,
  decodeConfig,
  encodeConfig,
  hashStr,
  newId,
  pickWeighted,
} from "../lib/config";

const STORE_KEY = "diwali-wheel-config";
const EMOJIS = ["🎁", "🍬", "🪔", "🪙", "🥜", "🎨", "🍫", "🎆", "📱", "💰"];

export default function Home() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [mode, setMode] = useState("edit"); // edit | play
  const [ready, setReady] = useState(false);
  const [spin, setSpin] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [previous, setPrevious] = useState(null);
  const [copied, setCopied] = useState(false);
  const pendingRef = useRef(null);

  // Load: shared link (?g=...) => player mode, otherwise saved editor config
  useEffect(() => {
    const g = new URLSearchParams(window.location.search).get("g");
    const shared = g ? decodeConfig(g) : null;
    if (shared) {
      setConfig(shared);
      setMode("play");
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
        if (saved && Array.isArray(saved.gifts) && saved.gifts.length >= 2) setConfig(saved);
      } catch {}
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && mode === "edit") {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(config));
      } catch {}
    }
  }, [config, ready, mode]);

  const gameKey = useMemo(() => "diwali-played-" + hashStr(encodeConfig(config)), [config]);

  // In player mode with "one spin" rule, remember what this device already won
  useEffect(() => {
    if (mode !== "play" || !ready) return;
    try {
      setPrevious(localStorage.getItem(gameKey));
    } catch {}
  }, [mode, ready, gameKey]);

  const validGifts = config.gifts.filter((g) => g.name.trim());
  const totalWeight = validGifts.reduce((s, g) => s + Math.max(0, Number(g.weight) || 0), 0);
  const locked = mode === "play" && config.oneSpin && previous;

  function startSpin() {
    if (spinning || locked || validGifts.length < 2) return;
    const index = pickWeighted(validGifts); // luck decided here
    pendingRef.current = validGifts[index];
    setResult(null);
    setSpinning(true);
    setSpin({ index, nonce: Date.now() });
  }

  function onDone() {
    setSpinning(false);
    const won = pendingRef.current;
    setResult(won);
    if (mode === "play" && config.oneSpin && won) {
      try {
        localStorage.setItem(gameKey, `${won.emoji} ${won.name}`);
      } catch {}
      setPrevious(`${won.emoji} ${won.name}`);
    }
  }

  function updateGift(id, patch) {
    setConfig((c) => ({ ...c, gifts: c.gifts.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }
  function addGift() {
    setConfig((c) => ({
      ...c,
      gifts: [
        ...c.gifts,
        { id: newId(), name: "New Gift", emoji: EMOJIS[c.gifts.length % EMOJIS.length], weight: 10 },
      ],
    }));
  }
  function removeGift(id) {
    setConfig((c) => (c.gifts.length <= 2 ? c : { ...c, gifts: c.gifts.filter((g) => g.id !== id) }));
  }

  function shareUrl() {
    return `${window.location.origin}/?g=${encodeConfig({ ...config, gifts: validGifts })}`;
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", shareUrl());
    }
  }

  if (!ready) return null;

  const wheelBlock = (
    <div className="stage">
      <Wheel gifts={validGifts.length >= 2 ? validGifts : DEFAULT_CONFIG.gifts} spin={spin} onDone={onDone} />
      {locked ? (
        <div className="played">
          You already played! Your gift: <b>{previous}</b>
        </div>
      ) : (
        <button className="btn spin-btn" onClick={startSpin} disabled={spinning || validGifts.length < 2}>
          {spinning ? "Spinning..." : "🪔 SPIN 🪔"}
        </button>
      )}
    </div>
  );

  // ---------- Player mode ----------
  if (mode === "play") {
    return (
      <main className="page">
        <h1 className="title">🪔 {config.name} 🪔</h1>
        <p className="sub">Happy Diwali! Spin the wheel and see your luck.</p>
        {wheelBlock}
        {result && <ResultModal result={result} onClose={() => setResult(null)} />}
      </main>
    );
  }

  // ---------- Editor mode ----------
  return (
    <main className="page">
      <h1 className="title">🪔 Diwali Lucky Wheel 🪔</h1>
      <p className="sub">Set your game name and gifts, then share the link with players.</p>

      <div className="layout edit">
        <section className="card">
          <h2>Game Setup</h2>
          <label className="field">Game name</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />

          <label className="check">
            <input
              type="checkbox"
              checked={config.oneSpin}
              onChange={(e) => setConfig({ ...config, oneSpin: e.target.checked })}
            />
            Only one spin per player (per device)
          </label>

          <div className="head">Emoji · Gift name · Luck (higher = wins more often)</div>
          {config.gifts.map((g) => {
            const pct = totalWeight > 0 ? ((Math.max(0, Number(g.weight) || 0) / totalWeight) * 100).toFixed(1) : "0";
            return (
              <div className="row" key={g.id}>
                <input type="text" value={g.emoji} maxLength={4} onChange={(e) => updateGift(g.id, { emoji: e.target.value })} />
                <input type="text" value={g.name} onChange={(e) => updateGift(g.id, { name: e.target.value })} />
                <div>
                  <input
                    type="number"
                    min="0"
                    value={g.weight}
                    onChange={(e) => updateGift(g.id, { weight: e.target.value === "" ? 0 : Number(e.target.value) })}
                  />
                  <div className="pct">{pct}% chance</div>
                </div>
                <button className="btn danger" onClick={() => removeGift(g.id)} title="Remove">
                  ✕
                </button>
              </div>
            );
          })}

          <div className="actions">
            <button className="btn" onClick={addGift}>+ Add gift</button>
            <button className="btn ghost" onClick={() => setConfig(DEFAULT_CONFIG)}>Reset</button>
          </div>

          <div className="actions">
            <button className="btn" onClick={copyLink}>{copied ? "Copied!" : "Copy player link"}</button>
            <button className="btn ghost" onClick={() => window.open(shareUrl(), "_blank")}>Open player page</button>
          </div>
          <p className="hint">
            The player link contains your game name and gifts, so any change here needs a new link.
            Player view hides the luck percentages. A gift with luck 0 is never won.
          </p>
        </section>

        <section className="card">
          <h2>Preview (test spin, not locked)</h2>
          {wheelBlock}
        </section>
      </div>

      {result && <ResultModal result={result} onClose={() => setResult(null)} />}
    </main>
  );
}

function ResultModal({ result, onClose }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 2.5 + Math.random() * 2.5,
        ch: ["🎉", "✨", "🪔", "🎆", "🪙"][i % 5],
      })),
    []
  );
  return (
    <div className="overlay" onClick={onClose}>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti"
          style={{ left: p.left + "vw", animationDelay: p.delay + "s", animationDuration: p.dur + "s" }}
        >
          {p.ch}
        </span>
      ))}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="big">{result.emoji}</div>
        <p>Congratulations! You won</p>
        <h3>{result.name}</h3>
        <p>Happy Diwali! 🪔</p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
