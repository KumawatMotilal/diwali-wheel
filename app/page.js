"use client";
import { useEffect, useRef, useState } from "react";
import Wheel from "@/components/Wheel";
import Challenge from "@/components/Challenge";
import ResultModal from "@/components/ResultModal";

// Player page. Opened with the personal one-time link:  /?p=<token>
export default function Home() {
  const [token, setToken] = useState("");
  const [info, setInfo] = useState(null);
  const [screen, setScreen] = useState("loading");
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [spin, setSpin] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const sessionRef = useRef("");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("p") || "";
    if (!t) {
      setScreen("nolink");
      return;
    }
    setToken(t);
    fetch(`/api/play/info?t=${encodeURIComponent(t)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) return setScreen("invalid");
        setInfo(d);
        setScreen({ new: "intro", started: "used", failed: "failed", won: "done" }[d.status] || "invalid");
      })
      .catch(() => {
        setError("Could not connect. Check your internet and reload.");
        setScreen("error");
      });
  }, []);

  async function start() {
    try {
      const r = await fetch("/api/play/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token }),
      });
      const d = await r.json();
      if (r.status === 409) return setScreen("used");
      if (!r.ok) {
        setError(d.error || "Something went wrong");
        return setScreen("error");
      }
      sessionRef.current = d.sessionKey;
      setScreen("game");
    } catch {
      setError("Could not connect. Check your internet and try again.");
      setScreen("error");
    }
  }

  async function onFinish(wins) {
    setScreen("submitting");
    try {
      const r = await fetch("/api/play/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, sessionKey: sessionRef.current, wins }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Something went wrong");
        return setScreen("error");
      }
      setOutcome(d);
      setScreen(d.passed ? "wheel" : "failed");
    } catch {
      setError("Could not send your score. Please contact the organiser.");
      setScreen("error");
    }
  }

  function spinWheel() {
    if (spinning || won || !outcome) return;
    setSpinning(true);
    setSpin({ index: outcome.giftIndex, nonce: Date.now() });
  }

  function onWheelDone() {
    setSpinning(false);
    setWon(outcome.gifts[outcome.giftIndex]);
    setShowModal(true);
  }

  const game = info?.game;
  const wins = outcome?.wins ?? info?.wins;

  return (
    <main className="page">
      <h1 className="title">🪔 {game?.name || "Diwali Lucky Wheel"} 🪔</h1>
      {info?.name && <p className="sub">Happy Diwali, <b>{info.name}</b>!</p>}

      {screen === "loading" && <p className="sub">Loading…</p>}

      {screen === "nolink" && (
        <div className="card panel">
          <h2>Personal link needed</h2>
          <p>Please open the link the organiser sent you. Every player has their own link.</p>
        </div>
      )}

      {screen === "invalid" && (
        <div className="card panel">
          <h2>Link not valid</h2>
          <p>This link is wrong or was removed. Please ask the organiser for a new one.</p>
        </div>
      )}

      {screen === "error" && (
        <div className="card panel">
          <h2>Oops</h2>
          <p>{error}</p>
        </div>
      )}

      {screen === "used" && (
        <div className="card panel">
          <h2>Link already used</h2>
          <p>This link works only one time and it has already been opened. If this was a mistake, ask the organiser to reset it.</p>
        </div>
      )}

      {screen === "intro" && game && (
        <div className="card panel">
          <h2>How to play</h2>
          <p style={{ lineHeight: 1.7 }}>
            🪔 You play <b>{game.rounds}</b> quick rounds. A diya lights up on the board, tap it fast!
            <br />
            🏆 Win at least <b>{game.minWins}</b> of {game.rounds} rounds to unlock the Lucky Wheel.
            <br />
            🎁 Spin the wheel and win a gift based on your luck.
          </p>
          <p className="hint">This link works only one time. Once you press Start, you cannot play again. Don't close the page.</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn spin-btn" onClick={start}>START</button>
          </div>
        </div>
      )}

      {screen === "game" && game && (
        <Challenge rounds={game.rounds} minWins={game.minWins} reactionMs={game.reactionMs} onFinish={onFinish} />
      )}

      {screen === "submitting" && <p className="sub">Checking your score…</p>}

      {screen === "failed" && game && (
        <div className="card panel">
          <div className="big-emoji">🙏</div>
          <h2>Better luck next time!</h2>
          <p>
            You won <b>{wins ?? 0}</b> of {game.rounds} rounds. You needed {game.minWins} to unlock the wheel.
          </p>
          <p>Happy Diwali! 🪔</p>
        </div>
      )}

      {screen === "wheel" && outcome && game && (
        <div className="stage">
          <p className="sub">
            🎉 You won <b>{outcome.wins}</b> of {game.rounds} rounds! Spin the wheel for your gift.
          </p>
          <Wheel gifts={outcome.gifts} spin={spin} onDone={onWheelDone} />
          {won ? (
            <div className="played">
              Your gift: <b>{won.emoji} {won.name}</b>. Show this screen to the organiser.
            </div>
          ) : (
            <button className="btn spin-btn" onClick={spinWheel} disabled={spinning}>
              {spinning ? "Spinning..." : "🪔 SPIN 🪔"}
            </button>
          )}
        </div>
      )}

      {screen === "done" && info?.gift && (
        <div className="card panel">
          <div className="big-emoji">{info.gift.emoji}</div>
          <h2>You already played</h2>
          <p>
            Your gift: <b>{info.gift.name}</b>
          </p>
          <p>Show this screen to the organiser. Happy Diwali! 🪔</p>
        </div>
      )}

      {showModal && won && <ResultModal result={won} onClose={() => setShowModal(false)} />}
    </main>
  );
}
