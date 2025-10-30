import React, { useEffect, useState, useContext, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/client.js";
import { AuthContext } from "../context/AuthContext.jsx";
import { useSocketCtx } from "../context/SocketContext.jsx";

export default function Navbar() {
  const loc = useLocation();
  const { logout } = useContext(AuthContext);
  const { connected } = useSocketCtx();

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const currentGroupId = typeof window !== "undefined" ? localStorage.getItem("groupId") : null;

  const [groups, setGroups] = useState([]); // [{_id, nombre}]
  const [currentName, setCurrentName] = useState("");

  // Cargar lista de grupos del usuario
  useEffect(() => {
    let mounted = true;
    const fetchMine = async () => {
      if (!token) return;
      try {
        const { data } = await api.get("/api/grupos/mis");
        if (!mounted) return;
        const list = (data || [])
          .map(m => ({ _id: m?.grupo?._id, nombre: m?.grupo?.nombre }))
          .filter(g => g._id);
        setGroups(list);
      } catch {
        setGroups([]);
      }
    };
    fetchMine();
    return () => { mounted = false; };
  }, [token]);

  // Cargar sólo el nombre del grupo actual
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!currentGroupId) { setCurrentName(""); return; }
      try {
        const { data } = await api.get(`/api/grupos/${currentGroupId}`);
        if (active) setCurrentName(data?.grupo?.nombre || "");
      } catch {
        if (active) setCurrentName("");
      }
    };
    load();
    return () => { active = false; };
  }, [currentGroupId]);

  // Cambiar grupo activo (selector)
  const onChangeGroup = useCallback(async (e) => {
    const gid = e.target.value;
    if (!gid) return;
    try { await api.post("/api/grupos/activo", { groupId: gid }); } catch {}
    localStorage.setItem("groupId", gid);
    window.dispatchEvent(new Event("groupId-changed"));
    try {
      const { data } = await api.get(`/api/grupos/${gid}`);
      setCurrentName(data?.grupo?.nombre || "");
    } catch {
      setCurrentName("");
    }
  }, []);

  const isActive = (path) => loc.pathname === path ? "active" : "";

  return (
    <nav className="navbar" style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "saturate(120%) blur(6px)" }}>
      <div className="navbar-inner" style={{ display: "flex", alignItems: "center", gap: 16, padding: "10px 16px" }}>
        {/* Brand + estado */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="brand" style={{ display: "flex", alignItems: "center", fontWeight: 900, letterSpacing: 0.2 }}>
            <span style={{ fontSize: 18, marginRight: 6 }}>🌵</span> ConcenTrato
          </span>
          <span
            className="badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #1f2937",
              background: "#0f141a"
            }}
            title={connected ? "Conectado" : "Desconectado"}
          >
            <span
              style={{
                width: 8, height: 8, borderRadius: 999,
                background: connected ? "#22c55e" : "#ef4444", boxShadow: connected ? "0 0 0 2px rgba(34,197,94,0.2)" : "none"
              }}
            />
            {connected ? "Online" : "Offline"}
          </span>
        </div>

        {/* Selector de grupo */}
        {token && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 8 }}>
            <label htmlFor="groupSelect" className="badge" style={{ border: "none", background: "transparent", padding: 0, fontSize: 12, color: "#93a1b1" }}>
              Grupo
            </label>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px",
                borderRadius: 10, border: "1px solid #1f2937", background: "#0b1117", minWidth: 220
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 22, height: 22, borderRadius: 6,
                  display: "inline-grid", placeItems: "center",
                  fontSize: 12, fontWeight: 800, color: "#0b1117",
                  background: "#60a5fa"
                }}
              >
                {currentName ? currentName.slice(0, 1).toUpperCase() : "—"}
              </span>
              <select
                id="groupSelect"
                className="select"
                value={currentGroupId || ""}
                onChange={onChangeGroup}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: "#e5e7eb", fontWeight: 600, paddingRight: 8, cursor: "pointer"
                }}
              >
                {currentGroupId && !groups.find(g => g._id === currentGroupId) && (
                  <option value={currentGroupId}>{currentName || `…${String(currentGroupId).slice(-5)}`}</option>
                )}
                {(groups.length > 0 ? groups : [{ _id: "", nombre: "Sin grupo" }]).map(g => (
                  <option key={g._id || "none"} value={g._id || ""}>
                    {g.nombre || "Sin grupo"}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Links */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {token ? (
            <>
              <Link to="/dashboard" className={isActive("/dashboard")}>Dashboard</Link>
              <Link to="/group" className={isActive("/group")}>Grupo</Link>
              {}
              <Link to="/focus" className={isActive("/focus")}>Pacto</Link>
              <Link to="/leaderboard" className={isActive("/leaderboard")}>Ranking</Link>
              <button className="btn-outline" style={{ marginLeft: 8 }} onClick={logout}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <Link to="/login">Ingresar</Link>
              <Link to="/register" style={{ marginLeft: 8 }}>Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
      {/* línea divisoria */}
      <div style={{ height: 1, background: "linear-gradient(90deg,#0b1117, #1f2937 20%, #1f2937 80%, #0b1117)" }} />
    </nav>
  );
}
