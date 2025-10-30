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

  const notifyGroupChange = () => {
    window.dispatchEvent(new Event("groupId-changed"));
  };

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
      setMsg("Grupo creado y asignado como actual.");
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
      setMsg("Te uniste al grupo y quedó asignado como actual.");
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

  // escucha cambios de grupo en tiempo real
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (data) => {
      if (data?.grupo?._id === groupId) {
        setGroupInfo(data);
      }
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
    <div className="container">
      <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "16px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0 }}>Gestión de grupo</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {groupId && (
              <button
                className="btn-outline"
                onClick={() => fetchInfo(groupId)}
                disabled={loadingInfo}
                title="Actualizar información del grupo"
              >
                {loadingInfo ? "Actualizando…" : "Actualizar"}
              </button>
            )}
          </div>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg,#0b1117, #1f2937 20%, #1f2937 80%, #0b1117)" }} />
      </div>

      <div className="row" style={{ gap: 16 }}>
        {/* Crear grupo */}
        <div className="card" style={{ flex: "1 1 420px" }}>
          <h3 style={{ marginTop: 0 }}>Crear grupo</h3>
          <p style={{ color: "#93a1b1", marginTop: 6 }}>
            Creá un grupo nuevo y compartí el código con tus amigos.
          </p>
          <form onSubmit={crear} className="row" style={{ flexDirection: "column", gap: 8 }}>
            <label className="label">Nombre del grupo</label>
            <input
              className="input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Family Friendly :)"
              required
            />
            <button className="btn" type="submit" disabled={loadingCreate} style={{ marginTop: 4 }}>
              {loadingCreate ? "Creando…" : "Crear"}
            </button>
          </form>
        </div>

        {/* Unirse a grupo */}
        <div className="card" style={{ flex: "1 1 420px" }}>
          <h3 style={{ marginTop: 0 }}>Unirse a grupo</h3>
          <p style={{ color: "#93a1b1", marginTop: 6 }}>
            Ingresá el código de invitación para unirte.
          </p>
          <form onSubmit={unirse} className="row" style={{ flexDirection: "column", gap: 8 }}>
            <label className="label">Código</label>
            <input
              className="input"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej: 7KJ9QF"
              required
            />
            <button className="btn" type="submit" disabled={loadingJoin} style={{ marginTop: 4 }}>
              {loadingJoin ? "Uniéndote…" : "Unirme"}
            </button>
          </form>
        </div>
      </div>

      {(msg || err) && (
        <div className="row" style={{ marginTop: 12 }}>
          {msg && <div style={{ color: "#22c55e" }}>{msg}</div>}
          {err && <div style={{ color: "#f87171" }}>{err}</div>}
        </div>
      )}

      <hr className="sep" />

      {groupInfo ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  display: "grid", placeItems: "center",
                  fontWeight: 900, background: "#111827", border: "1px solid #1f2937", color: "#9ca3af"
                }}
                aria-label="Inicial del grupo"
              >
                {String(groupInfo.grupo?.nombre || "G").slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{groupInfo.grupo?.nombre || "Grupo"}</div>
                <div style={{ color: "#93a1b1", fontSize: 12 }}>
                  {miembros.length} integrante{miembros.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                className="badge"
                style={{
                  fontSize: 12, padding: "6px 10px", borderRadius: 10,
                  border: "1px solid #1f2937", background: "#0b1117", color: "#93a1b1"
                }}
                title="Código de invitación"
              >
                Código: <b style={{ marginLeft: 6 }}>{codigoInv}</b>
              </span>
              {groupInfo.grupo?.codigoInvitacion && (
                <button
                  className="btn-outline"
                  onClick={() => copy(groupInfo.grupo.codigoInvitacion)}
                  disabled={copying}
                  title="Copiar código"
                >
                  {copying ? "Copiando…" : "Copiar"}
                </button>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg,#0b1117, #1f2937 20%, #1f2937 80%, #0b1117)" }} />

          <div style={{ padding: 16 }}>
            <div style={{ color: "#93a1b1", fontSize: 12, marginBottom: 8 }}>Integrantes</div>
            {miembros.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {miembros.map((m) => (
                  <div
                    key={m._id}
                    className="card"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, background: "#0b1117", borderColor: "#1f2937" }}
                  >
                    <Avatar name={m.usuario?.nombre} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700 }}>{m.usuario?.nombre || "—"}</div>
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
        <div className="card">
          <div style={{ color: "#93a1b1" }}>No hay info de grupo seleccionada aún.</div>
        </div>
      )}
    </div>
  );
}

/* ——— UI helpers ——— */
function Avatar({ name = "?" }) {
  const letter = String(name).slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: 10,
        display: "grid", placeItems: "center",
        fontSize: 13, fontWeight: 900,
        background: "#0f141a", border: "1px solid #1f2937", color: "#9ca3af"
      }}
      aria-label={`Avatar de ${name}`}
      title={name}
    >
      {letter}
    </div>
  );
}
