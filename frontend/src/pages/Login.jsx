import React, { useContext, useMemo, useState, useEffect } from "react";
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
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    // Animación suave del logo al montar
    const t = setTimeout(() => setLogoVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

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

    const res = await login(mail, password, { remember });
    if (!res?.ok) {
      setMsg(res?.message || "No se pudo iniciar sesión.");
      return;
    }
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #10171f 0%, #0b1117 100%)",
        padding: 20,
        overflow: "hidden",
      }}
    >
      {/* === LOGO === */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
          opacity: logoVisible ? 1 : 0,
          transform: logoVisible ? "translateY(0)" : "translateY(-20px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
        }}
      >
        <img
          src="/icon.png"
          alt="ConcenTrato logo"
          style={{
            width: 90,
            height: 90,
            objectFit: "contain",
            borderRadius: 20,
            marginBottom: 10,
            boxShadow: "0 0 20px rgba(37,99,235,0.25)",
            transform: logoVisible ? "scale(1)" : "scale(0.9)",
            transition: "transform 0.6s ease-out",
          }}
        />
        <h1
          style={{
            color: "#e5e7eb",
            fontSize: "1.9rem",
            margin: 0,
            letterSpacing: 0.5,
          }}
        >
          ConcenTrato
        </h1>
        <div style={{ color: "#9ca3af", fontSize: 14, marginTop: 4 }}>
          Iniciá sesión para continuar
        </div>
      </div>

      {/* === TARJETA LOGIN === */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          padding: 0,
          background: "rgba(15,20,26,0.95)",
          border: "1px solid rgba(55,65,81,0.5)",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
          backdropFilter: "blur(6px)",
          overflow: "hidden",
          animation: "fadeIn 0.6s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#e5e7eb" }}>Ingresar</h2>
            <div style={{ color: "#93a1b1", marginTop: 4 }}>
              Bienvenido de vuelta 👋
            </div>
          </div>
          <button
            type="button"
            onClick={fillDemo}
            title="Autocompletar credenciales demo"
            style={{
              fontSize: 12,
              padding: "6px 10px",
              border: "1px solid #374151",
              borderRadius: 6,
              background: "transparent",
              color: "#93a1b1",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#93a1b1")}
          >
            Demo
          </button>
        </div>
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg,#0b1117,#2563eb 40%,#0b1117 80%)",
          }}
        />

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Mensajes */}
          <div aria-live="polite" style={{ minHeight: 20, marginBottom: 8 }}>
            {msg && (
              <div
                style={{
                  color: "#f87171",
                  background: "rgba(239,68,68,0.1)",
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 13,
                }}
              >
                {msg}
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* Email */}
            <label
              htmlFor="email"
              style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 500 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              style={{
                background: "#0b1117",
                border: "1px solid #1f2937",
                color: "#e5e7eb",
                padding: "10px 12px",
                borderRadius: 8,
                outline: "none",
                transition: "border 0.2s, box-shadow 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid #2563eb";
                e.target.style.boxShadow = "0 0 8px rgba(37,99,235,0.3)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid #1f2937";
                e.target.style.boxShadow = "none";
              }}
            />

            {/* Password */}
            <label
              htmlFor="password"
              style={{
                color: "#e5e7eb",
                fontSize: 14,
                fontWeight: 500,
                marginTop: 4,
              }}
            >
              Contraseña
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPass ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={onPasswordKey}
                onKeyDown={onPasswordKey}
                placeholder="••••••••"
                required
                aria-describedby="caps-hint"
                style={{
                  background: "#0b1117",
                  border: "1px solid #1f2937",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  borderRadius: 8,
                  width: "100%",
                  outline: "none",
                  transition: "border 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.border = "1px solid #2563eb";
                  e.target.style.boxShadow = "0 0 8px rgba(37,99,235,0.3)";
                }}
                onBlur={(e) => {
                  e.target.style.border = "1px solid #1f2937";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                style={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  height: 30,
                  padding: "0 10px",
                  fontSize: 12,
                  border: "1px solid #374151",
                  borderRadius: 6,
                  background: "transparent",
                  color: "#93a1b1",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#60a5fa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#93a1b1")}
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            {caps && (
              <div
                id="caps-hint"
                style={{
                  color: "#f59e0b",
                  fontSize: 12,
                  marginTop: 4,
                  background: "rgba(245,158,11,0.1)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  display: "inline-block",
                }}
              >
                ⚠️ Bloq Mayús activado
              </div>
            )}

            {/* Remember */}
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                userSelect: "none",
                marginTop: 8,
                color: "#93a1b1",
                fontSize: 14,
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
              type="submit"
              disabled={disabled}
              style={{
                marginTop: 12,
                background: disabled ? "#1e40af" : "#2563eb",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: disabled ? "not-allowed" : "pointer",
                transition: "background 0.3s ease, transform 0.1s ease",
                transform: disabled ? "none" : "translateY(0)",
              }}
              onMouseDown={(e) =>
                !disabled && (e.currentTarget.style.transform = "translateY(2px)")
              }
              onMouseUp={(e) =>
                !disabled && (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </form>

          <hr
            style={{
              border: "none",
              height: 1,
              background: "#1f2937",
              margin: "20px 0",
            }}
          />

          {/* Links finales */}
          <div
            style={{
              fontSize: 14,
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              flexWrap: "wrap",
              color: "#93a1b1",
            }}
          >
            <div>
              ¿No tenés cuenta?{" "}
              <Link to="/register" style={{ color: "#60a5fa" }}>
                Registrate
              </Link>
            </div>
            <div>
              <Link to="/reset" style={{ color: "#60a5fa" }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
