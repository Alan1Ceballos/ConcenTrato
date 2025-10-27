import React, { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";
import { useSocketCtx } from "../context/SocketContext.jsx";

export default function Leaderboard() {
  const groupId = typeof window !== "undefined" ? localStorage.getItem("groupId") : null;
  const me = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); } catch { return {}; }
  }, []);
  const myId = me?._id || me?.id || null;

  const { socket } = useSocketCtx();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async (gid) => {
    if (!gid) { setRows([]); setLoading(false); return; }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // 🔔 Realtime
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

  const maxPts = rows.length ? Math.max(...rows.map(r => r.puntos || 0)) : 0;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const medal = (rank) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : " ";
  const colorFor = (rank) => (
    rank === 1 ? "#f59e0b" : rank === 2 ? "#94a3b8" : rank === 3 ? "#8b5cf6" : "#1f2937"
  );
  const bgFor = (rank) => (
    rank === 1 ? "linear-gradient(180deg,#1a1507,#0b1117)" :
    rank === 2 ? "linear-gradient(180deg,#151922,#0b1117)" :
                 "linear-gradient(180deg,#171326,#0b1117)"
  );

  const isMe = (r) => (myId && (r?.usuario?._id === myId));

  return (
    <div className="container">
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          padding: "18px 16px",
          borderBottom: "1px solid #1f2937",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <h2 style={{ margin: 0 }}>Ranking del grupo</h2>
          {!!rows.length && (
            <div style={{ fontSize: 12, color: "#93a1b1" }}>
              Total participantes: <b>{rows.length}</b>
            </div>
          )}
        </div>

        {/* Loader */}
        {loading && (
          <div style={{ padding: 24 }}>
            <SkeletonLine width={220} />
            <div style={{ height: 12 }} />
            <SkeletonLine width={"100%"} />
            <div style={{ height: 10 }} />
            <SkeletonLine width={"92%"} />
            <div style={{ height: 10 }} />
            <SkeletonLine width={"88%"} />
          </div>
        )}

        {/* Empty state */}
        {!loading && rows.length === 0 && (
          <div style={{ padding: 24, textAlign: "center", color: "#93a1b1" }}>
            {msg || "Todavía no hay puntos registrados. Inicien un Pacto para sumar 💪"}
          </div>
        )}

        {/* Content */}
        {!loading && rows.length > 0 && (
          <div style={{ padding: 16 }}>
            {/* Podio */}
            <div
              className="row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginBottom: 10
              }}
            >
              {podium.map((r) => (
                <div
                  key={r.usuario._id}
                  className="card"
                  style={{
                    background: bgFor(r.rank),
                    borderColor: "#1f2937",
                    padding: 14
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 12, display: "grid", placeItems: "center",
                        fontSize: 20, background: "#0b1117", border: `1px solid ${colorFor(r.rank)}`
                      }}>
                        {medal(r.rank)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800 }}>
                          {r.usuario?.nombre || "—"}
                          {isMe(r) && <span style={{ marginLeft: 6, fontSize: 11, color: "#60a5fa" }}>— tú</span>}
                        </div>
                        <div style={{ fontSize: 12, color: "#93a1b1" }}>#{r.rank}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 900 }}>{r.puntos ?? 0}</div>
                      <div style={{ fontSize: 11, color: "#93a1b1" }}>puntos</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lista con barras */}
            <div className="card" style={{ background: "#0b1117", borderColor: "#1f2937", padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 110px", gap: 0, padding: "10px 12px", borderBottom: "1px solid #1f2937", color: "#93a1b1", fontSize: 12 }}>
                <div>#</div>
                <div>Participante</div>
                <div style={{ textAlign: "right" }}>Puntos</div>
              </div>

              <div>
                {rest.map((r) => {
                  const pct = maxPts > 0 ? Math.max(0.03, Math.min(1, (r.puntos || 0) / maxPts)) : 0;
                  return (
                    <div
                      key={r.usuario._id}
                      style={{
                        position: "relative",
                        padding: "10px 12px",
                        display: "grid",
                        gridTemplateColumns: "64px 1fr 110px",
                        alignItems: "center",
                        borderBottom: "1px solid #0f1720",
                        background: isMe(r) ? "linear-gradient(90deg, rgba(96,165,250,0.08), transparent 60%)" : "transparent"
                      }}
                    >
                      {/* Barra */}
                      <div
                        aria-hidden
                        style={{
                          position: "absolute",
                          inset: "0 0 0 0",
                          transform: "translateZ(0)",
                          pointerEvents: "none"
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: 0, top: 0, bottom: 0,
                            width: `${pct * 100}%`,
                            background: "linear-gradient(90deg, rgba(34,197,94,0.14), rgba(34,197,94,0.06))"
                          }}
                        />
                      </div>

                      <div style={{ fontWeight: 800, zIndex: 1 }}>#{r.rank}</div>
                      <div style={{ zIndex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8, display: "grid", placeItems: "center",
                          fontSize: 12, fontWeight: 900, background: "#0f141a", border: "1px solid #1f2937", color: "#9ca3af"
                        }}>
                          {(r.usuario?.nombre || "—").slice(0, 1).toUpperCase()}
                        </div>
                        <div style={{ fontWeight: 700 }}>
                          {r.usuario?.nombre || "—"}
                          {isMe(r) && <span style={{ marginLeft: 6, fontSize: 11, color: "#60a5fa" }}>— tú</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 800, zIndex: 1 }}>{r.puntos ?? 0}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
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
        animation: "lb-sheen 1.2s linear infinite"
      }}
    />
  );
}

// Keyframes inline (inserción única)
const styleTagId = "lb-keyframes-style";
if (typeof document !== "undefined" && !document.getElementById(styleTagId)) {
  const tag = document.createElement("style");
  tag.id = styleTagId;
  tag.textContent = `
    @keyframes lb-sheen {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(tag);
}
