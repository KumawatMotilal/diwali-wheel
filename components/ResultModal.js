"use client";
import { useMemo } from "react";
import Icon from "@/components/Icon";
import { T } from "@/lib/i18n";

export default function ResultModal({ result, onClose, lang = "en" }) {
  const t = T[lang];
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
        <div className="center"><Icon name="gift" size={84} /></div>
        <div className="big" style={{ fontSize: 56 }}>{result.emoji}</div>
        <p>{t.congrats}</p>
        <h3>{result.name}</h3>
        <p>{t.happyShort}</p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={onClose}>{t.ok}</button>
        </div>
      </div>
    </div>
  );
}
