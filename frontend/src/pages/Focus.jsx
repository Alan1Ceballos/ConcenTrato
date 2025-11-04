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
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

/* ——— Main ——— */
export default function Focus() {
  const groupId =
    typeof window !== "undefined" ? localStorage.getItem("groupId") : null;

  const [groupName, setGroupName] = useState("");
  const [minutes, setMinutes] = useState(50);
  const [detalle, setDetalle] = useState("");
  const [imagen, setImagen] = useState(null);
  const [recompensa, setRecompensa] = useState("");
  const [castigo, setCastigo] = useState("");
  const [active, setActive] = useState(false);
  const [acuerdos, setAcuerdos] = useState({ recompensa: "", castigo: "" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const { socket, connected, secondsLeft, focusActive, setSecondsLeft } =
    useSocketCtx();

  const showError = (e, fallback = "Error") => {
    const text = e?.response?.data?.message || e?.message || fallback;
    setErr(text);
    setMsg("");
  };
  const showMsg = (text) => {
    setMsg(text);
    setErr("");
  };

  /* ——— Carga inicial de grupo y foco activo ——— */
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
          setAcuerdos(focus.acuerdos || {});
          setSecondsLeft(focus.secondsLeft || focus.minutosObjetivo * 60);
          try {
            await api.post(`/api/focus/${groupId}/join`);
          } catch { }
        } else {
          setActive(false);
          setAcuerdos({});
          setSecondsLeft(null);
        }
      } catch (e) {
        console.error("Error al cargar foco inicial:", e?.message || e);
      }
    };
    load();
  }, [groupId, setSecondsLeft]);

  /* ——— Estado en tiempo real ——— */
  useEffect(() => {
    if (!socket) return;
    const onState = (s) => {
      if (!s) return;
      if (s.estado === "activa") {
        setActive(true);
        setAcuerdos(s.acuerdos || {});
        if (s.secondsLeft) setSecondsLeft(s.secondsLeft);
        showMsg("Pacto iniciado correctamente.");
      } else if (s.estado === "finalizada") {
        setActive(false);
        setAcuerdos({});
        setSecondsLeft(null);
        showMsg("Pacto finalizado correctamente.");
      }
    };
    socket.on("focus:state", onState);
    return () => socket.off("focus:state", onState);
  }, [socket, setSecondsLeft]);

  /* ——— Acciones ——— */
  const start = async () => {
    if (!groupId) return showError(null, "Seleccioná un grupo primero.");
    setMsg("");
    setErr("");
    try {
      const { data } = await api.post(`/api/focus/${groupId}/start`, {
        minutosObjetivo: minutes,
        recompensa,
        castigo,
      });
      setRecompensa("");
      setCastigo("");
      setAcuerdos(data.acuerdos || {});
      showMsg("Pacto iniciado correctamente.");
    } catch (e) {
      showError(e, "No se pudo iniciar el pacto.");
    }
  };

  const end = async () => {
    if (!groupId) return;
    try {
      const { data } = await api.post(`/api/focus/${groupId}/end`);
      showMsg(`Pacto finalizado. Se otorgaron ${data.puntos || 0} puntos.`);
      setSecondsLeft(null);
      setAcuerdos({});
    } catch (e) {
      showError(e, "No se pudo finalizar el pacto.");
    }
  };

  const reportViolation = async () => {
    if (!groupId) return showError(null, "No hay grupo activo.");
    try {
      const form = new FormData();
      form.append("grupoId", groupId);
      form.append("detalle", detalle || "Uso de red social");
      if (imagen) form.append("imagen", imagen);
      await api.post("/api/violaciones", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showMsg("Violación registrada correctamente.");
      setDetalle("");
      setImagen(null);
    } catch (e) {
      showError(e, "Error al registrar violación.");
    }
  };

  return (
    <div
      className="container"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* === Contenedor flexible === */}
      <div
        className="row"
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
        }}
      >
        {/* === COLUMNA PRINCIPAL === */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: "hidden",
            border: "1px solid #1f2937",
            background: "linear-gradient(180deg,#0b1117,#0a0f14)",
          }}
        >
          <div
            style={{
              padding: "16px 16px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <h2 style={{ margin: 0 }}>Pacto grupal</h2>
            <Chip tone={connected ? "success" : "danger"}>
              {connected ? "Conectado" : "Desconectado"}
            </Chip>
          </div>

          <div style={{ padding: 16 }}>
            {/* === Configuración de pacto === */}
            <div
              className="row"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-end",
                gap: 12,
              }}
            >
              <div>
                <label className="label">Minutos</label>
                <select
                  className="select"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  disabled={active}
                  style={{
                    background: "#0f141a",
                    border: "1px solid #1f2937",
                    color: "#e5e7eb",
                    padding: "6px 10px",
                    borderRadius: 6,
                  }}
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
                      placeholder="Ej: pizza, película..."
                    />
                  </div>
                  <div style={{ flex: "1 1 220px" }}>
                    <label className="label">Castigo</label>
                    <input
                      className="input"
                      value={castigo}
                      onChange={(e) => setCastigo(e.target.value)}
                      placeholder="Ej: 20 flexiones"
                    />
                  </div>
                </>
              )}

              <div style={{ flex: 1 }} />
              <div className="row" style={{ gap: 8 }}>
                {!active ? (
                  <button className="btn" onClick={start}>
                    Iniciar
                  </button>
                ) : (
                  <button className="btn-outline" onClick={end}>
                    Finalizar
                  </button>
                )}
              </div>
            </div>

            {/* === Temporizador === */}
            <div style={{ margin: "24px 0" }}>
              <Timer secondsLeft={secondsLeft || 0} running={focusActive} />
            </div>

            {/* === Acuerdos activos === */}
            {active && (acuerdos.recompensa || acuerdos.castigo) && (
              <div
                className="card"
                style={{
                  background: "#0f141a",
                  borderColor: "#1f2937",
                  marginBottom: 16,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 6 }}>
                  Acuerdos activos
                </div>
                {acuerdos.recompensa && (
                  <div>🎁 Recompensa: <b>{acuerdos.recompensa}</b></div>
                )}
                {acuerdos.castigo && (
                  <div>⚠️ Castigo: <b>{acuerdos.castigo}</b></div>
                )}
              </div>
            )}

            {/* === Mensajes === */}
            {(msg || err) && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                {msg && <div style={{ color: "#22c55e" }}>{msg}</div>}
                {err && <div style={{ color: "#f87171" }}>{err}</div>}
              </div>
            )}

            <hr className="sep" />

            {/* === Reportar violación === */}
            <div>
              <h3 style={{ marginTop: 0 }}>Registrar violación</h3>
              <div
                className="row"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "end",
                  gap: 8,
                }}
              >
                <div style={{ flex: "1 1 260px" }}>
                  <label className="label">Detalle</label>
                  <input
                    className="input"
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    placeholder="Ej: abrí TikTok"
                  />
                </div>

                <div>
                  <label className="label">Imagen (opcional)</label>
                  <label
                    htmlFor="upload-image"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 11px",
                      background: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: 8,
                      color: "#93a1b1",
                      cursor: "pointer",
                    }}
                  >
                    📎 {imagen ? "Cambiar" : "Seleccionar"}
                  </label>

                  <input
                    id="upload-image"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) setImagen(file);
                    }}
                  />

                  {imagen && (
                    <div style={{ marginTop: 6, textAlign: "center" }}>
                      <img
                        src={URL.createObjectURL(imagen)}
                        alt="Preview"
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: "cover",
                          borderRadius: 6,
                          border: "1px solid #374151",
                        }}
                      />
                      <button
                        onClick={() => setImagen(null)}
                        style={{
                          fontSize: 11,
                          background: "none",
                          border: "none",
                          color: "#f87171",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>

                <button className="btn" onClick={reportViolation}>
                  Reportar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* === COLUMNA LATERAL === */}
        <div
          className="card"
          style={{
            border: "1px solid #1f2937",
            background: "linear-gradient(180deg,#0b1117,#0a0f14)",
            height: "calc(100vh - 120px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <h3 style={{ margin: "0 0 8px 0", flexShrink: 0 }}>Actividad</h3>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <ViolationFeed socket={socket} />
          </div>
        </div>

      </div>

      {/* Estilos responsive */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @media (max-width: 900px) {
            .row {
              grid-template-columns: 1fr !important;
            }
            .card {
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
}
