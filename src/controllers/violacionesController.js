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

    const imagen = req.file ? `/uploads/${req.file.filename}` : "";

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

    emitToGroup(grupoId, "violation", {
      usuario: { id: req.user.id, nombre: req.user.nombre },
      detalle,
      puntos: puntosAplicados,
      tipo,
      imagen,
    });
    emitToGroup(grupoId, "leaderboard:update", { grupoId });

    res.status(201).json(viol);
  } catch (err) {
    res.status(500).json({ message: "Error al registrar violación", error: err.message });
  }
}
