import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Users, Target, Award, Brain } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const features = [
    { icon: Brain, title: "Concentración total", description: "Bloquea distracciones y mantén el foco." },
    { icon: Users, title: "Pactos grupales", description: "Compromiso real con tus compañeros." },
    { icon: Target, title: "Progreso visible", description: "Mide tu avance en tiempo real." },
    { icon: Award, title: "Logros y recompensas", description: "Gana puntos por tu disciplina." },
  ];

  return (
    <>
      <Helmet>
        <title>ConcenTrato - Pactos grupales para concentrarte</title>
        <meta
          name="description"
          content="Mejora tu productividad con pactos entre amigos. Ideal para estudiantes."
        />
      </Helmet>

      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(circle at top, #10171f 0%, #0b1117 100%)",
          color: "#e5e7eb",
          overflowX: "hidden",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* === HEADER === */}
        <header
          style={{
            width: "100%",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backdropFilter: "blur(8px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <img
              src="/icon.png"
              alt="ConcenTrato logo"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                boxShadow: "0 0 10px rgba(37,99,235,0.35)",
              }}
            />
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: 0.5,
                background: "linear-gradient(to right, #38bdf8, #2563eb)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              ConcenTrato
            </h1>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: 9999,
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(37,99,235,0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1.0)")}
            >
              Iniciar sesión
            </button>
          </motion.div>
        </header>

        {/* === HERO === */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "80px 20px",
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            style={{
              fontSize: "3rem",
              fontWeight: 800,
              lineHeight: 1.2,
              background: "linear-gradient(to right, #38bdf8, #2563eb, #4f46e5)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Concentrate con tus amigos
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              color: "#9ca3af",
              fontSize: 18,
              marginTop: 16,
              maxWidth: 700,
            }}
          >
            Creá pactos grupales para mantenerte enfocado, reducir distracciones y alcanzar tus metas junto a otros estudiantes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: "flex", gap: 14, marginTop: 40, flexWrap: "wrap", justifyContent: "center" }}
          >
            {/* === COMENZAR AHORA (MISMO ESTILO QUE INICIAR SESIÓN) === */}
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "linear-gradient(to right, #2563eb, #1d4ed8)",
                border: "none",
                color: "#fff",
                fontWeight: 600,
                padding: "10px 22px",
                borderRadius: 9999,
                cursor: "pointer",
                boxShadow: "0 0 20px rgba(37,99,235,0.3)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1.0)")}
            >
              Comenzar ahora
            </button>

            <button
              onClick={() => navigate("/login")}
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#e5e7eb",
                fontWeight: 600,
                padding: "14px 36px",
                borderRadius: 9999,
                fontSize: 16,
                background: "rgba(15,20,26,0.6)",
                backdropFilter: "blur(8px)",
                cursor: "pointer",
              }}
            >
              Ingresar
            </button>
          </motion.div>
        </section>

        {/* === FEATURES === */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
            gap: 24,
            padding: "60px 20px 80px",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              style={{
                background: "rgba(15,20,26,0.95)",
                border: "1px solid rgba(55,65,81,0.5)",
                borderRadius: 16,
                padding: 24,
                textAlign: "center",
                boxShadow: "0 8px 20px rgba(0,0,0,0.35)",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  margin: "0 auto 14px",
                  borderRadius: 12,
                  background: "linear-gradient(to right,#38bdf8,#2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 10px rgba(37,99,235,0.4)",
                }}
              >
                <f.icon size={28} color="#fff" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#e5e7eb", marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.5 }}>
                {f.description}
              </p>
            </motion.div>
          ))}
        </section>

        {/* === FOOTER === */}
        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            textAlign: "center",
            padding: "30px 20px",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <img
              src="/icon.png"
              alt="logo"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                boxShadow: "0 0 10px rgba(37,99,235,0.4)",
              }}
            />
            <span style={{ color: "#e5e7eb", fontWeight: 600 }}>ConcenTrato</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <a
              href="mailto:info@concentrato.com"
              style={{
                color: "#9ca3af",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#e5e7eb")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#9ca3af")}
            >
              info@concentrato.com
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}

