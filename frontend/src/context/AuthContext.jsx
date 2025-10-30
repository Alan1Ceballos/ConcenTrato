import React, { createContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

export const AuthContext = createContext(null);

function AuthProviderImpl({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // usa el preferido desde el backend
  const bootstrapGroup = async () => {
    const token = localStorage.getItem("token");
    const current = localStorage.getItem("groupId");
    if (!token || current) return;
    try {
      const { data } = await api.get("/api/grupos/preferido/mio");
      if (data?.groupId) {
        localStorage.setItem("groupId", data.groupId);
        // avisar al resto de la app
        window.dispatchEvent(new Event("groupId-changed"));
      } else {
        // fallback: si no tiene preferido todavía, mirar /mis
        const { data: mis } = await api.get("/api/grupos/mis");
        if (Array.isArray(mis) && mis.length > 0) {
          const gid = mis[0]?.grupo?._id;
          if (gid) {
            localStorage.setItem("groupId", gid);
            window.dispatchEvent(new Event("groupId-changed"));
          }
        }
      }
    } catch {}
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      await bootstrapGroup();
      navigate("/dashboard");
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e?.response?.data?.message || "Error" };
    } finally {
      setLoading(false);
    }
  };

  const register = async (nombre, email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/register", { nombre, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      await bootstrapGroup();
      navigate("/dashboard");
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e?.response?.data?.message || "Error" };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const groupId = localStorage.getItem("groupId");
      const token = localStorage.getItem("token");
      if (token && groupId) {
        try {
          const { data: focus } = await api.get(`/api/focus/${groupId}`);
          if (focus && focus.estado === "activa") {
            await api.post("/api/violaciones", {
              grupoId: groupId,
              detalle: "Cerró sesión durante enfoque",
              origen: "logout",
              tipo: "abandono"
            });
          }
        } catch {}
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("groupId");
      setUser(null);
      navigate("/login");
    }
  };

  useEffect(() => { bootstrapGroup(); }, []);

  const ctx = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
}

export const AuthProvider = AuthProviderImpl;
export default AuthProviderImpl;
