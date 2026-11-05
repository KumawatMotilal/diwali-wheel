"use client";
import { useEffect, useRef, useState } from "react";

// "Tap the Diya": a diya lights up on one of 9 tiles. Tap it in time to win the round.
// Wrong tile or too slow = lost round. Plays `rounds` rounds, reports total wins.
export default function Challenge({ rounds, minWins, reactionMs, onFinish }) {
  const [round, setRound] = useState(1);
  const [wins, setWins] = useState(0);
  const [results, setResults] = useState([]);
  const [phase, setPhase] = useState("wait"); // wait | show | result
  const [active, setActive] = useState(-1);
  const [flash, setFlash] = useState(null);
  const winsRef = useRef(0);
  const lastRef = useRef(-1);
  const lockRef = useRef(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;

  function settle(ok, idx) {
    if (lockRef.current) return;
    lockRef.current = true;
    if (ok) {
      winsRef.current += 1;
      setWins(winsRef.current);
    }
    setResults((r) => [...r, ok]);
    setFlash({ idx, ok });
    setPhase("result");
  }

  useEffect(() => {
    let t;
    if (phase === "wait") {
      t = setTimeout(() => {
        let i;
        do {
          i = Math.floor(Math.random() * 9);
        } while (i === lastRef.current);
        lastRef.current = i;
        setActive(i);
        setPhase("show");
      }, 500 + Math.random() * 700);
    } else if (phase === "show") {
      t = setTimeout(() => settle(false, active), reactionMs);
    } else {
      t = setTimeout(() => {
        if (round >= rounds) {
          finishRef.current(winsRef.current);
        } else {
          lockRef.current = false;
          setRound((r) => r + 1);
          setActive(-1);
          setFlash(null);
          setPhase("wait");
        }
      }, 700);
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  function tap(i) {
    if (phase !== "show") return;
    settle(i === active, i);
  }

  const message =
    phase === "wait" ? "Get ready…" : phase === "show" ? "TAP THE DIYA! 🪔" : flash?.ok ? "Nice! ✅" : "Missed ❌";

  return (
    <div className="stage">
      <div className="card" style={{ width: "min(92vw, 420px)", textAlign: "center" }}>
        <div className="head" style={{ fontSize: 15 }}>
          Round <b>{round}</b> / {rounds} · Wins <b>{wins}</b> (need {minWins})
        </div>
        <div className="dots">
          {Array.from({ length: rounds }, (_, i) => (
            <span
              key={i}
              className={"dot" + (results[i] === true ? " ok" : results[i] === false ? " bad" : i === round - 1 ? " now" : "")}
            />
          ))}
        </div>
        <div className="grid3">
          {Array.from({ length: 9 }, (_, i) => {
            let cls = "tile";
            let content = "";
            if (phase === "show" && i === active) {
              cls += " lit";
              content = "🪔";
            }
            if (phase === "result" && flash) {
              if (i === flash.idx) {
                cls += flash.ok ? " ok" : " bad";
                content = flash.ok ? "✅" : "❌";
              } else if (!flash.ok && i === active) {
                cls += " lit dim";
                content = "🪔";
              }
            }
            return (
              <button key={i} className={cls} onClick={() => tap(i)} aria-label={`tile ${i + 1}`}>
                {content}
              </button>
            );
          })}
        </div>
        <div className="msg">{message}</div>
      </div>
    </div>
  );
}
