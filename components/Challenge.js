"use client";
import { useEffect, useRef, useState } from "react";
import { CATS } from "@/lib/cats";

// Plays the rounds the server prepared. The browser never sees the answers:
// it only collects what the player chose and sends it to the server at the end.
//   quiz / math -> option index (0-3), -1 if time ran out
//   tap         -> tile index (0-8), -1 if time ran out

// ---------- Tap the Diya (with decoys) ----------
function TapRound({ round, onDone }) {
  const [phase, setPhase] = useState("wait"); // wait | show | result
  const [picked, setPicked] = useState(null);
  const lock = useRef(false);

  function settle(v) {
    if (lock.current) return;
    lock.current = true;
    setPicked(v);
    setPhase("result");
    onDone(v);
  }

  useEffect(() => {
    let t;
    if (phase === "wait") t = setTimeout(() => setPhase("show"), 400 + Math.random() * 700);
    else if (phase === "show") t = setTimeout(() => settle(-1), round.ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const litIcon = (i) => round.lit.find((l) => l.i === i)?.icon;
  const msg =
    phase === "wait" ? "Get ready…" :
    phase === "show" ? "Tap the real diya 🪔 only!" :
    picked === round.diya ? "Nice! ✅" : picked === -1 ? "Too slow ⏱" : "Wrong one ❌";

  return (
    <>
      <div className="grid3">
        {Array.from({ length: 9 }, (_, i) => {
          let cls = "tile";
          let content = "";
          if (phase === "show" && litIcon(i)) {
            cls += " lit";
            content = litIcon(i);
          }
          if (phase === "result") {
            if (i === picked) {
              const ok = i === round.diya;
              cls += ok ? " ok" : " bad";
              content = ok ? "✅" : "❌";
            } else if (i === round.diya) {
              cls += " lit dim";
              content = "🪔";
            }
          }
          return (
            <button key={i} className={cls} aria-label={`tile ${i + 1}`} onClick={() => phase === "show" && settle(i)}>
              {content}
            </button>
          );
        })}
      </div>
      <div className="msg">{msg}</div>
    </>
  );
}

// ---------- Quiz and Quick Math (multiple choice with a countdown) ----------
function ChoiceRound({ round, onDone }) {
  const [left, setLeft] = useState(round.ms);
  const [picked, setPicked] = useState(null);
  const lock = useRef(false);

  function settle(v) {
    if (lock.current) return;
    lock.current = true;
    setPicked(v);
    onDone(v);
  }

  useEffect(() => {
    const end = Date.now() + round.ms;
    const id = setInterval(() => {
      const l = end - Date.now();
      if (l <= 0) {
        clearInterval(id);
        setLeft(0);
        settle(-1);
      } else setLeft(l);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cat = round.type === "quiz" ? CATS[round.cat] : null;
  const done = picked !== null;

  return (
    <>
      <div className="qmeta">
        <span>{round.type === "math" ? "🧮 Quick Math" : `${cat?.emoji || "❓"} ${cat?.label || "Quiz"}`}</span>
        <span>{done ? "🔒" : `${Math.ceil(left / 1000)}s`}</span>
      </div>
      <div className="timebar"><div style={{ width: (done ? 0 : (left / round.ms) * 100) + "%" }} /></div>
      <div className={"question" + (round.type === "math" ? " mathq" : "")}>{round.q}</div>
      <div className="choices">
        {round.options.map((o, i) => (
          <button key={i} className={"choice" + (picked === i ? " picked" : "")} disabled={done} onClick={() => settle(i)}>
            {o}
          </button>
        ))}
      </div>
      <div className="msg">{done ? (picked === -1 ? "Time up ⏱" : "Answer locked in 🔒") : "\u00a0"}</div>
    </>
  );
}

export default function Challenge({ rounds, minWins, onFinish }) {
  const [i, setI] = useState(0);
  const answers = useRef([]);
  const doneFor = useRef(-1);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const round = rounds[i];

  function done(v) {
    if (doneFor.current === i) return;
    doneFor.current = i;
    answers.current[i] = v;
    setTimeout(() => {
      if (i + 1 >= rounds.length) finishRef.current(answers.current);
      else setI(i + 1);
    }, round.type === "tap" ? 800 : 900);
  }

  return (
    <div className="stage">
      <div className="card" style={{ width: "min(92vw, 440px)", textAlign: "center" }}>
        <div className="head" style={{ fontSize: 15 }}>
          Round <b>{i + 1}</b> / {rounds.length} · Win {minWins} to unlock the wheel
        </div>
        <div className="dots">
          {rounds.map((_, n) => (
            <span key={n} className={"dot" + (n < i ? " done" : n === i ? " now" : "")} />
          ))}
        </div>
        {round.type === "tap" ? (
          <TapRound key={i} round={round} onDone={done} />
        ) : (
          <ChoiceRound key={i} round={round} onDone={done} />
        )}
      </div>
    </div>
  );
}
