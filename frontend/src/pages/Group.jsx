import React, { useEffect, useState } from "react";
import api from "../api/client.js";
import { useSocketCtx } from "../context/SocketContext.jsx";

export default function Group() {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [groupInfo, setGroupInfo] = useState(null);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [copying, setCopying] = useState(false);

  const groupId = typeof window !== "undefined" ? localStorage.getItem("groupId") : null;
  const { socket } = useSocketCtx();

  const notifyGroupChange = () => window.dispatchEvent(new Event("groupId-changed"));
  const setActivo = async (gid) => {
    try { await api.post("/api/grupos/activo", { groupId: gid }); } catch {}
  };

  const crear = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setLoadingCreate(true);
    try {
      const { data } = await api.post("/api/grupos", { nombre: nombre.trim() });
      const gid = data.grupo._id;
      localStorage.setItem("groupId", gid);
      await setActivo(gid);
      notifyGroupChange();
      setMsg("✅ Grupo creado y asignado como actual.");
      setNombre("");
      await fetchInfo(gid);
    } catch (error) {
      setErr(error?.response?.data?.message || "Error al crear el grupo.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const unirse = async (e) => {
    e.preventDefault();
    setMsg(""); setErr(""); setLoadingJoin(true);
    try {
      const { data } = await api.post("/api/grupos/unirse", { codigo: codigo.trim() });
      const gid = data.grupo._id;
      localStorage.setItem("groupId", gid);
      await setActivo(gid);
      notifyGroupChange();
      setMsg("🙌 Te uniste al grupo y quedó asignado como actual.");
      setCodigo("");
      await fetchInfo(gid);
    } catch (error) {
      setErr(error?.response?.data?.message || "Error al unirse al grupo.");
    } finally {
      setLoadingJoin(false);
    }
  };

  const fetchInfo = async (gid) => {
    setLoadingInfo(true);
    try {
      const { data } = await api.get(`/api/grupos/${gid}`);
      setGroupInfo(data);
    } catch {
      setGroupInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  // Realtime updates
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (data) => {
      if (data?.grupo?._id === groupId) setGroupInfo(data);
    };
    socket.on("group:update", onUpdate);
    return () => socket.off("group:update", onUpdate);
  }, [socket, groupId]);

  useEffect(() => {
    if (groupId) fetchInfo(groupId);
  }, [groupId]);

  const copy = async (text) => {
    setMsg(""); setErr("");
    try {
      setCopying(true);
      await navigator.clipboard.writeText(text);
      setMsg("📋 Código copiado al portapapeles.");
    } catch {
      setErr("No se pudo copiar el código.");
    } finally {
      setCopying(false);
    }
  };

  const miembros = groupInfo?.miembros || [];
  const codigoInv = groupInfo?.grupo?.codigoInvitacion || "—";

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
          padding: 16,
          borderRadius: 12,
          border: "1px solid #1f2937",
          background: "linear-gradient(180deg, #0b1117 0%, #0a0f14 100%)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#f3f4f6" }}>Gestión de grupo</h2>
        {groupId && (
          <button
            className="btn-outline"
            onClick={() => fetchInfo(groupId)}
            disabled={loadingInfo}
            title="Actualizar grupo"
            style={{
              fontSize: 13,
              minWidth: 110,
              transition: "all 0.2s ease",
            }}
          >
            {loadingInfo ? "Actualizando…" : "Actualizar"}
          </button>
        )}
      </div>

      {/* Crear / Unirse */}
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        }}
      >
        {/* Crear */}
        <Card title="Crear grupo" subtitle="Creá un grupo nuevo y compartí el código.">
          <form onSubmit={crear} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="label">Nombre del grupo</label>
            <input
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Team Focus"
              required
            />
            <button className="btn" type="submit" disabled={loadingCreate}>
              {loadingCreate ? "Creando…" : "Crear grupo"}
            </button>
          </form>
        </Card>

        {/* Unirse */}
        <Card title="Unirse a grupo" subtitle="Ingresá el código de invitación.">
          <form onSubmit={unirse} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label className="label">Código</label>
            <input
              className="input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: 7KJ9QF"
              required
            />
            <button className="btn" type="submit" disabled={loadingJoin}>
              {loadingJoin ? "Uniéndote…" : "Unirme"}
            </button>
          </form>
        </Card>
      </div>

      {/* Mensajes */}
      {(msg || err) && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            background: msg
              ? "rgba(34,197,94,0.1)"
              : "rgba(239,68,68,0.1)",
            color: msg ? "#22c55e" : "#f87171",
            fontSize: 14,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {msg || err}
        </div>
      )}

      {/* Grupo actual */}
      {groupInfo ? (
        <div
          className="card"
          style={{
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "#0b1117",
            boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            overflow: "hidden",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  background: "#111827",
                  border: "1px solid #1f2937",
                  color: "#9ca3af",
                }}
              >
                {String(groupInfo.grupo?.nombre || "G").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#f3f4f6" }}>
                  {groupInfo.grupo?.nombre || "Grupo"}
                </div>
                <div style={{ color: "#93a1b1", fontSize: 13 }}>
                  {miembros.length} integrante{miembros.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: "1px solid #1f2937",
                  background: "#0f141a",
                  color: "#93a1b1",
                }}
              >
                Código: <b style={{ marginLeft: 6 }}>{codigoInv}</b>
              </span>
              {groupInfo.grupo?.codigoInvitacion && (
                <button
                  className="btn-outline"
                  onClick={() => copy(groupInfo.grupo.codigoInvitacion)}
                  disabled={copying}
                >
                  {copying ? "Copiando…" : "Copiar"}
                </button>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "#1f2937" }} />

          <div style={{ padding: 16 }}>
            <div style={{ color: "#93a1b1", fontSize: 13, marginBottom: 8 }}>
              Integrantes
            </div>
            {miembros.length ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                {miembros.map((m) => (
                  <div
                    key={m._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: 10,
                      background: "#0f141a",
                      border: "1px solid #1f2937",
                      borderRadius: 10,
                      transition: "transform 0.2s ease",
                    }}
                  >
                    <Avatar name={m.usuario?.nombre} />
                    <div>
                      <div style={{ fontWeight: 700, color: "#e5e7eb" }}>
                        {m.usuario?.nombre || "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#93a1b1" }}>{m.rol}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "#93a1b1" }}>Aún no hay integrantes.</div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: 20,
            background: "#0b1117",
            color: "#93a1b1",
            border: "1px solid #1f2937",
            borderRadius: 12,
          }}
        >
          No hay grupo seleccionado aún.
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

/* ---- Subcomponentes ---- */
function Card({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: "#0b1117",
        border: "1px solid #1f2937",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
        animation: "fadeIn 0.4s ease",
      }}
    >
      <h3 style={{ marginTop: 0, color: "#f3f4f6" }}>{title}</h3>
      {subtitle && <p style={{ color: "#93a1b1", marginTop: 4 }}>{subtitle}</p>}
      {children}
    </div>
  );
}

function Avatar({ name = "?" }) {
  const letter = String(name).slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        display: "grid",
        placeItems: "center",
        fontSize: 13,
        fontWeight: 900,
        background: "#0b1117",
        border: "1px solid #1f2937",
        color: "#9ca3af",
      }}
      title={name}
    >
      {letter}
    </div>
  );
}
