import mongoose from "mongoose";
import Sesion from "../models/Sesion.js";
import Membresia from "../models/Membresia.js";
import Pacto from "../models/Pacto.js";
import Grupo from "../models/Grupo.js";
import { emitToGroup } from "../realtime/socket.js";

export async function iniciarSesion(req, res) {
  try {
    const { grupoId, minutosObjetivo = 50 } = req.body;

    if (!grupoId) {
      return res.status(400).json({ message: "Falta groupId" });
    }
    if (!mongoose.isValidObjectId(grupoId)) {
      return res.status(400).json({ message: "groupId inválido" });
    }

    const grupo = await Grupo.findById(grupoId).lean();
    if (!grupo) {
      return res.status(404).json({ message: "El grupo no existe" });
    }

    // Verificar que el usuario sea miembro del grupo
    const memb = await Membresia.findOne({ usuario: req.user.id, grupo: grupoId }).lean();
    if (!memb) {
      return res.status(403).json({ message: "No sos miembro de este grupo" });
    }

    // Crear sesión
    const sesion = await Sesion.create({
      usuario: req.user.id,
      grupo: grupoId,
      minutosObjetivo: Number(minutosObjetivo) || 50
    });

    emitToGroup(grupoId, "session:started", {
      usuario: { id: req.user.id, nombre: req.user.nombre },
      minutos: Number(minutosObjetivo) || 50
    });

    return res.status(201).json(sesion);
  } catch (err) {
    return res.status(500).json({ message: "Error al iniciar sesión de enfoque", error: err.message });
  }
}

export async function finalizarSesion(req, res) {
  try {
    const { id } = req.params;
    const sesion = await Sesion.findById(id);
    if (!sesion) return res.status(404).json({ message: "Sesión no encontrada" });
    if (String(sesion.usuario) !== req.user.id) return res.status(403).json({ message: "No autorizado" });

    sesion.estado = "finalizada";
    sesion.fin = new Date();
    await sesion.save();

    const pacto = await Pacto.findOne({ grupo: sesion.grupo, activo: true }).lean();
    const puntos = pacto?.reglasPuntos?.completarSesion ?? 20;

    await Membresia.updateOne(
      { usuario: req.user.id, grupo: sesion.grupo },
      { $inc: { puntos } }
    );

    emitToGroup(sesion.grupo, "session:finished", {
      usuario: { id: req.user.id, nombre: req.user.nombre },
      puntos
    });
    emitToGroup(sesion.grupo, "leaderboard:update", { grupoId: sesion.grupo });

    res.json({ sesion, puntos });
  } catch (err) {
    res.status(500).json({ message: "Error al finalizar sesión", error: err.message });
  }
}

export async function cancelarSesion(req, res) {
  try {
    const { id } = req.params;
    const sesion = await Sesion.findById(id);
    if (!sesion) return res.status(404).json({ message: "Sesión no encontrada" });
    if (String(sesion.usuario) !== req.user.id) return res.status(403).json({ message: "No autorizado" });

    sesion.estado = "cancelada";
    sesion.fin = new Date();
    await sesion.save();

    res.json({ sesion });
  } catch (err) {
    res.status(500).json({ message: "Error al cancelar sesión", error: err.message });
  }
}
