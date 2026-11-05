"use client";
import { useEffect, useRef, useState } from "react";

const COLORS = ["#b3122b", "#f59e0b", "#7c1d6f", "#ea580c", "#9f1239", "#ca8a04", "#5b21b6", "#d97706"];
const SIZE = 400;
const C = SIZE / 2;
const R = 190;
const SPIN_MS = 5200;

function pt(angleDeg, radius) {
  const t = (angleDeg * Math.PI) / 180;
  return [C + radius * Math.sin(t), C - radius * Math.cos(t)];
}

function slicePath(start, end) {
  const [x1, y1] = pt(start, R);
  const [x2, y2] = pt(end, R);
  const large = end - start > 180 ? 1 : 0;
  return `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
}

// spin = { index, nonce } -> wheel lands on gifts[index]
export default function Wheel({ gifts, spin, onDone }) {
  const [rot, setRot] = useState(0);
  const rotRef = useRef(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  const n = gifts.length;
  const a = 360 / n;

  useEffect(() => {
    if (!spin) return;
    const center = spin.index * a + a / 2;
    const jitter = (Math.random() - 0.5) * a * 0.6;
    const base = rotRef.current - (rotRef.current % 360);
    const next = base + 360 * 6 + (360 - (center + jitter));
    rotRef.current = next;
    setRot(next);
    const t = setTimeout(() => doneRef.current && doneRef.current(spin.index), SPIN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spin]);

  const fs = n > 12 ? 10 : n > 8 ? 12 : 14;
  const maxLen = n > 10 ? 9 : 13;

  return (
    <div className="wheel-wrap">
      <div className="pointer" />
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="wheel-svg">
        <circle cx={C} cy={C} r={R + 8} fill="#3b0a14" stroke="#fbbf24" strokeWidth="4" />
        <g
          style={{
            transformOrigin: `${C}px ${C}px`,
            transform: `rotate(${rot}deg)`,
            transition: `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.1, 1)`,
          }}
        >
          {n === 1 ? (
            <circle cx={C} cy={C} r={R} fill={COLORS[0]} />
          ) : (
            gifts.map((g, i) => (
              <path
                key={g.id}
                d={slicePath(i * a, (i + 1) * a)}
                fill={COLORS[i % COLORS.length]}
                stroke="#fde68a"
                strokeWidth="2"
              />
            ))
          )}
          {gifts.map((g, i) => {
            const center = i * a + a / 2;
            const label = g.name.length > maxLen ? g.name.slice(0, maxLen - 1) + "…" : g.name;
            return (
              <text
                key={"t" + g.id}
                transform={`rotate(${center - 90} ${C} ${C})`}
                x={C + R - 14}
                y={C}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={fs}
                fontWeight="700"
                fill="#fff"
              >
                {label} {g.emoji}
              </text>
            );
          })}
        </g>
        <circle cx={C} cy={C} r="34" fill="#3b0a14" stroke="#fbbf24" strokeWidth="4" />
        <text x={C} y={C} textAnchor="middle" dominantBaseline="central" fontSize="30">
          🪔
        </text>
      </svg>
    </div>
  );
}
