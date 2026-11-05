"use client";
import { useEffect, useRef, useState } from "react";
import { CATS, gameInfo } from "@/lib/cats";
import { T } from "@/lib/i18n";
import Icon from "@/components/Icon";

// Plays the rounds prepared by the server. The browser never receives quiz/math/pattern/word answers,
// it only sends back what the player picked.  Answer formats:
//   quiz, math, sequence -> option index   tap -> tile (0-8)   odd -> tile (0-15)
//   scramble -> text       memory -> list of pad numbers        -1 = time ran out

function useCountdown(ms, onEnd, stopped) {
  const [left, setLeft] = useState(ms);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => {
    if (stopped) return;
    const end = Date.now() + ms;
    const id = setInterval(() => {
      const l = end - Date.now();
      if (l <= 0) { clearInterval(id); setLeft(0); endRef.current(); } else setLeft(l);
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopped]);
  return left;
}

function Head({ type, sub, left, ms, done, t, lang }) {
  const g = gameInfo(lang, type);
  return (
    <>
      <div className="qmeta">
        <span className="chip" style={{ background: g.color }}>{g.glyph}</span>
        <b>{sub || g.label}</b>
        <span className="secs">{done ? t.locked : left != null ? Math.ceil(left / 1000) + t.secs : ""}</span>
      </div>
      {ms ? <div className="timebar"><div style={{ width: (done || left == null ? 0 : (left / ms) * 100) + "%" }} /></div> : null}
    </>
  );
}

function useSettle(onDone) {
  const lock = useRef(false);
  const [val, setVal] = useState(null);
  return [val, (v) => { if (lock.current) return; lock.current = true; setVal(v); onDone(v); }];
}

// ---------- Tap the Diya ----------
function TapRound({ round, onDone, lang }) {
  const t = T[lang];
  const [phase, setPhase] = useState("wait");
  const [picked, settle] = useSettle(onDone);
  useEffect(() => {
    let t;
    if (phase === "wait") t = setTimeout(() => setPhase("show"), 400 + Math.random() * 700);
    else if (phase === "show") t = setTimeout(() => settle(-1), round.ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const done = picked !== null;
  const icon = (i) => round.lit.find((l) => l.i === i)?.icon;
  const msg = !done ? (phase === "wait" ? t.ready : t.tapReal) : picked === round.diya ? t.nice : picked === -1 ? t.slow : t.wrong;
  return (
    <>
      <Head type="tap"  t={t} lang={lang} />
      <div className="grid3">
        {Array.from({ length: 9 }, (_, i) => {
          let cls = "tile", n = null;
          if (!done && phase === "show" && icon(i)) { cls += " lit"; n = icon(i); }
          if (done) {
            if (i === picked) { cls += i === round.diya ? " ok" : " bad"; n = icon(i) || null; }
            else if (i === round.diya) { cls += " lit dim"; n = "diya"; }
          }
          return <button key={i} className={cls} aria-label={`tile ${i + 1}`} onClick={() => phase === "show" && settle(i)}>{n && <Icon name={n} size={42} />}</button>;
        })}
      </div>
      <div className="msg">{msg}</div>
    </>
  );
}

// ---------- Quiz / Quick Math / Number Pattern (multiple choice) ----------
function ChoiceRound({ round, onDone, lang }) {
  const t = T[lang];
  const [picked, settle] = useSettle(onDone);
  const done = picked !== null;
  const left = useCountdown(round.ms, () => settle(-1), done);
  const catLabel = round.type === "quiz" ? CATS[round.cat]?.label || t.cats[round.cat] : round.type === "joke" ? t.pickPunch : null;
  const big = round.type === "math" || round.type === "sequence";
  return (
    <>
      <Head type={round.type} sub={catLabel} left={left} ms={round.ms} done={done}  t={t} lang={lang} />
      <div className={"question" + (big ? " bigq" : "")}>{round.q}</div>
      <div className="choices">
        {round.options.map((o, i) => (
          <button key={i} className={"choice" + (picked === i ? " picked" : "")} disabled={done} onClick={() => settle(i)}>{o}</button>
        ))}
      </div>
      <div className="msg">{done ? (picked === -1 ? t.timeUp : t.lockedIn) : "\u00a0"}</div>
    </>
  );
}

// ---------- Odd One Out ----------
function OddRound({ round, onDone, lang }) {
  const t = T[lang];
  const [picked, settle] = useSettle(onDone);
  const done = picked !== null;
  const left = useCountdown(round.ms, () => settle(-1), done);
  return (
    <>
      <Head type="odd" left={left} ms={round.ms} done={done}  t={t} lang={lang} />
      <div className="question">{t.oddQ}</div>
      <div className="grid4">
        {round.cells.map((c, i) => (
          <button key={i} className={"tile sm" + (picked === i ? " picked" : "")} disabled={done} onClick={() => settle(i)}><Icon name={c} size={34} /></button>
        ))}
      </div>
      <div className="msg">{done ? (picked === -1 ? t.timeUp : t.lockedIn) : "\u00a0"}</div>
    </>
  );
}

// ---------- Word Scramble ----------
function ScrambleRound({ round, onDone, lang }) {
  const t = T[lang];
  const [used, setUsed] = useState([]);
  const [fin, settle] = useSettle(onDone);
  const done = fin !== null;
  const text = used.map((i) => round.letters[i]).join("");
  const left = useCountdown(round.ms, () => settle(text), done);
  const full = used.length === round.letters.length;
  return (
    <>
      <Head type="scramble" left={left} ms={round.ms} done={done}  t={t} lang={lang} />
      <div className="question">{t.hintLbl} {round.hint}</div>
      <div className="slots">
        {round.letters.map((_, n) => <span key={n} className="slot">{text[n] || ""}</span>)}
      </div>
      <div className="letters">
        {round.letters.map((l, i) => (
          <button key={i} className="letter" disabled={done || used.includes(i)} onClick={() => setUsed([...used, i])}>{l}</button>
        ))}
      </div>
      <div className="actions" style={{ justifyContent: "center" }}>
        <button className="btn ghost" disabled={done || !used.length} onClick={() => setUsed(used.slice(0, -1))}>{t.undo}</button>
        <button className="btn" disabled={done || !full} onClick={() => settle(text)}>{t.lockBtn}</button>
      </div>
      <div className="msg">{done ? t.lockedIn : "\u00a0"}</div>
    </>
  );
}

// ---------- Laddu or Boom ----------
function LadduRound({ round, onDone, lang }) {
  const t = T[lang];
  const [step, setStep] = useState(-1); // -1 = get ready
  const [mark, setMark] = useState(null); // { cell, ok } for the tapped pop
  const [fin, settle] = useSettle(onDone);
  const taps = useRef([]);
  const tappedNow = useRef(-1);
  const done = fin !== null;
  const total = round.steps.length;
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      if (step + 1 >= total) settle(taps.current);
      else { setMark(null); setStep(step + 1); }
    }, step === -1 ? 900 : round.stepMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);
  const cur = step >= 0 && step < total ? round.steps[step] : null;
  function tap(cell) {
    if (done || !cur || cell !== cur.cell || tappedNow.current === step) return;
    tappedNow.current = step;
    taps.current = [...taps.current, step];
    if (cur.kind === "boom") { setMark({ cell, ok: false }); settle(taps.current); }
    else setMark({ cell, ok: true });
  }
  const boom = done && mark && !mark.ok;
  const msg = boom ? t.boom : done ? t.lockedIn : step < 0 ? t.ready : t.ladduHint;
  return (
    <>
      <Head type="laddu"  t={t} lang={lang} />
      <div className="question">{t.pop(Math.max(step + 1, 0), total)}</div>
      <div className="grid3">
        {Array.from({ length: 9 }, (_, i) => {
          const show = !done && cur && cur.cell === i && !mark;
          let cls = "tile", n = null;
          if (show) { cls += " lit pop"; n = cur.kind === "laddu" ? "laddu" : "cracker"; }
          if (mark && mark.cell === i) { cls += mark.ok ? " ok" : " bad"; n = mark.ok ? "laddu" : "cracker"; }
          return <button key={i} className={cls} aria-label={`tile ${i + 1}`} onClick={() => tap(i)}>{n && <Icon name={n} size={42} />}</button>;
        })}
      </div>
      <div className="msg">{msg}</div>
    </>
  );
}

// ---------- Diya Memory ----------
const PADS = ["#f97316", "#be185d", "#15803d", "#4338ca"];
function MemoryRound({ round, onDone, lang }) {
  const t = T[lang];
  const [phase, setPhase] = useState("watch");
  const [flash, setFlash] = useState(-1);
  const [taps, setTaps] = useState([]);
  const [fin, settle] = useSettle(onDone);
  const done = fin !== null;
  const tapsRef = useRef([]);
  useEffect(() => {
    if (phase !== "watch") return;
    const ids = [];
    round.seq.forEach((p, n) => {
      ids.push(setTimeout(() => setFlash(p), 900 + n * 800));
      ids.push(setTimeout(() => setFlash(-1), 900 + n * 800 + 550));
    });
    ids.push(setTimeout(() => setPhase("play"), 900 + round.seq.length * 800));
    return () => ids.forEach(clearTimeout);
  }, [phase, round]);
  const left = useCountdown(round.ms, () => settle(tapsRef.current), done || phase !== "play");
  function tap(p) {
    if (phase !== "play" || done) return;
    const next = [...tapsRef.current, p];
    tapsRef.current = next;
    setTaps(next);
    setFlash(p);
    setTimeout(() => setFlash(-1), 180);
    if (next.length === round.seq.length || p !== round.seq[next.length - 1]) settle(next);
  }
  return (
    <>
      <Head type="memory" left={phase === "play" ? left : null} ms={round.ms} done={done}  t={t} lang={lang} />
      <div className="question">{done ? t.lockedIn : phase === "watch" ? t.watch : t.yourTurn(taps.length, round.seq.length)}</div>
      <div className="pads">
        {PADS.map((c, p) => (
          <button key={p} className={"pad" + (flash === p ? " on" : "")} style={{ "--pad": c }} disabled={phase !== "play" || done} onClick={() => tap(p)} aria-label={`diya ${p + 1}`}>
            <Icon name="diya" size={46} />
          </button>
        ))}
      </div>
    </>
  );
}

export default function Challenge({ rounds, minWins, onFinish, lang = "en" }) {
  const t = T[lang];
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
    }, 900);
  }

  const View = { tap: TapRound, odd: OddRound, scramble: ScrambleRound, memory: MemoryRound, laddu: LadduRound }[round.type] || ChoiceRound;
  return (
    <div className="stage">
      <div className="card game">
        <div className="head">{t.roundOf(i + 1, rounds.length, minWins)}</div>
        <div className="dots">{rounds.map((_, n) => <span key={n} className={"dot" + (n < i ? " done" : n === i ? " now" : "")} />)}</div>
        <View key={i} round={round} onDone={done} lang={lang} />
      </div>
    </div>
  );
}
