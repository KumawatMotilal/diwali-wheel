"use client";
import { useMemo } from "react";

export default function ResultModal({ result, onClose }) {
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
