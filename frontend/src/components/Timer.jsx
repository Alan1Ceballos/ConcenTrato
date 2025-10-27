import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Timer con anillo de progreso y sync preciso con requestAnimationFrame.
 * Props:
 *  - minutes: número de minutos a contar (default 50)
 *  - running: booleano (inicia/pausa)
 *  - onTick?: (secondsLeft: number) => void
 *  - onFinish?: () => void
 */
export default function Timer({ minutes = 50, running, onTick, onFinish }) {
  const totalSeconds = Math.max(0, Math.round(minutes * 60));
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // refs para control fino del loop
  const rafRef = useRef(null);
  const startAtRef = useRef(null);         // timestamp cuando arrancó el ciclo actual
  const initialLeftRef = useRef(totalSeconds); // segundos disponibles al momento de arrancar/continuar

  // Reiniciar cuando cambian los minutos
  useEffect(() => {
    cancelLoop();
    setTimeLeft(totalSeconds);
    initialLeftRef.current = totalSeconds;
    startAtRef.current = null;
  }, [totalSeconds]);

  // Arrancar / pausar
  useEffect(() => {
    if (running) {
      startLoop();
    } else {
      cancelLoop(); // pausa, mantenemos timeLeft como está
    }
    return cancelLoop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const startLoop = () => {
    if (rafRef.current) return;
    const now = performance.now();
    // si veníamos pausados, usamos el timeLeft actual como base
    if (startAtRef.current == null) {
      startAtRef.current = now;
      initialLeftRef.current = timeLeft;
    }
    const step = (t) => {
      const elapsed = Math.floor((t - startAtRef.current) / 1000);
      const remaining = Math.max(0, initialLeftRef.current - elapsed);

      if (remaining !== timeLeft) {
        setTimeLeft(remaining);
        onTick?.(remaining);
      }

      if (remaining <= 0) {
        cancelLoop();
        onFinish?.();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const cancelLoop = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    // al pausar, reseteamos el start para que al reanudar no pierda sync
    startAtRef.current = null;
    initialLeftRef.current = timeLeft;
  };

  // Derivados para UI
  const { mm, ss } = useMemo(() => {
    const m = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const s = String(timeLeft % 60).padStart(2, "0");
    return { mm: m, ss: s };
  }, [timeLeft]);

  // Progreso para el anillo
  const pct = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 1;
  const size = 180;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div style={{ textAlign: "center" }} aria-live="polite" aria-label="Temporizador de pacto">
      <div style={{ display: "inline-grid", placeItems: "center", position: "relative" }}>
        {/* Anillo */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Progreso ${Math.round(pct*100)}%`}>
          <defs>
            <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          {/* Fondo */}
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke="#1f2937"
            strokeWidth={stroke}
          />
          {/* Progreso */}
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

        {/* Tiempo */}
        <div
          className="time"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: 2,
            padding: "8px 10px",
            borderRadius: 14
          }}
        >
          {mm}:{ss}
        </div>
      </div>

      <div style={{ color: "#93a1b1", marginTop: 8 }}>
        {running ? "Tiempo restante" : "Pausado"}
      </div>
    </div>
  );
}
