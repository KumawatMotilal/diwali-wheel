"use client";
import { useEffect, useRef, useState } from "react";
import Wheel from "@/components/Wheel";
import Challenge from "@/components/Challenge";
import ResultModal from "@/components/ResultModal";
import { gameInfo, GAME_KEYS } from "@/lib/cats";
import { T, DEFAULT_TITLE } from "@/lib/i18n";
import Icon, { Toran } from "@/components/Icon";

// Player page. Opened with the personal one-time link:  /?p=<token>
export default function Home() {
  const [token, setToken] = useState("");
  const [info, setInfo] = useState(null);
  const [screen, setScreen] = useState("loading");
  const [error, setError] = useState("");
  const [errKey, setErrKey] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [spin, setSpin] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const sessionRef = useRef("");
  const [rounds, setRounds] = useState([]);
  const [minWins, setMinWins] = useState(0);
  const [lang, setLang] = useState("en");
  const t = T[lang];

  function pickLang(l) {
    setLang(l);
    try { localStorage.setItem("dw:lang", l); } catch {}
  }

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    let l = qs.get("lang");
    try { l = l || localStorage.getItem("dw:lang"); } catch {}
    if (!l) l = (navigator.language || "").toLowerCase().startsWith("hi") ? "hi" : "en";
    setLang(l === "hi" ? "hi" : "en");
    const tk = qs.get("p") || "";
    if (!tk) {
      setScreen("nolink");
      return;
    }
    setToken(tk);
    fetch(`/api/play/info?t=${encodeURIComponent(tk)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) return setScreen("invalid");
        setInfo(d);
        setScreen({ new: "intro", started: "used", failed: "failed", won: "done" }[d.status] || "invalid");
      })
      .catch(() => {
        setErrKey("errConnect");
        setScreen("error");
      });
  }, []);

  async function start() {
    try {
      const r = await fetch("/api/play/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, lang }),
      });
      const d = await r.json();
      if (r.status === 409) return setScreen("used");
      if (!r.ok) {
        setError(d.error || ""); setErrKey(d.error ? "" : "errGeneric");
        return setScreen("error");
      }
      sessionRef.current = d.sessionKey;
      setRounds(d.rounds);
      setMinWins(d.minWins);
      setScreen("game");
    } catch {
      setErrKey("errConnect2");
      setScreen("error");
    }
  }

  async function onFinish(answers) {
    setScreen("submitting");
    try {
      const r = await fetch("/api/play/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token, sessionKey: sessionRef.current, answers }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || ""); setErrKey(d.error ? "" : "errGeneric");
        return setScreen("error");
      }
      setOutcome(d);
      setScreen(d.passed ? "wheel" : "failed");
    } catch {
      setErrKey("errSend");
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
  const title = lang === "hi" && (!game?.name || game.name === DEFAULT_TITLE) ? T.hi.title : game?.name || t.title;

  return (
    <>
    <Toran />
    <main className="page">
      {screen !== "game" && screen !== "submitting" && (
        <div className="langbar" role="group" aria-label="Language">
          <button className={"lang" + (lang === "en" ? " on" : "")} onClick={() => pickLang("en")}>English</button>
          <button className={"lang" + (lang === "hi" ? " on" : "")} onClick={() => pickLang("hi")}>हिन्दी</button>
        </div>
      )}
      <h1 className="title"><Icon name="diya" size={38} /> {title} <Icon name="diya" size={38} /></h1>
      {info?.name && <p className="sub">{t.happy(info.name)}</p>}

      {screen === "loading" && <p className="sub">{t.loading}</p>}

      {screen === "nolink" && (
        <div className="card panel">
          <h2>{t.nolinkH}</h2>
          <p>{t.nolinkP}</p>
        </div>
      )}

      {screen === "invalid" && (
        <div className="card panel">
          <h2>{t.invalidH}</h2>
          <p>{t.invalidP}</p>
        </div>
      )}

      {screen === "error" && (
        <div className="card panel">
          <h2>{t.oops}</h2>
          <p>{errKey ? t[errKey] : error}</p>
        </div>
      )}

      {screen === "used" && (
        <div className="card panel">
          <h2>{t.usedH}</h2>
          <p>{t.usedP}</p>
        </div>
      )}

      {screen === "intro" && game && (
        <div className="card panel">
          <h2>{t.howH}</h2>
          <p>
            {t.p1} <b>{game.rounds}</b> {t.p2} <b>{game.minWins}</b> {t.p3}
          </p>
          <ul className="rules">
            {GAME_KEYS.filter((k) => game.games?.[k]).map((k) => {
              const g = gameInfo(lang, k);
              return (
                <li key={k}>
                  <span className="chip" style={{ background: g.color }}>{g.glyph}</span>
                  <div><b>{g.label}</b><span className="d">{g.desc}</span></div>
                </li>
              );
            })}
          </ul>
          <p className="hint">{t.hint}</p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <button className="btn spin-btn" onClick={start}>{t.start}</button>
          </div>
        </div>
      )}

      {screen === "game" && game && (
        <Challenge rounds={rounds} minWins={minWins} onFinish={onFinish} lang={lang} />
      )}

      {screen === "submitting" && <p className="sub">{t.checking}</p>}

      {screen === "failed" && game && (
        <div className="card panel">
          <div className="center"><Icon name="lantern" size={72} /></div>
          <h2>{t.failedH}</h2>
          <p>{t.failedP(wins ?? 0, outcome?.rounds ?? game.rounds, game.minWins)}</p>
          <p>{t.happyShort}</p>
        </div>
      )}

      {screen === "wheel" && outcome && game && (
        <div className="stage">
          <p className="sub">{t.wheelMsg(outcome.wins, outcome.rounds ?? game.rounds)}</p>
          <Wheel gifts={outcome.gifts} spin={spin} onDone={onWheelDone} />
          {won ? (
            <div className="played">
              {t.yourGift} <b>{won.emoji} {won.name}</b>. {t.showOrg}
            </div>
          ) : (
            <button className="btn spin-btn" onClick={spinWheel} disabled={spinning}>
              {spinning ? t.spinning : t.spin}
            </button>
          )}
        </div>
      )}

      {screen === "done" && info?.gift && (
        <div className="card panel">
          <div className="big-emoji">{info.gift.emoji}</div>
          <h2>{t.doneH}</h2>
          <p>
            {t.yourGift} <b>{info.gift.name}</b>
          </p>
          <p>{t.showOrg2}</p>
        </div>
      )}

      {showModal && won && <ResultModal result={won} onClose={() => setShowModal(false)} lang={lang} />}
    </main>
    </>
  );
}
