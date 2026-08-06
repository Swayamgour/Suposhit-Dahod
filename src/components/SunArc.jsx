import React from "react";

// A sunrise-arc gauge: the signature visual motif, echoing the rising-sun
// emblem in the Dahod Smart City mark. The filled arc rises left-to-right
// like a sunrise as the percentage climbs.
export default function SunArc({ percent = 0, label, sublabel, size = 208 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 80;
  const cx = 100;
  const cy = 100;
  const circumference = Math.PI * r; // half circumference (semicircle)
  const offset = circumference - (clamped / 100) * circumference;

  const rayCount = 9;
  const rays = Array.from({ length: rayCount }).map((_, i) => {
    const t = i / (rayCount - 1);
    const angle = Math.PI - t * Math.PI; // 180deg -> 0deg
    const litUpTo = clamped / 100;
    const lit = t <= litUpTo + 0.001;
    const x1 = cx + Math.cos(angle) * (r + 6);
    const y1 = cy - Math.sin(angle) * (r + 6);
    const x2 = cx + Math.cos(angle) * (r + 14);
    const y2 = cy - Math.sin(angle) * (r + 14);
    return { x1, y1, x2, y2, lit, key: i };
  });

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 200 118" width={size} height={size * 0.59}>
        {rays.map((ray) => (
          <line
            key={ray.key}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke={ray.lit ? "#F2A93B" : "#EAE4D2"}
            strokeWidth={3}
            strokeLinecap="round"
          />
        ))}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#EAE4D2"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="url(#sunrise-gradient)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
        <defs>
          <linearGradient id="sunrise-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0F6E5D" />
            <stop offset="100%" stopColor="#F2A93B" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={10} fill="#F2A93B" />
      </svg>
      <p className="-mt-2 font-mono text-3xl font-semibold text-ink">{clamped}%</p>
      {label && <p className="mt-0.5 text-sm font-semibold text-ink">{label}</p>}
      {sublabel && <p className="text-xs text-muted">{sublabel}</p>}
    </div>
  );
}
