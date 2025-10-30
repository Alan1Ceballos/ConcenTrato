import React, { useMemo } from "react";

/**
 * Timer sincronizado (sincroniza con el backend vía socket)
 * Props:
 *  - secondsLeft: segundos restantes (desde servidor)
 *  - running: boolean
 */
export default function Timer({ secondsLeft = 0, running }) {
  const totalSeconds = useMemo(() => secondsLeft || 0, [secondsLeft]);
  const { mm, ss } = useMemo(() => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return { mm: m, ss: s };
  }, [totalSeconds]);

  const pct = Math.max(0, 1 - totalSeconds / (50 * 60));
  const size = 180;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "inline-grid", placeItems: "center", position: "relative" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1f2937" strokeWidth={stroke} />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: 2,
          }}
        >
          {mm}:{ss}
        </div>
      </div>
      <div style={{ color: "#93a1b1", marginTop: 8 }}>
        {running ? "Tiempo restante" : "Pausado / inactivo"}
      </div>
    </div>
  );
}
