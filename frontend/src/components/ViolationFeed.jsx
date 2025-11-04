import React, { useEffect, useMemo, useRef, useState } from "react";

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
      isNew: true,
      ...payload,
    };
    setEvents((prev) => clamp([ev, ...prev]));
    queueMicrotask(() =>
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
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
    <div
      className="feed"
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: "100%",
        overflow: "auto",
        gap: 12,
        paddingRight: 4,
        animation: "fadeIn 0.4s ease",
        scrollbarWidth: "thin",
      }}
    >

      <div ref={topRef} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 13,
          color: "#9ca3af",
        }}
      >
        <span>
          {events.length
            ? `${events.length} evento${events.length === 1 ? "" : "s"}`
            : "Sin eventos"}
        </span>
        {events.length > 0 && (
          <button
            className="btn-outline"
            onClick={() => setEvents([])}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              borderRadius: 8,
            }}
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
            textAlign: "center",
            borderRadius: 10,
          }}
        >
          Sin eventos recientes…
        </div>
      ) : (
        Object.entries(groups).map(([dayKey, list]) => (
          <section key={dayKey} style={{ display: "grid", gap: 8 }}>
            <HeaderDay label={prettyDay(dayKey)} />
            {list.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </section>
        ))
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes popIn {
            0% { opacity: 0; transform: translateY(-8px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          /* Brillo de nuevo evento */
          @keyframes newFlash {
            0% { box-shadow: 0 0 0px rgba(96,165,250,0.8); }
            40% { box-shadow: 0 0 20px rgba(96,165,250,0.8); }
            100% { box-shadow: 0 0 0 rgba(96,165,250,0); }
          }
          .new-event {
            animation: newFlash 1.6s ease-out;
          }
        `}
      </style>
    </div>
  );
}

/* ——— Subcomponentes ——— */

function HeaderDay({ label }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: "#93a1b1",
        userSelect: "none",
        marginTop: 4,
      }}
    >
      <div style={{ height: 1, background: "#1f2937", flex: 1 }} />
      <span
        style={{
          padding: "3px 10px",
          borderRadius: 999,
          border: "1px solid #1f2937",
          background: "linear-gradient(180deg,#0f141a,#0b1117)",
          fontWeight: 600,
        }}
      >
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
    neutral: { bg: "#0b1117", glow: "#64748b33" },
    info: { bg: "linear-gradient(180deg,#0b1117,#0a1118)", glow: "#60a5fa33" },
    success: { bg: "linear-gradient(180deg,#0b1117,#0f1a14)", glow: "#22c55e33" },
    danger: { bg: "linear-gradient(180deg,#0b1117,#190f12)", glow: "#ef444433" },
  }[tone];

  const cardRef = useRef(null);

  // cuando se monta, dispara el brillo temporal
  useEffect(() => {
    if (e.isNew && cardRef.current) {
      cardRef.current.classList.add("new-event");
      const t = setTimeout(
        () => cardRef.current?.classList.remove("new-event"),
        1800
      );
      return () => clearTimeout(t);
    }
  }, [e]);

  return (
    <div
      ref={cardRef}
      className="card"
      style={{
        padding: "12px 14px",
        background: tones.bg,
        border: "1px solid #1f2937",
        borderRadius: 10,
        animation: "popIn 0.25s ease",
        boxShadow: `0 2px 10px ${tones.glow}`,
        transition: "transform 0.2s ease",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr auto",
          alignItems: "start",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            display: "grid",
            placeItems: "center",
            background: "#0f141a",
            border: "1px solid #1f2937",
            fontSize: 16,
          }}
        >
          {icon}
        </div>

        <div style={{ lineHeight: 1.5 }}>
          <div style={{ fontWeight: 800, color: "#f3f4f6" }}>{title}</div>
          {detail && (
            <div style={{ marginTop: 2, color: "#93a1b1", fontSize: 13 }}>
              {detail}
            </div>
          )}

          {imagen && (
            <div style={{ marginTop: 8 }}>
              <a href={imagen} target="_blank" rel="noopener noreferrer">
                <img
                  src={imagen}
                  alt="Evidencia"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    maxHeight: 140,
                    borderRadius: 8,
                    border: "1px solid #1f2937",
                    cursor: "pointer",
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "scale(1.05)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "scale(1.0)")
                  }
                />
              </a>
            </div>
          )}
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#93a1b1",
            whiteSpace: "nowrap",
            marginTop: 2,
          }}
        >
          {hhmmss}
        </div>
      </div>
    </div>
  );
}

/* ——— Helpers ——— */

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
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
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

  const isSame = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (isSame(date, today)) return "Hoy";
  if (isSame(date, yday)) return "Ayer";
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}
