import React, { useContext, useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom"; // ← AÑADIDO
import { AuthContext } from "../context/AuthContext.jsx";

export default function Register() {
  const { register, loading } = useContext(AuthContext);
  const navigate = useNavigate(); // ← AÑADIDO
  const location = useLocation(); // ← AÑADIDO

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [warnUtec, setWarnUtec] = useState(false);
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: "" });
  const [logoVisible, setLogoVisible] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    setCaptcha({
      a: Math.floor(Math.random() * 10) + 1,
      b: Math.floor(Math.random() * 10) + 1,
      answer: "",
    });
    const t = setTimeout(() => setLogoVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const isPasswordValid = useMemo(() => {
    return (
      password.length >= 10 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }, [password]);

  const checkUtecEmail = (v) => {
    const emailLower = v.toLowerCase();
    return (
      emailLower.endsWith("@estudiantes.utec.edu.uy") ||
      emailLower.endsWith("@utec.edu.uy")
    );
  };

  const onEmailChange = (v) => {
    setEmail(v);
    if (v && !checkUtecEmail(v)) setWarnUtec(true);
    else setWarnUtec(false);
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!isPasswordValid) {
      setMsg(
        "La contraseña debe tener al menos 10 caracteres, una mayúscula, una minúscula y un símbolo."
      );
      triggerShake();
      return;
    }

    const expected = captcha.a + captcha.b;
    if (parseInt(captcha.answer) !== expected) {
      setMsg("Respuesta incorrecta al desafío anti-bot.");
      triggerShake();
      return;
    }

    const res = await register(nombre, email, password);
    if (!res.ok) {
      setMsg(res.message || "Error al crear cuenta.");
      triggerShake();
      return;
    }

    // === ÉXITO: REDIRECCIÓN INTELIGENTE ===
    const from = location.state?.from?.pathname || "/dashboard";
    navigate(from, { replace: true });
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
        animation: "fadeIn 0.8s ease",
      }}
    >
      {/* --- LOGO --- */}
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
          Crear cuenta nueva
        </div>
      </div>

      {/* --- TARJETA --- */}
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
          transform: shake ? "translateX(0)" : "none",
          animation: shake ? "shake 0.4s ease" : "none",
        }}
      >
        <div style={{ padding: "18px 16px 8px" }}>
          <h2 style={{ margin: 0, color: "#e5e7eb" }}>Crear cuenta</h2>
          <div style={{ color: "#93a1b1", marginTop: 4 }}>
            Sumate a tu grupo y concentrá mejor
          </div>
        </div>
        <div
          style={{
            height: 1,
            background:
              "linear-gradient(90deg,#0b1117,#2563eb 40%,#0b1117 80%)",
          }}
        />

        <div style={{ padding: 20 }}>
          {msg && (
            <div
              style={{
                color: "#f87171",
                background: "rgba(239,68,68,0.1)",
                borderRadius: 6,
                padding: "6px 8px",
                marginBottom: 10,
                fontSize: 13,
                animation: "fadeIn 0.3s ease",
              }}
            >
              {msg}
            </div>
          )}

          <form
            onSubmit={onSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            {/* Nombre */}
            <label style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 500 }}>
              Nombre
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Tu nombre"
              style={inputStyle}
            />

            {/* Email */}
            <label style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              required
              placeholder="tu@email.com"
              style={inputStyle}
            />
            {warnUtec && (
              <div
                style={{
                  color: "#fbbf24",
                  fontSize: 12,
                  animation: "fadeIn 0.4s ease",
                }}
              >
                No es un correo de UTEC (<em>@estudiantes.utec.edu.uy</em>)
              </div>
            )}

            {/* Contraseña */}
            <label style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 500 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 10 caracteres"
              style={inputStyle}
            />
            <PasswordHints password={password} />

            {/* Anti-bot */}
            <label style={{ color: "#e5e7eb", fontSize: 14, fontWeight: 500 }}>
              Desafío anti-bot
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#93a1b1" }}>
                ¿Cuánto es {captcha.a} + {captcha.b}?
              </span>
              <input
                type="number"
                value={captcha.answer}
                onChange={(e) =>
                  setCaptcha((old) => ({ ...old, answer: e.target.value }))
                }
                required
                style={{
                  width: 80,
                  background: "#0b1117",
                  border: "1px solid #1f2937",
                  color: "#e5e7eb",
                  padding: "8px 10px",
                  borderRadius: 8,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 14,
                background: loading ? "#1e40af" : "#2563eb",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "10px 12px",
                borderRadius: 8,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.3s ease, transform 0.1s ease",
              }}
              onMouseDown={(e) =>
                !loading && (e.currentTarget.style.transform = "translateY(2px)")
              }
              onMouseUp={(e) =>
                !loading && (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              {loading ? "Creando..." : "Registrarme"}
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

          <div
            style={{
              fontSize: 14,
              color: "#93a1b1",
              textAlign: "center",
            }}
          >
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" style={{ color: "#60a5fa" }}>
              Ingresar
            </Link>
          </div>
        </div>
      </div>

      {/* keyframes inline */}
      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-6px); }
            50% { transform: translateX(6px); }
            75% { transform: translateX(-4px); }
            100% { transform: translateX(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

/* --- estilos reutilizables --- */
const inputStyle = {
  background: "#0b1117",
  border: "1px solid #1f2937",
  color: "#e5e7eb",
  padding: "10px 12px",
  borderRadius: 8,
  outline: "none",
  transition: "border 0.2s, box-shadow 0.2s",
};

/* --- componente auxiliar para mostrar tips --- */
function PasswordHints({ password }) {
  const rules = [
    { test: /.{10,}/, text: "≥ 10 caracteres" },
    { test: /[A-Z]/, text: "1 mayúscula" },
    { test: /[a-z]/, text: "1 minúscula" },
    { test: /[^A-Za-z0-9]/, text: "1 símbolo" },
  ];
  if (!password) return null;
  return (
    <div style={{ fontSize: 12, color: "#93a1b1", marginTop: 4 }}>
      {rules.map((r) => {
        const ok = r.test.test(password);
        return (
          <div
            key={r.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: ok ? "#22c55e" : "#f87171",
              transition: "color 0.2s ease",
            }}
          >
            {ok ? "✓" : "✘"} {r.text}
          </div>
        );
      })}
    </div>
  );
}