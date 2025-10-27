import jwt from "jsonwebtoken";

/**
 * Middleware de autenticación (ESM).
 * Soporta export default y named.
 */
function auth(req, res, next) {
  try {
    const hdr = req.headers.authorization || "";
    const parts = hdr.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return res.status(401).json({ message: "Falta token" });
    }
    const token = parts[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload?.id) return res.status(401).json({ message: "Token inválido" });

    req.user = {
      id: String(payload.id),
      nombre: payload.nombre || "",
      email: payload.email || ""
    };
    next();
  } catch (e) {
    return res.status(401).json({ message: "No autorizado", error: e.message });
  }
}

export { auth };
export default auth;
