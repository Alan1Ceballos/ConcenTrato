import Violacion from "../models/Violacion.js";
import Membresia from "../models/Membresia.js";
import Pacto from "../models/Pacto.js";
import { emitToGroup } from "../realtime/socket.js";

// === Registrar una violación ===
export async function crearViolacion(req, res) {
  try {
    const { grupoId, detalle = "", origen = "manual", tipo = "general" } = req.body;
    if (!grupoId) return res.status(400).json({ message: "Falta grupoId" });

    const pacto = await Pacto.findOne({ grupo: grupoId, activo: true }).lean();
    const puntosAplicados = pacto?.reglasPuntos?.violacion ?? -100;

    // Imagen opcional
    let imagen = "";
    if (req.file?.buffer) {
      const mime = req.file.mimetype || "image/png";
      const base64 = req.file.buffer.toString("base64");
      imagen = `data:${mime};base64,${base64}`;
    }

    const viol = await Violacion.create({
      usuario: req.user.id,
      grupo: grupoId,
      detalle,
      origen,
      tipo,
      puntosAplicados,
      imagen,
    });

    await Membresia.updateOne(
      { usuario: req.user.id, grupo: grupoId },
      { $inc: { puntos: puntosAplicados } }
    );

    // Emitir al grupo
    emitToGroup(grupoId, "violation", {
      usuario: { id: req.user.id, nombre: req.user.nombre },
      detalle,
      puntos: puntosAplicados,
      tipo,
      imagen,
      fecha: viol.createdAt,
    });
    emitToGroup(grupoId, "leaderboard:update", { grupoId });

    res.status(201).json(viol);
  } catch (err) {
    console.error("crearViolacion error:", err);
    res.status(500).json({ message: "Error al registrar violación", error: err.message });
  }
}

// === Historial de violaciones de un usuario ===
export async function historialUsuario(req, res) {
  try {
    const { id } = req.params;
    const { grupoId } = req.query;
    if (!id) return res.status(400).json({ message: "Falta id de usuario" });

    const filtro = { usuario: id };
    if (grupoId) filtro.grupo = grupoId;

    const violaciones = await Violacion.find(filtro)
      .populate("usuario", "nombre email")
      .sort({ createdAt: -1 })
      .lean();

    const result = violaciones.map(v => ({
      id: v._id,
      usuario: v.usuario?.nombre || "—",
      detalle: v.detalle,
      tipo: v.tipo,
      puntosAplicados: v.puntosAplicados,
      fecha: v.createdAt,
      imagen: v.imagen || null,
      origen: v.origen,
    }));

    res.json(result);
  } catch (err) {
    console.error("historialUsuario error:", err);
    res.status(500).json({ message: "Error al obtener historial", error: err.message });
  }
}
