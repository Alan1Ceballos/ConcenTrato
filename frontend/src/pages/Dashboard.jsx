import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import { useSocketCtx } from "../context/SocketContext.jsx";

export default function Dashboard() {
    useEffect(() => {
    // Evitar recarga si no hay token o se está cerrando sesión
    const token = localStorage.getItem("token");
    if (!token) return;

    // Evitar bucles de reload
    const hasRefreshed = sessionStorage.getItem("dashboardRefreshed");
    const isLoggingOut = sessionStorage.getItem("loggingOut");

    if (!hasRefreshed && !isLoggingOut) {
      sessionStorage.setItem("dashboardRefreshed", "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem("dashboardRefreshed");
    }
  }, []);

  const groupId =
    typeof window !== "undefined" ? localStorage.getItem("groupId") : null;
  const groupShort = useMemo(() => (groupId ? groupId.slice(-5) : "—"), [groupId]);
  const { socket } = useSocketCtx();

  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pactoActivo, setPactoActivo] = useState(false);
  const [error, setError] = useState("");

  const load = async (gid) => {
    if (!gid) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/api/grupos/${gid}`);
      setInfo(data);
      setPactoActivo(
        Boolean(data?.pactoActiva || data?.focus?.estado === "activa" || data?.pacto)
      );
    } catch (e) {
      setError(
        e?.response?.data?.message || "No se pudo cargar la información del grupo."
      );
      setInfo(null);
      setPactoActivo(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) load(groupId);
  }, [groupId]);

  // Realtime update
  useEffect(() => {
    if (!socket || !groupId) return;
    const onState = (s) => {
      if (!s) return;
      if (s.estado === "activa") setPactoActivo(true);
      if (s.estado === "finalizada") setPactoActivo(false);
    };
    socket.on("focus:state", onState);
    return () => socket.off("focus:state", onState);
  }, [socket, groupId]);

  const nombreGrupo = info?.grupo?.nombre || "—";

  return (
    <div
      className="container"
      style={{
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* === ENCABEZADO === */}
      <div
        className="card"
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          border: "1px solid #1f2937",
          background:
            "linear-gradient(180deg, #0b1117 0%, #0b1117 60%, #0a0f14 100%)",
          borderRadius: 12,
          boxShadow: "0 3px 16px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Izquierda */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                background: "#111827",
                border: "1px solid #1f2937",
                color: "#9ca3af",
                fontSize: 18,
              }}
            >
              {String(nombreGrupo).slice(0, 1).toUpperCase()}
            </div>
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.4rem",
                  color: "#f3f4f6",
                }}
              >
                {nombreGrupo}
              </h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Chip
                  label={`Pacto ${pactoActivo ? "activo" : "inactivo"}`}
                  tone={pactoActivo ? "success" : "neutral"}
                />
                {info?.miembros?.length >= 0 && (
                  <Chip
                    label={`${info.miembros.length} integrante${
                      info.miembros.length === 1 ? "" : "s"
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Derecha */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Link className="btn" to="/focus">
              Iniciar Pacto
            </Link>
            <Link className="btn-outline" to="/group">
              Elegir/Crear grupo
            </Link>
            <Link className="btn-outline" to="/leaderboard">
              Ver ranking
            </Link>
          </div>
        </div>
      </div>

      {/* === CUERPO PRINCIPAL === */}
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        {/* === INFO GRUPO === */}
        <div
          className="card"
          style={{
            padding: 16,
            background: "#0f141a",
            border: "1px solid #1f2937",
            borderRadius: 12,
            boxShadow: "0 3px 14px rgba(0,0,0,0.2)",
          }}
        >
          {loading ? (
            <>
              <SkeletonLine width={260} />
              <div style={{ height: 10 }} />
              <SkeletonBlock />
            </>
          ) : info ? (
            <>
              <div style={{ display: "grid", gap: 12 }}>
                {/* PACTO */}
                <div
                  className="card"
                  style={{
                    background: "#0b1117",
                    borderColor: "#1f2937",
                    padding: 12,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#93a1b1" }}>Pacto</div>
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: pactoActivo ? "#22c55e" : "#6b7280",
                        boxShadow: pactoActivo
                          ? "0 0 0 2px rgba(34,197,94,0.15)"
                          : "none",
                      }}
                    />
                    <div style={{ fontSize: 16, fontWeight: 800 }}>
                      {pactoActivo ? "Activo" : "Inactivo"}
                    </div>
                  </div>
                  {info?.pacto && (
                    <div
                      style={{
                        marginTop: 10,
                        color: "#93a1b1",
                        fontSize: 14,
                        lineHeight: 1.6,
                      }}
                    >
                      Límite diario redes:{" "}
                      <b>{info.pacto.limiteMinutosRedesDia} min</b>
                      <br />
                      Duración: <b>{info.pacto.duracionDias} días</b>
                    </div>
                  )}
                </div>

                {/* INTEGRANTES */}
                <div
                  className="card"
                  style={{
                    background: "#0b1117",
                    borderColor: "#1f2937",
                    padding: 12,
                    borderRadius: 10,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#93a1b1" }}>Integrantes</div>
                  {info?.miembros?.length ? (
                    <div
                      style={{
                        marginTop: 10,
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {info.miembros.map((m) => (
                        <div
                          key={m._id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "4px 0",
                          }}
                        >
                          <Avatar name={m.usuario?.nombre} />
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {m.usuario?.nombre || "—"}
                            </div>
                            <div
                              style={{ fontSize: 12, color: "#93a1b1" }}
                            >
                              {m.rol}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, color: "#93a1b1" }}>
                      Sin integrantes aún.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "#93a1b1" }}>
              Configurá tu grupo para ver detalles.
            </div>
          )}
          {error && (
            <div style={{ marginTop: 12, color: "#60a5fa", fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* === TIPS === */}
        <div
          className="card"
          style={{
            padding: 16,
            background: "#0f141a",
            border: "1px solid #1f2937",
            borderRadius: 12,
            boxShadow: "0 3px 14px rgba(0,0,0,0.2)",
          }}
        >
          <h3 style={{ marginTop: 0, color: "#f3f4f6" }}>Tips de enfoque</h3>
          <ul style={{ color: "#93a1b1", lineHeight: 1.6 }}>
            <li>Silenciá notificaciones durante el Pacto.</li>
            <li>Definí objetivos concretos por bloque.</li>
            <li>Micro-descansos de 5 minutos cada 50.</li>
          </ul>
          <div
            style={{ marginTop: 14, fontSize: 12, color: "#9ca3af" }}
          >
            Consejo: acordá una <b>recompensa</b> y/o <b>castigo</b> antes de iniciar el
            Pacto para mejorar la adherencia.
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes db-sheen {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
}

/* --- COMPONENTES AUXILIARES --- */
function Chip({ label, tone = "neutral" }) {
  const colors = {
    success: { bg: "rgba(34,197,94,0.12)", bd: "rgba(34,197,94,0.25)", fg: "#22c55e" },
    neutral: { bg: "rgba(148,163,184,0.12)", bd: "rgba(148,163,184,0.25)", fg: "#93a1b1" },
  }[tone];
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 999,
        background: colors.bg,
        border: `1px solid ${colors.bd}`,
        color: colors.fg,
      }}
    >
      {label}
    </span>
  );
}

function Avatar({ name = "?" }) {
  const letter = String(name).slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        display: "grid",
        placeItems: "center",
        fontSize: 12,
        fontWeight: 900,
        background: "#0b1117",
        border: "1px solid #1f2937",
        color: "#9ca3af",
      }}
      aria-label={`Avatar de ${name}`}
      title={name}
    >
      {letter}
    </div>
  );
}

function SkeletonLine({ width = "100%", height = 14 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 8,
        background:
          "linear-gradient(90deg, rgba(148,163,184,0.14), rgba(148,163,184,0.24), rgba(148,163,184,0.14))",
        backgroundSize: "200% 100%",
        animation: "db-sheen 1.2s linear infinite",
      }}
    />
  );
}

function SkeletonBlock() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <SkeletonLine width={"100%"} />
      <SkeletonLine width={"96%"} />
      <SkeletonLine width={"92%"} />
      <SkeletonLine width={"88%"} />
    </div>
  );
}
