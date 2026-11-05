// Flat SVG icons (no emoji, so they look the same on every phone).
const P = {
  diya: <><path d="M5 26h38c0 9-8 16-19 16S5 35 5 26z" fill="#c2410c" /><path d="M24 5c5 6 7 11 4 16-1.5 2-6.5 2-8 0-3-5 0-10 4-16z" fill="#f59e0b" /><path d="M24 12c2 3 3 5 1.5 7.5-.8 1-2.2 1-3 0C21 17 22 15 24 12z" fill="#fde68a" /></>,
  star: <path d="M24 3l5.5 15.5L45 24l-15.5 5.5L24 45l-5.5-15.5L3 24l15.5-5.5z" fill="#f59e0b" />,
  sun: <><circle cx="24" cy="24" r="9" fill="#f97316" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <rect key={a} x="22.5" y="3" width="3" height="9" rx="1.5" fill="#f97316" transform={`rotate(${a} 24 24)`} />)}</>,
  moon: <path d="M30 5a19 19 0 1 0 13 27A16 16 0 0 1 30 5z" fill="#6366f1" />,
  lantern: <><rect x="12" y="10" width="24" height="26" rx="9" fill="#dc2626" /><rect x="16" y="5" width="16" height="5" rx="1.5" fill="#b45309" /><rect x="16" y="36" width="16" height="4" rx="1.5" fill="#b45309" /><path d="M24 40v6" stroke="#b45309" strokeWidth="3" /><path d="M24 10v26" stroke="#fca5a5" strokeWidth="2" /></>,
  cracker: <><rect x="18" y="16" width="12" height="28" rx="2" fill="#be123c" /><rect x="18" y="26" width="12" height="5" fill="#fde68a" /><path d="M24 16V8" stroke="#555" strokeWidth="2.5" /><circle cx="24" cy="6" r="3.5" fill="#f59e0b" /></>,
  bell: <><path d="M10 34c3-3 4-7 4-13a10 10 0 0 1 20 0c0 6 1 10 4 13z" fill="#ca8a04" /><circle cx="24" cy="38" r="4" fill="#92400e" /><circle cx="24" cy="8" r="2.5" fill="#92400e" /></>,
  marigold: <>{Array.from({ length: 10 }, (_, i) => <circle key={i} cx={24 + 14 * Math.cos((i * Math.PI) / 5)} cy={24 + 14 * Math.sin((i * Math.PI) / 5)} r="7" fill="#f59e0b" />)}<circle cx="24" cy="24" r="9" fill="#ea580c" /></>,
  rangoli: <>{Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="24" cy="11" rx="4.5" ry="9" fill={i % 2 ? "#be185d" : "#f97316"} transform={`rotate(${i * 45} 24 24)`} />)}<circle cx="24" cy="24" r="6" fill="#fde68a" /><circle cx="24" cy="24" r="2.5" fill="#15803d" /></>,
  lotus: <><ellipse cx="24" cy="26" rx="6" ry="16" fill="#ec4899" /><ellipse cx="24" cy="26" rx="6" ry="16" fill="#f472b6" transform="rotate(-50 24 40)" /><ellipse cx="24" cy="26" rx="6" ry="16" fill="#f472b6" transform="rotate(50 24 40)" /><path d="M6 40q18 8 36 0" stroke="#15803d" strokeWidth="4" fill="none" /></>,
  laddu: <><circle cx="24" cy="24" r="17" fill="#f59e0b" />{[[17, 18], [28, 16], [32, 27], [22, 30], [14, 29], [24, 23]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2" fill="#b45309" />)}</>,
  coin: <><circle cx="24" cy="24" r="18" fill="#eab308" /><circle cx="24" cy="24" r="13" fill="none" stroke="#a16207" strokeWidth="2" /><text x="24" y="31" textAnchor="middle" fontSize="19" fontWeight="700" fill="#a16207" fontFamily="Georgia, serif">₹</text></>,
  gift: <><rect x="6" y="19" width="36" height="23" rx="2" fill="#be185d" /><rect x="4" y="12" width="40" height="9" rx="2" fill="#db2777" /><rect x="21" y="12" width="6" height="30" fill="#fde68a" /><path d="M24 12c-6-9-14-2-8 0zM24 12c6-9 14-2 8 0z" fill="#fde68a" /></>,
};
export default function Icon({ name, size = 36, className = "" }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      {P[name] || P.diya}
    </svg>
  );
}

// Hanging flags along the top of every page.
export function Toran() {
  const cols = ["#f97316", "#be185d", "#15803d", "#eab308"];
  return (
    <svg className="toran" viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 3h400" stroke="#9a3412" strokeWidth="2" />
      {Array.from({ length: 20 }, (_, i) => (
        <g key={i}>
          <path d={`M${i * 20 + 2} 3h16l-8 26z`} fill={cols[i % 4]} />
          <circle cx={i * 20 + 10} cy="9" r="2" fill="#fff7e6" />
        </g>
      ))}
    </svg>
  );
}
