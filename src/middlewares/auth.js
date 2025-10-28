import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación.
 * Verifica el token JWT y agrega req.user.
 */
export default function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Falta token de autorización" });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload || !payload.id) {
      console.error("❌ Token sin campo id:", payload);
      return res.status(401).json({ message: "Token inválido o incompleto" });
    }

    req.user = {
      id: String(payload.id),
      nombre: payload.nombre || "",
      email: payload.email || ""
    };

    next();
  } catch (err) {
    console.error("❌ Error en middleware auth:", err);
    return res.status(401).json({ message: "No autorizado", error: err.message });
  }
}

export { auth };