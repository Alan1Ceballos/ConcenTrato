import Violacion from "../models/Violacion.js";
import Membresia from "../models/Membresia.js";
import Pacto from "../models/Pacto.js";
import { emitToGroup } from "../realtime/socket.js";

export async function crearViolacion(req, res) {
  try {
    const { grupoId, detalle = "", origen = "manual", tipo = "general" } = req.body;
    if (!grupoId) return res.status(400).json({ message: "Falta grupoId" });

    const pacto = await Pacto.findOne({ grupo: grupoId, activo: true }).lean();
    const puntosAplicados = pacto?.reglasPuntos?.violacion ?? -100;

    // Si hay imagen, convertirla a base64 y guardar en la BD
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
      imagen, // Guardamos la imagen en base64 directamente
    });

    await Membresia.updateOne(
      { usuario: req.user.id, grupo: grupoId },
      { $inc: { puntos: puntosAplicados } }
    );

    // Emitir en tiempo real al grupo
    emitToGroup(grupoId, "violation", {
      usuario: { id: req.user.id, nombre: req.user.nombre },
      detalle,
      puntos: puntosAplicados,
      tipo,
      imagen, // se envía el base64 directamente
    });

    emitToGroup(grupoId, "leaderboard:update", { grupoId });

    res.status(201).json(viol);
  } catch (err) {
    console.error("crearViolacion error:", err);
    res.status(500).json({ message: "Error al registrar violación", error: err.message });
  }
}
