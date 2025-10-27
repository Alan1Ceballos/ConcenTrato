import React, { useEffect, useState } from "react";
import api from "../api/client.js";
import { useSocketCtx } from "../context/SocketContext.jsx";
import ViolationFeed from "../components/ViolationFeed.jsx";
import Timer from "../components/Timer.jsx"; // ⬅️ ahora usamos el Timer con anillo

/* ——— UI helpers ——— */
function Chip({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "rgba(148,163,184,0.12)", bd: "rgba(148,163,184,0.25)", fg: "#93a1b1" },
    success: { bg: "rgba(34,197,94,0.12)", bd: "rgba(34,197,94,0.25)", fg: "#22c55e" },
    danger:  { bg: "rgba(239,68,68,0.12)", bd: "rgba(239,68,68,0.25)", fg: "#ef4444" },
    info:    { bg: "rgba(96,165,250,0.12)", bd: "rgba(96,165,250,0.25)", fg: "#60a5fa" },
  }[tone] || {};
  return (
    <span
      className="badge"
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 12, padding: "4px 8px", borderRadius: 999,
        background: tones.bg, border: `1px solid ${tones.bd}`, color: tones.fg
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

  const { socket, connected, onlineUsers, secondsLeft, setSecondsLeft } = useSocketCtx();

  const showError = (e, fallback = "Error") => {
    const text = e?.response?.data?.message || e?.message || fallback;
    setErr(text);
    setMsg("");
  };
  const showMsg = (text) => {
    setMsg(text);
    setErr("");
  };

  // Bootstrap estado de grupo + foco
  useEffect(() => {
    const load = async () => {
      if (!groupId) return;
      try {
        const [{ data: g }, { data: focus }] = await Promise.all([
          api.get(`/api/grupos/${groupId}`),
          api.get(`/api/focus/${groupId}`)
        ]);
        setGroupName(g?.grupo?.nombre || "");
        if (focus && focus.estado === "activa") {
          setActive(true);
          setAcuerdos(focus.acuerdos || { recompensa: "", castigo: "" });
          // sincronizamos el contador visual (si tu backend expone segundos restantes, usalos aquí)
          setSecondsLeft(focus.minutosObjetivo * 60);
          // asegura que yo quede como participante
          try { await api.post(`/api/focus/${groupId}/join`); } catch {}
        } else {
          setActive(false);
          setAcuerdos({ recompensa: "", castigo: "" });
          setSecondsLeft(null);
        }
      } catch {
        // noop
      }
    };
    load();
  }, [groupId, setSecondsLeft]);

  // Realtime cambios de estado del foco
  useEffect(() => {
    if (!socket) return;
    const onState = (s) => {
      if (!s) return;
      if (s.estado === "activa") {
        setActive(true);
        setAcuerdos(s.acuerdos || { recompensa: "", castigo: "" });
        // si tu server emite segundos restantes, podés actualizar setSecondsLeft(s.secondsLeft)
      }
      if (s.estado === "finalizada") {
        setActive(false);
        setAcuerdos({ recompensa: "", castigo: "" });
        setSecondsLeft(null);
      }
    };
    socket.on("focus:state", onState);
    return () => socket.off("focus:state", onState);
  }, [socket, setSecondsLeft]);

  // Acciones
  const start = async () => {
    if (!groupId) { showError(null, "Elegí un grupo primero."); return; }
    setMsg(""); setErr("");
    try {
      await api.post(`/api/focus/${groupId}/start`, {
        minutosObjetivo: minutes,
        recompensa,
        castigo
      });
      setRecompensa("");
      setCastigo("");
      showMsg("Pacto iniciado para el grupo.");
    } catch (e) { showError(e, "No se pudo iniciar el Pacto"); }
  };

  const end = async () => {
    if (!groupId) return;
    try {
      const { data } = await api.post(`/api/focus/${groupId}/end`);
      showMsg(`Pacto finalizado. +${data.puntos} pts para quienes participaron.`);
      setSecondsLeft(null);
      setAcuerdos({ recompensa: "", castigo: "" });
    } catch (e) { showError(e, "No se pudo finalizar"); }
  };

  const reportViolation = async () => {
    if (!groupId) return showError(null, "No hay grupo.");
    try {
      await api.post("/api/violaciones", { grupoId: groupId, detalle: detalle || "Uso de red social" });
      showMsg("Violación registrada y enviada al grupo en vivo.");
      setDetalle("");
    } catch (e) { showError(e, "Error al registrar violación"); }
  };

  // ——— Timer: qué minutos pasarle ———
  // Si tenemos segundos desde el server (secondsLeft), aproximamos minutos iniciales;
  // si no, usamos el picker local `minutes`.
  const timerMinutes =
    secondsLeft != null
      ? Math.max(1, Math.ceil(secondsLeft / 60)) // aprox. al minuto más cercano hacia arriba
      : (active ? minutes : 0);

  return (
    <div className="container">
      <div className="row" style={{ gap: 16 }}>
        {/* Columna principal */}
        <div className="card" style={{ flex: "2 1 560px", padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  display: "grid", placeItems: "center",
                  fontWeight: 900, background: "#111827", border: "1px solid #1f2937", color: "#9ca3af"
                }}
                title="Grupo"
              >
                {(groupName || "G").slice(0,1).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0 }}>Pacto grupal</h2>
                <div style={{ color: "#93a1b1", fontSize: 12 }}>
                  {groupId ? <>Grupo: <b>{groupName || `…${groupId.slice(-5)}`}</b></> : "Elegí un grupo."}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Chip tone={connected ? "success" : "danger"}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: 999,
                    background: connected ? "#22c55e" : "#ef4444"
                  }}
                />
                Socket: {connected ? "online" : "offline"}
              </Chip>
              <Chip>Conectados: <b style={{ marginLeft: 4 }}>{onlineUsers.length}</b></Chip>
            </div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg,#0b1117, #1f2937 20%, #1f2937 80%, #0b1117)" }} />

          {/* Controles */}
          <div style={{ padding: 16 }}>
            <div className="row" style={{ alignItems: "flex-end", gap: 12 }}>
              <div>
                <label className="label">Minutos (al iniciar)</label>
                <select className="select" value={minutes} onChange={e => setMinutes(Number(e.target.value))} disabled={active}>
                  {[25, 30, 45, 50, 60, 90].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {!active && (
                <>
                  <div style={{ flex: "1 1 220px" }}>
                    <label className="label">Recompensa (opcional)</label>
                    <input
                      className="input"
                      value={recompensa}
                      onChange={e => setRecompensa(e.target.value)}
                      placeholder="Ej: elegir peli, pizza, etc."
                    />
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <label className="label">Castigo (opcional)</label>
                    <input
                      className="input"
                      value={castigo}
                      onChange={e => setCastigo(e.target.value)}
                      placeholder="Ej: 20 flexiones, etc."
                    />
                  </div>
                </>
              )}

              <div style={{ flex: 1 }} />
              <div className="row" style={{ gap: 8 }}>
                {!active ? (
                  <button className="btn" onClick={start} disabled={!groupId}>Iniciar Pacto</button>
                ) : (
                  <button className="btn-outline" onClick={end}>Finalizar Pacto</button>
                )}
              </div>
            </div>

            {/* Timer (anillo SVG) */}
            <div style={{ margin: "24px 0" }}>
              <Timer
                key={active ? `on-${timerMinutes}` : "off"} // fuerza reinicio visual al iniciar/finalizar
                minutes={timerMinutes}
                running={active}
                onTick={(sec) => {
                  // si querés, podés reflejar el tick local en tu contexto:
                  // setSecondsLeft(sec);
                }}
                onFinish={() => {
                  // opcional: feedback local al terminar
                }}
              />
              {/* Estado textual debajo del anillo */}
              <div style={{ color: "#93a1b1", marginTop: 6, textAlign: "center" }}>
                {active ? "Pacto en curso (sync servidor)" : "Esperando iniciar…"}
              </div>
            </div>

            {/* Acuerdos en chips */}
            {active && (acuerdos.recompensa || acuerdos.castigo) && (
              <div className="card" style={{ background: "#0f141a", borderColor: "#1f2937" }}>
                <div style={{ fontWeight: 800, marginBottom: 8 }}>Acuerdos para esta sesión</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {acuerdos.recompensa && <Chip tone="info">🎁 Recompensa: <b style={{ marginLeft: 6 }}>{acuerdos.recompensa}</b></Chip>}
                  {acuerdos.castigo && <Chip tone="danger">⚠️ Castigo: <b style={{ marginLeft: 6 }}>{acuerdos.castigo}</b></Chip>}
                </div>
              </div>
            )}

            {/* Mensajes */}
            {(msg || err) && (
              <div style={{ marginTop: 12 }}>
                {msg && <div style={{ color: "#22c55e" }}>{msg}</div>}
                {err && <div style={{ color: "#f87171" }}>{err}</div>}
              </div>
            )}

            <hr className="sep" />

            {/* Violación manual */}
            <div>
              <h3 style={{ marginTop: 0 }}>Registrar violación (manual)</h3>
              <div className="row" style={{ alignItems: "end", gap: 8 }}>
                <div style={{ flex: "1 1 260px" }}>
                  <label className="label">Detalle</label>
                  <input
                    className="input"
                    value={detalle}
                    onChange={e => setDetalle(e.target.value)}
                    placeholder="Ej: Abrí TikTok"
                  />
                </div>
                <button className="btn" onClick={reportViolation} disabled={!groupId}>Reportar</button>
              </div>
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="card" style={{ flex: "1 1 320px" }}>
          <h3 style={{ marginTop: 0 }}>Actividad y conectados</h3>

          {/* Conectados */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {onlineUsers.length === 0 ? (
              <div style={{ color: "#93a1b1" }}>Nadie conectado…</div>
            ) : (
              onlineUsers.map(uid => (
                <span
                  key={uid}
                  className="time"
                  title={uid}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "4px 8px", borderRadius: 999,
                    border: "1px solid #1f2937", background: "#0b1117", fontSize: 12
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: 999, background: "#22c55e"
                  }} />
                  …{uid.slice(-5)}
                </span>
              ))
            )}
          </div>

          <hr className="sep" />

          {/* Feed de violaciones / eventos */}
          <h4 style={{ marginTop: 0 }}>Feed</h4>
          <ViolationFeed socket={socket} />
        </div>
      </div>
    </div>
  );
}
