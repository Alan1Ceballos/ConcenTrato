import React, { useMemo } from "react";

/**
 * Timer sincronizado (sincroniza con el backend vía socket)
 * Props:
 *  - secondsLeft: segundos restantes (desde servidor)
 *  - running: boolean
 */
export default function Timer({ secondsLeft = 0, running }) {
  const totalSeconds = useMemo(() => Math.max(0, secondsLeft || 0), [secondsLeft]);

  const { mm, ss } = useMemo(() => {
    const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const s = String(totalSeconds % 60).padStart(2, "0");
    return { mm: m, ss: s };
  }, [totalSeconds]);

  // 50 minutos totales por defecto
  const pct = Math.max(0, 1 - totalSeconds / (50 * 60));
  const size = 200;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  // Colores dinámicos según el tiempo restante
  const color =
    totalSeconds > 20 * 60
      ? "#22c55e" // verde
      : totalSeconds > 5 * 60
      ? "#f59e0b" // ámbar
      : "#ef4444"; // rojo

  return (
    <div
      style={{
        textAlign: "center",
        animation: "fadeIn 0.6s ease",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "inline-grid",
          placeItems: "center",
          position: "relative",
          width: size,
          height: size,
        }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Círculo base */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#1f2937"
            strokeWidth={stroke}
          />
          {/* Círculo dinámico */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#timerGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: "stroke-dasharray 0.4s ease, stroke 0.4s ease",
              filter: "drop-shadow(0 0 6px rgba(96,165,250,0.3))",
            }}
          />
        </svg>

        {/* Texto central */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: 1,
            color: running ? "#f3f4f6" : "#6b7280",
            transition: "color 0.3s ease",
          }}
        >
          {mm}:{ss}
        </div>

        {/* Halo animado al correr */}
        {running && (
          <div
            style={{
              position: "absolute",
              inset: "-10px",
              borderRadius: "50%",
              background: "radial-gradient(rgba(96,165,250,0.08), transparent 70%)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {/* Estado textual */}
      <div
        style={{
          color: running ? "#22c55e" : "#9ca3af",
          fontSize: 14,
          marginTop: 10,
          fontWeight: 500,
          letterSpacing: 0.3,
        }}
      >
        {running ? "Tiempo en curso" : "Pausado / inactivo"}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 0.4; }
          }

          /* Responsive */
          @media (max-width: 600px) {
            svg { width: 160px; height: 160px; }
            div[style*="font-size: 48px"] {
              font-size: 36px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
