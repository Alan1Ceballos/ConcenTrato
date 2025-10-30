import React, { useEffect, useState } from "react";
import api from "../api/client.js";
import { useSocketCtx } from "../context/SocketContext.jsx";
import ViolationFeed from "../components/ViolationFeed.jsx";
import Timer from "../components/Timer.jsx";

/* ——— UI helpers ——— */
function Chip({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "rgba(148,163,184,0.12)", bd: "rgba(148,163,184,0.25)", fg: "#93a1b1" },
    success: { bg: "rgba(34,197,94,0.12)", bd: "rgba(34,197,94,0.25)", fg: "#22c55e" },
    danger: { bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.25)", fg: "#ef4444" },
    info: { bg: "rgba(96,165,250,0.12)", bd: "rgba(96,165,250,0.25)", fg: "#60a5fa" },
  }[tone] || {};
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        background: tones.bg,
        border: `1px solid ${tones.bd}`,
        color: tones.fg,
      }}
    >
      {children}
    </span>
  );
}

/* ——— Main ——— */
export default function Focus() {
  const groupId = typeof window !== "undefined" ? localStorage.getItem("groupId") : null;

  const [groupName, setGroupName] = useState("");
  const [minutes, setMinutes] = useState(50);
  const [detalle, setDetalle] = useState("");
  const [recompensa, setRecompensa] = useState("");
  const [castigo, setCastigo] = useState("");
  const [active, setActive] = useState(false);
  const [acuerdos, setAcuerdos] = useState({ recompensa: "", castigo: "" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const { socket, connected, onlineUsers, secondsLeft, focusActive, setSecondsLeft } = useSocketCtx();

  const showError = (e, fallback = "Error") => {
    const text = e?.response?.data?.message || e?.message || fallback;
    setErr(text);
    setMsg("");
  };
  const showMsg = (text) => {
    setMsg(text);
    setErr("");
  };

  // Carga inicial del grupo + estado del pacto
  useEffect(() => {
    const load = async () => {
      if (!groupId) return;
      try {
        const [{ data: g }, { data: focus }] = await Promise.all([
          api.get(`/api/grupos/${groupId}`),
          api.get(`/api/focus/${groupId}`),
        ]);
        setGroupName(g?.grupo?.nombre || "");
        if (focus && focus.estado === "activa") {
          setActive(true);
          setAcuerdos(focus.acuerdos || { recompensa: "", castigo: "" });
          if (focus.secondsLeft) setSecondsLeft(focus.secondsLeft);
          else setSecondsLeft(focus.minutosObjetivo * 60);
          try {
            await api.post(`/api/focus/${groupId}/join`);
          } catch {}
        } else {
          setActive(false);
          setAcuerdos({ recompensa: "", castigo: "" });
          setSecondsLeft(null);
        }
      } catch (e) {
        console.error("Error al cargar foco inicial:", e?.message || e);
      }
    };
    load();
  }, [groupId, setSecondsLeft]);

  // Escucha estado global del foco
  useEffect(() => {
    if (!socket) return;
    const onState = (s) => {
      if (!s) return;
      if (s.estado === "activa") {
        setActive(true);
        setAcuerdos(s.acuerdos || { recompensa: "", castigo: "" });
        if (s.secondsLeft) setSecondsLeft(s.secondsLeft);
        showMsg("Pacto iniciado correctamente.");
      }
      if (s.estado === "finalizada") {
        setActive(false);
        setAcuerdos({ recompensa: "", castigo: "" });
        setSecondsLeft(null);
        showMsg("Pacto finalizado correctamente.");
      }
    };
    socket.on("focus:state", onState);
    return () => socket.off("focus:state", onState);
  }, [socket, setSecondsLeft]);

  // Iniciar pacto
  const start = async () => {
    if (!groupId) return showError(null, "Seleccioná un grupo primero.");
    setMsg("");
    setErr("");
    try {
      await api.post(`/api/focus/${groupId}/start`, {
        minutosObjetivo: minutes,
        recompensa,
        castigo,
      });
      setRecompensa("");
      setCastigo("");
      showMsg("Pacto iniciado correctamente.");
    } catch (e) {
      showError(e, "No se pudo iniciar el pacto.");
    }
  };

  // Finalizar pacto
  const end = async () => {
    if (!groupId) return;
    try {
      const { data } = await api.post(`/api/focus/${groupId}/end`);
      showMsg(`Pacto finalizado. Se otorgaron ${data.puntos || 0} puntos a los participantes.`);
      setSecondsLeft(null);
      setAcuerdos({ recompensa: "", castigo: "" });
    } catch (e) {
      showError(e, "No se pudo finalizar el pacto.");
    }
  };

  // Reportar violación
  const reportViolation = async () => {
    if (!groupId) return showError(null, "No hay grupo activo.");
    try {
      await api.post("/api/violaciones", {
        grupoId: groupId,
        detalle: detalle || "Uso de red social",
      });
      showMsg("Violación registrada y enviada al grupo.");
      setDetalle("");
    } catch (e) {
      showError(e, "Error al registrar violación.");
    }
  };

  return (
    <div className="container">
      <div className="row" style={{ gap: 16 }}>
        {/* === Columna principal === */}
        <div className="card" style={{ flex: "2 1 560px", padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div
            style={{
              padding: "16px 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  background: "#111827",
                  border: "1px solid #1f2937",
                  color: "#9ca3af",
                }}
              >
                {(groupName || "G").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>Pacto grupal</h2>
                <div style={{ color: "#93a1b1", fontSize: 12 }}>
                  {groupId ? (
                    <>
                      Grupo: <b>{groupName || `…${groupId.slice(-5)}`}</b>
                    </>
                  ) : (
                    "Elegí un grupo."
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Chip tone={connected ? "success" : "danger"}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: connected ? "#22c55e" : "#ef4444",
                  }}
                />
              </Chip>
              <Chip>
                Conectados: <b style={{ marginLeft: 4 }}>{onlineUsers.length}</b>
              </Chip>
            </div>
          </div>

          <div
            style={{
              height: 1,
              background:
                "linear-gradient(90deg,#0b1117, #1f2937 20%, #1f2937 80%, #0b1117)",
            }}
          />

          {/* Controles */}
          <div style={{ padding: 16 }}>
            <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
              <div>
                <label className="label">Minutos</label>
                <select
                  className="select"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  disabled={active}
                >
                  {[25, 30, 45, 50, 60, 90].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {!active && (
                <>
                  <div style={{ flex: "1 1 220px" }}>
                    <label className="label">Recompensa</label>
                    <input
                      className="input"
                      value={recompensa}
                      onChange={(e) => setRecompensa(e.target.value)}
                      placeholder="Ej: elegir película, pizza, etc."
                    />
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <label className="label">Castigo</label>
                    <input
                      className="input"
                      value={castigo}
                      onChange={(e) => setCastigo(e.target.value)}
                      placeholder="Ej: 20 flexiones, etc."
                    />
                  </div>
                </>
              )}

              <div style={{ flex: 1 }} />
              <div className="row" style={{ gap: 8 }}>
                {!active ? (
                  <button className="btn" onClick={start} disabled={!groupId}>
                    Iniciar Pacto
                  </button>
                ) : (
                  <button className="btn-outline" onClick={end}>
                    Finalizar Pacto
                  </button>
                )}
              </div>
            </div>

            {/* Timer */}
            <div style={{ margin: "24px 0" }}>
              <Timer secondsLeft={secondsLeft || 0} running={focusActive} />
            </div>

            {/* Acuerdos */}
            {active && (acuerdos.recompensa || acuerdos.castigo) && (
              <div className="card" style={{ background: "#0f141a", borderColor: "#1f2937" }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Acuerdos actuales</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {acuerdos.recompensa && (
                    <Chip tone="info">
                      Recompensa: <b style={{ marginLeft: 6 }}>{acuerdos.recompensa}</b>
                    </Chip>
                  )}
                  {acuerdos.castigo && (
                    <Chip tone="danger">
                      Castigo: <b style={{ marginLeft: 6 }}>{acuerdos.castigo}</b>
                    </Chip>
                  )}
                </div>
              </div>
            )}

            {(msg || err) && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                {msg && <div style={{ color: "#22c55e", fontWeight: 500 }}>{msg}</div>}
                {err && <div style={{ color: "#f87171", fontWeight: 500 }}>{err}</div>}
              </div>
            )}

            <hr className="sep" />

            {/* Violación manual */}
            <div>
              <h3 style={{ marginTop: 0 }}>Registrar violación</h3>
              <div className="row" style={{ alignItems: "end", gap: 8 }}>
                <div style={{ flex: "1 1 260px" }}>
                  <label className="label">Detalle</label>
                  <input
                    className="input"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    placeholder="Ej: Abrí TikTok"
                  />
                </div>
                <button className="btn" onClick={reportViolation} disabled={!groupId}>
                  Reportar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === Columna lateral === */}
        <div className="card" style={{ flex: "1 1 320px" }}>
          <h3 style={{ marginTop: 0 }}>Actividad y conectados</h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {onlineUsers.length === 0 ? (
              <div style={{ color: "#93a1b1" }}>Nadie conectado…</div>
            ) : (
              onlineUsers.map((uid) => (
                <span
                  key={uid}
                  title={uid}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 999,
                    border: "1px solid #1f2937",
                    background: "#0b1117",
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: "#22c55e",
                    }}
                  />
                  …{uid.slice(-5)}
                </span>
              ))
            )}
          </div>

          <hr className="sep" />

          <h4 style={{ marginTop: 0 }}>Feed</h4>
          <ViolationFeed socket={socket} />
        </div>
      </div>
    </div>
  );
}
