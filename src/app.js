import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import router from "./routes/index.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Ruta base de status
app.get("/api/status", (_req, res) => {
  res.json({ ok: true, name: "ConcenTrato API", version: "1.0.0", env: process.env.NODE_ENV });
});

// Rutas principales
app.use("/api", router);

// === SERVIR FRONTEND COMPILADO ===
const distPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(distPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Manejo global de errores
app.use((err, _req, res, _next) => {
  console.error("❌ Error interno:", err);
  res.status(err.status || 500).json({ message: err.message || "Error interno" });
});

export default app;
