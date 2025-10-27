import React, { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loading } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState("");
  const [caps, setCaps] = useState(false);

  const disabled = useMemo(() => {
    return loading || !email.trim() || !password;
  }, [loading, email, password]);

  const isValidEmail = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).toLowerCase());

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    const mail = email.trim();

    if (!isValidEmail(mail)) {
      setMsg("Ingresá un email válido.");
      return;
    }

    const res = await login(mail, password, { remember }); // si tu AuthContext ignora remember, no pasa nada
    if (!res?.ok) {
      setMsg(res?.message || "No se pudo iniciar sesión.");
      return;
    }
    // opcional: feedback suave
    setMsg("");
  };

  const onPasswordKey = (e) => {
    try {
      setCaps(e.getModifierState && e.getModifierState("CapsLock"));
    } catch {
      // noop
    }
  };

  const fillDemo = () => {
    setEmail("demo@concentrato.app");
    setPassword("demo1234");
    setMsg("");
  };

  return (
    <div className="container center" style={{ minHeight: "80vh" }}>
      <div className="card" style={{ width: 440, padding: 0, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ margin: 0 }}>Ingresar</h2>
            <div style={{ color: "#93a1b1", marginTop: 4 }}>Bienvenido de vuelta 👋</div>
          </div>
          <button
            type="button"
            className="btn-outline"
            onClick={fillDemo}
            title="Autocompletar credenciales demo"
            style={{ fontSize: 12, padding: "6px 10px" }}
          >
            Autocompletar demo
          </button>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg,#0b1117,#1f2937 20%,#1f2937 80%,#0b1117)" }} />

        {/* Body */}
        <div style={{ padding: 16 }}>
          {/* Mensajes */}
          <div aria-live="polite" style={{ minHeight: 20, marginBottom: 8 }}>
            {msg && <div style={{ color: "#f87171" }}>{msg}</div>}
          </div>

          <form onSubmit={onSubmit} className="row" style={{ flexDirection: "column", gap: 10 }}>
            {/* Email */}
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />

            {/* Password */}
            <label className="label" htmlFor="password" style={{ marginTop: 2 }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                className="input"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={onPasswordKey}
                onKeyDown={onPasswordKey}
                placeholder="••••••••"
                required
                aria-describedby="caps-hint"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="btn-outline"
                style={{
                  position: "absolute", right: 6, top: 6, height: 30,
                  padding: "0 10px", fontSize: 12
                }}
                tabIndex={0}
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {caps && (
              <div id="caps-hint" style={{ color: "#f59e0b", fontSize: 12 }}>
                Bloq Mayús activado
              </div>
            )}

            {/* Remember */}
            <label
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                userSelect: "none", marginTop: 4, color: "#93a1b1", fontSize: 14
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Recordarme en este dispositivo
            </label>

            {/* Submit */}
            <button
              className="btn"
              type="submit"
              disabled={disabled}
              style={{ marginTop: 8 }}
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <hr className="sep" />

          <div style={{ fontSize: 14, display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div>
              ¿No tenés cuenta? <Link to="/register">Registrate</Link>
            </div>
            {/* Si no tenés ruta de recovery todavía, podés dejar este Link a /reset para crearla luego */}
            <div>
              <Link to="/reset">¿Olvidaste tu contraseña?</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
