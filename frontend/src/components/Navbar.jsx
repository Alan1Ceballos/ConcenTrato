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

  const [groups, setGroups] = useState([]);
  const [currentName, setCurrentName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // === Detectar tamaño de pantalla ===
  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth <= 768);
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // === Cargar grupos del usuario ===
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

  // === Cargar nombre del grupo actual ===
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

  // === Cambiar grupo activo ===
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

  const isActive = (path) => (loc.pathname === path ? "active" : "");
  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      {/* === Fondo translúcido cuando el menú está abierto === */}
      {isMobile && menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(2px)",
            zIndex: 40,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "saturate(120%) blur(6px)",
          background: "rgba(11,17,23,0.9)",
          borderBottom: "1px solid #1f2937",
          transition: "background 0.3s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            flexWrap: "wrap",
          }}
        >
          {/* === IZQUIERDA: LOGO + ESTADO === */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/icon.png"
              alt="Logo"
              style={{
                width: 32,
                height: 32,
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
            <span
              style={{
                fontWeight: 900,
                fontSize: "1.1rem",
                letterSpacing: 0.2,
                color: "#e5e7eb",
                whiteSpace: "nowrap",
              }}
            >
              ConcenTrato
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                padding: "4px 8px",
                borderRadius: 999,
                border: "1px solid #1f2937",
                background: "#0f141a",
                marginLeft: 8,
              }}
              title={connected ? "Conectado" : "Desconectado"}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: connected ? "#22c55e" : "#ef4444",
                  boxShadow: connected ? "0 0 0 2px rgba(34,197,94,0.2)" : "none",
                }}
              />
              {!isMobile && (
                <span style={{ color: "#93a1b1" }}>
                  {connected ? "Online" : "Offline"}
                </span>
              )}
            </span>
          </div>

          {/* === BOTÓN HAMBURGUESA === */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: "none",
                border: "none",
                color: "#e5e7eb",
                fontSize: 26,
                cursor: "pointer",
                transition: "transform 0.25s ease",
                transform: menuOpen ? "rotate(90deg)" : "none",
                zIndex: 60,
              }}
            >
              {menuOpen ? "✕" : "☰"}
            </button>
          )}

          {/* === MENÚ PRINCIPAL === */}
          <div
            style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              gap: isMobile ? 10 : 16,
              width: isMobile ? "100%" : "auto",
              background: isMobile ? "rgba(15,20,26,0.95)" : "transparent",
              position: isMobile ? "fixed" : "static",
              top: isMobile ? 60 : "auto",
              left: 0,
              padding: isMobile ? "20px" : 0,
              borderTop: isMobile ? "1px solid #1f2937" : "none",
              transition: "max-height 0.35s ease, opacity 0.35s ease, transform 0.3s ease",
              transform: isMobile
                ? menuOpen
                  ? "translateY(0)"
                  : "translateY(-10px)"
                : "none",
              maxHeight: isMobile ? (menuOpen ? "420px" : "0px") : "none",
              opacity: isMobile ? (menuOpen ? 1 : 0) : 1,
              overflow: "hidden",
              boxShadow: isMobile && menuOpen ? "0 8px 24px rgba(0,0,0,0.5)" : "none",
              borderRadius: isMobile ? "0 0 10px 10px" : "0",
              zIndex: 55,
            }}
          >
            {/* === SELECTOR DE GRUPO === */}
            {token && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label
                  htmlFor="groupSelect"
                  style={{
                    fontSize: 12,
                    color: "#93a1b1",
                    whiteSpace: "nowrap",
                  }}
                >
                  Grupo
                </label>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 10px",
                    borderRadius: 10,
                    border: "1px solid #1f2937",
                    background: "#0b1117",
                    minWidth: 180,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      display: "inline-grid",
                      placeItems: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#0b1117",
                      background: "#60a5fa",
                    }}
                  >
                    {currentName ? currentName.slice(0, 1).toUpperCase() : "—"}
                  </span>
                  <select
                    id="groupSelect"
                    value={currentGroupId || ""}
                    onChange={onChangeGroup}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#e5e7eb",
                      fontWeight: 600,
                      paddingRight: 8,
                      cursor: "pointer",
                    }}
                  >
                    {currentGroupId &&
                      !groups.find((g) => g._id === currentGroupId) && (
                        <option value={currentGroupId}>
                          {currentName || `…${String(currentGroupId).slice(-5)}`}
                        </option>
                      )}
                    {(groups.length > 0
                      ? groups
                      : [{ _id: "", nombre: "Sin grupo" }]
                    ).map((g) => (
                      <option key={g._id || "none"} value={g._id || ""}>
                        {g.nombre || "Sin grupo"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* === LINKS === */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "flex-start" : "center",
                gap: isMobile ? 8 : 12,
                width: "100%",
              }}
            >
              {token ? (
                <>
                  <Link to="/dashboard" onClick={handleNavClick}>Dashboard</Link>
                  <Link to="/group" onClick={handleNavClick}>Grupo</Link>
                  <Link to="/focus" onClick={handleNavClick}>Pacto</Link>
                  <Link to="/leaderboard" onClick={handleNavClick}>Ranking</Link>
                  <button
                    onClick={() => { logout(); handleNavClick(); }}
                    style={{
                      background: "none",
                      border: "1px solid #374151",
                      color: "#e5e7eb",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      width: isMobile ? "100%" : "auto",
                    }}
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={handleNavClick}>Ingresar</Link>
                  <Link to="/register" onClick={handleNavClick}>Crear cuenta</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
