import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * ViolationFeed
 * - Tarjetas compactas con iconos y colores por tipo
 * - Muestra imagen adjunta si existe (miniatura clickeable)
 * - Agrupa por día (Hoy / Ayer / dd MMM)
 * - Timestamps cortos HH:mm:ss
 * - Máximo 100 eventos
 */
export default function ViolationFeed({ socket }) {
  const [events, setEvents] = useState([]);
  const topRef = useRef(null);

  const clamp = (arr, max = 100) => (arr.length > max ? arr.slice(0, max) : arr);
  const nowStr = () => new Date().toISOString();

  const pushEvent = (payload, type) => {
    const ev = {
      id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      atISO: nowStr(),
      ...payload,
    };
    setEvents(prev => clamp([ev, ...prev]));
    queueMicrotask(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  useEffect(() => {
    if (!socket) return;

    const onViolation = (p) => pushEvent(p, "violation");
    const onStarted = (p) => pushEvent(p, "session:started");
    const onFinished = (p) => pushEvent(p, "session:finished");

    socket.on("violation", onViolation);
    socket.on("session:started", onStarted);
    socket.on("session:finished", onFinished);

    return () => {
      socket.off("violation", onViolation);
      socket.off("session:started", onStarted);
      socket.off("session:finished", onFinished);
    };
  }, [socket]);

  const groups = useMemo(() => groupByDay(events), [events]);

  return (
    <div className="feed" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div ref={topRef} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#93a1b1" }}>
          {events.length ? `${events.length} evento${events.length === 1 ? "" : "s"}` : "Sin eventos"}
        </div>
        {events.length > 0 && (
          <button
            className="btn-outline"
            onClick={() => setEvents([])}
            title="Limpiar feed"
            style={{ padding: "4px 10px", fontSize: 12 }}
          >
            Limpiar
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "14px 16px",
            color: "#93a1b1",
            background: "#0b1117",
            borderColor: "#1f2937",
            textAlign: "center"
          }}
        >
          Sin eventos recientes…
        </div>
      ) : (
        Object.entries(groups).map(([dayKey, list]) => (
          <section key={dayKey} style={{ display: "grid", gap: 8 }}>
            <HeaderDay label={prettyDay(dayKey)} />
            {list.map(e => (
              <EventCard key={e.id} e={e} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

/* ——— Subcomponentes ——— */

function HeaderDay({ label }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8,
        fontSize: 12, color: "#93a1b1", userSelect: "none"
      }}
    >
      <div style={{ height: 1, background: "#1f2937", flex: 1 }} />
      <span style={{ padding: "2px 8px", borderRadius: 999, border: "1px solid #1f2937", background: "#0b1117" }}>
        {label}
      </span>
      <div style={{ height: 1, background: "#1f2937", flex: 1 }} />
    </div>
  );
}

function EventCard({ e }) {
  const { icon, tone, title, detail, imagen } = describeEvent(e);
  const hhmmss = formatTime(e.atISO);

  const tones = {
    neutral: { bg: "#0b1117", bd: "#1f2937" },
    info: { bg: "linear-gradient(180deg,#0b1117,#0a1118)", bd: "#1f2937" },
    success: { bg: "linear-gradient(180deg,#0b1117,#0f1a14)", bd: "#1f2937" },
    danger: { bg: "linear-gradient(180deg,#0b1117,#190f12)", bd: "#1f2937" },
  }[tone];

  return (
    <div className="card" style={{ padding: "12px 14px", background: tones.bg, borderColor: tones.bd }}>
      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", alignItems: "start", gap: 10 }}>
        <div
          aria-hidden
          style={{
            width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center",
            border: "1px solid #1f2937", background: "#0f141a", fontSize: 14
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 800 }}>{title}</div>
          {detail && <div style={{ marginTop: 2, color: "#93a1b1" }}>{detail}</div>}

          {/* Si existe imagen, mostrar miniatura */}
          {imagen && (
            <div style={{ marginTop: 8 }}>
              <a
                href={imagen}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={imagen}
                  alt="Evidencia"
                  style={{
                    maxWidth: 160,
                    maxHeight: 120,
                    borderRadius: 6,
                    border: "1px solid #1f2937",
                    cursor: "pointer",
                    objectFit: "cover",
                  }}
                />
              </a>
            </div>
          )}


        </div>
        <div style={{ fontSize: 12, color: "#93a1b1" }}>{hhmmss}</div>
      </div>
    </div>
  );
}

/* ——— Lógica de presentación ——— */

function describeEvent(e) {
  const user = e.usuario?.nombre || "Alguien";
  if (e.type === "violation") {
    const pts = typeof e.puntos === "number" ? ` (${e.puntos})` : "";
    return {
      icon: "⚠️",
      tone: "danger",
      title: `Violación — ${user}${pts}`,
      detail: e.detalle || "",
      imagen: e.imagen || null,
    };
  }
  if (e.type === "session:started") {
    return {
      icon: "⏱️",
      tone: "info",
      title: `Pacto iniciado — ${user}`,
      detail: e.minutos ? `${e.minutos} min` : "",
    };
  }
  if (e.type === "session:finished") {
    return {
      icon: "✅",
      tone: "success",
      title: `Pacto finalizado — ${user}`,
      detail: typeof e.puntos === "number" ? `+${e.puntos} pts` : "",
    };
  }
  return {
    icon: "📝",
    tone: "neutral",
    title: e.type || "Evento",
    detail: "",
  };
}

function formatTime(iso) {
  try {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  } catch {
    return new Date().toLocaleTimeString();
  }
}

function groupByDay(arr) {
  const map = {};
  for (const e of arr) {
    const d = new Date(e.atISO);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    (map[key] ||= []).push(e);
  }
  return map;
}

function prettyDay(key) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  const yday = new Date(today);
  yday.setDate(today.getDate() - 1);

  const isSame = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSame(date, today)) return "Hoy";
  if (isSame(date, yday)) return "Ayer";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
