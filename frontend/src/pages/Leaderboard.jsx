import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { useSocketCtx } from "../context/SocketContext.jsx";

export default function Leaderboard() {
  const groupId = typeof window !== "undefined" ? localStorage.getItem("groupId") : null;
  const me = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const myId = me?._id || me?.id || null;
  const { socket } = useSocketCtx();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async (gid) => {
    if (!gid) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMsg("");
    try {
      const { data } = await api.get(`/api/grupos/${gid}/leaderboard`);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "No se pudo cargar el ranking");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(groupId);
  }, [groupId]);

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const handler = (payload) => {
      const gid = payload?.groupId || payload?.grupoId;
      if (!gid || gid !== groupId) return;
      load(groupId);
    };
    socket.on("leaderboard:update", handler);
    return () => socket.off("leaderboard:update", handler);
  }, [socket, groupId]);

  const maxPts = rows.length ? Math.max(...rows.map((r) => r.puntos || 0)) : 0;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const medal = (rank) =>
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : " ";
  const colorFor = (rank) =>
    rank === 1
      ? "#fbbf24"
      : rank === 2
      ? "#9ca3af"
      : rank === 3
      ? "#a78bfa"
      : "#1f2937";
  const bgFor = (rank) =>
    rank === 1
      ? "linear-gradient(180deg,#1a1507,#0b1117)"
      : rank === 2
      ? "linear-gradient(180deg,#151922,#0b1117)"
      : "linear-gradient(180deg,#171326,#0b1117)";

  const isMe = (r) => myId && (r?.usuario?._id === myId);

  return (
    <div
      className="container"
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        animation: "fadeIn 0.4s ease",
      }}
    >
      {/* Header */}
      <div
        className="card"
        style={{
          padding: "16px 18px",
          borderRadius: 12,
          border: "1px solid #1f2937",
          background: "linear-gradient(180deg, #0b1117 0%, #0a0f14 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ margin: 0, color: "#f3f4f6" }}>Ranking del grupo</h2>
        {!!rows.length && (
          <div style={{ fontSize: 13, color: "#9ca3af" }}>
            Total participantes: <b>{rows.length}</b>
          </div>
        )}
      </div>

      {/* Loader */}
      {loading && (
        <div
          style={{
            background: "#0b1117",
            border: "1px solid #1f2937",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 18px rgba(0,0,0,0.25)",
          }}
        >
          <SkeletonLine width={220} />
          <div style={{ height: 10 }} />
          <SkeletonLine width={"95%"} />
          <div style={{ height: 10 }} />
          <SkeletonLine width={"90%"} />
        </div>
      )}

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            color: "#93a1b1",
            padding: 24,
            background: "#0b1117",
            border: "1px solid #1f2937",
            borderRadius: 12,
          }}
        >
          {msg || "Todavía no hay puntos registrados. Inicien un Pacto para sumar 💪"}
        </div>
      )}

      {/* Content */}
      {!loading && rows.length > 0 && (
        <div
          className="card"
          style={{
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "#0f141a",
            padding: 16,
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.4s ease",
          }}
        >
          {/* Podio */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            {podium.map((r) => (
              <div
                key={r.usuario._id}
                className="card"
                style={{
                  background: bgFor(r.rank),
                  border: `1px solid ${colorFor(r.rank)}`,
                  borderRadius: 12,
                  padding: 14,
                  boxShadow: `0 0 10px ${colorFor(r.rank)}33`,
                  transition: "transform 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 20,
                        background: "#0f141a",
                        border: `1px solid ${colorFor(r.rank)}`,
                      }}
                    >
                      {medal(r.rank)}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: isMe(r) ? "#60a5fa" : "#f3f4f6",
                        }}
                      >
                        {r.usuario?.nombre || "—"}
                        {isMe(r) && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              color: "#60a5fa",
                            }}
                          >
                            (tú)
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>#{r.rank}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: colorFor(r.rank),
                      }}
                    >
                      {r.puntos ?? 0}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>puntos</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lista */}
          <div
            style={{
              background: "#0b1117",
              borderRadius: 10,
              border: "1px solid #1f2937",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "64px 1fr 80px",
                padding: "10px 14px",
                borderBottom: "1px solid #1f2937",
                color: "#9ca3af",
                fontSize: 12,
                background: "#0f141a",
              }}
            >
              <div>#</div>
              <div>Participante</div>
              <div style={{ textAlign: "right" }}>Puntos</div>
            </div>
            {rest.map((r) => {
              const pct =
                maxPts > 0
                  ? Math.max(0.03, Math.min(1, (r.puntos || 0) / maxPts))
                  : 0;
              return (
                <div
                  key={r.usuario._id}
                  style={{
                    position: "relative",
                    padding: "10px 14px",
                    display: "grid",
                    gridTemplateColumns: "64px 1fr 80px",
                    alignItems: "center",
                    borderBottom: "1px solid #1f2937",
                    background: isMe(r)
                      ? "linear-gradient(90deg, rgba(96,165,250,0.08), transparent 60%)"
                      : "transparent",
                    transition: "background 0.3s ease",
                  }}
                >
                  {/* barra verde */}
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${pct * 100}%`,
                      background:
                        "linear-gradient(90deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))",
                      zIndex: 0,
                      transition: "width 0.4s ease",
                    }}
                  />
                  <div style={{ fontWeight: 700, zIndex: 1, color: "#e5e7eb" }}>
                    #{r.rank}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 12,
                        fontWeight: 900,
                        background: "#0f141a",
                        border: "1px solid #1f2937",
                        color: "#9ca3af",
                      }}
                    >
                      {(r.usuario?.nombre || "—").slice(0, 1).toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: isMe(r) ? "#60a5fa" : "#f3f4f6",
                      }}
                    >
                      {r.usuario?.nombre || "—"}
                      {isMe(r) && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: "#60a5fa",
                          }}
                        >
                          (tú)
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontWeight: 700,
                      color: "#22c55e",
                      zIndex: 1,
                    }}
                  >
                    {r.puntos ?? 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes lb-sheen {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </div>
  );
}

/* ——— UI helpers ——— */
function SkeletonLine({ width = "100%" }) {
  return (
    <div
      style={{
        width,
        height: 14,
        borderRadius: 8,
        background:
          "linear-gradient(90deg, rgba(148,163,184,0.14), rgba(148,163,184,0.24), rgba(148,163,184,0.14))",
        backgroundSize: "200% 100%",
        animation: "lb-sheen 1.2s linear infinite",
      }}
    />
  );
}
