import mongoose from "mongoose";
import GroupFocus from "../models/GroupFocus.js";
import Grupo from "../models/Grupo.js";
import Membresia from "../models/Membresia.js";
import Pacto from "../models/Pacto.js";
import { emitToGroup, getActiveUserIdsInGroup, ensureFocusTicker, stopFocusTicker } from "../realtime/socket.js";

const toObjectId = (val) => {
  try {
    if (!val) return null;
    if (val instanceof mongoose.Types.ObjectId) return val;
    if (typeof val === "object" && val._id) return new mongoose.Types.ObjectId(val._id);
    if (typeof val === "string" && mongoose.isValidObjectId(val)) return new mongoose.Types.ObjectId(val);
    return null;
  } catch {
    return null;
  }
};

/**
 * 🔹 Inicia un nuevo enfoque grupal (pacto)
 */
export async function startFocus(req, res) {
  try {
    const { groupId } = req.params;
    const { minutosObjetivo = 50, recompensa = "", castigo = "" } = req.body;

    if (!mongoose.isValidObjectId(groupId))
      return res.status(400).json({ message: "groupId inválido" });

    const grupo = await Grupo.findById(groupId).lean();
    if (!grupo) return res.status(404).json({ message: "El grupo no existe" });

    const memb = await Membresia.findOne({ usuario: req.user.id, grupo: groupId });
    if (!memb)
      return res.status(403).json({ message: "No sos miembro de este grupo" });

    const existing = await GroupFocus.findOne({ grupo: groupId, estado: "activa" }).lean();
    if (existing)
      return res.status(409).json({ message: "Ya hay una sesión de enfoque activa" });

    const activeUserIds = Array.from(getActiveUserIdsInGroup(groupId) || []);
    const participantes = activeUserIds.map(toObjectId).filter(Boolean).map(oid => ({ usuario: oid }));

    const focus = await GroupFocus.create({
      grupo: groupId,
      minutosObjetivo: Number(minutosObjetivo) || 50,
      acuerdos: { recompensa: (recompensa || "").trim(), castigo: (castigo || "").trim() },
      participantes
    });

    try {
      // 🔥 Notificar inicio a todos los del grupo
      emitToGroup(groupId, "focus:state", {
        estado: "activa",
        minutosObjetivo: focus.minutosObjetivo,
        inicio: focus.inicio,
        acuerdos: focus.acuerdos,
        secondsLeft: focus.minutosObjetivo * 60
      });

      // ⏱️ Arrancar el contador global sincronizado
      ensureFocusTicker(groupId, focus.minutosObjetivo);
    } catch (e) {
      console.warn("⚠️ startFocus: fallo al emitir/socket:", e?.message || e);
    }

    return res.status(201).json(focus);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        message:
          "No se pudo iniciar: existe un índice único antiguo en 'GroupFocus'. Reinicia con el fix de índices.",
        error: "E11000 duplicate key"
      });
    }
    console.error("startFocus error:", err);
    return res.status(500).json({
      message: "Error al iniciar enfoque grupal",
      error: err.message
    });
  }
}

/**
 * 🔹 Une a un usuario a un enfoque activo (cuando entra tarde o se reconecta)
 */
export async function joinFocus(req, res) {
  try {
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId))
      return res.status(400).json({ message: "groupId inválido" });

    const focus = await GroupFocus.findOne({ grupo: groupId, estado: "activa" });
    if (!focus) return res.status(404).json({ message: "No hay sesión activa" });

    const isMember = await Membresia.exists({ usuario: req.user.id, grupo: groupId });
    if (!isMember)
      return res.status(403).json({ message: "No sos miembro de este grupo" });

    const ya = focus.participantes.find(p => String(p.usuario) === req.user.id);
    if (!ya) {
      const oid = toObjectId(req.user.id);
      if (!oid) return res.status(400).json({ message: "Usuario inválido" });
      focus.participantes.push({ usuario: oid });
      await focus.save();
      try {
        emitToGroup(groupId, "focus:participants", {
          count: focus.participantes.length
        });
      } catch {}
    }

    // ✅ Al unirse, el backend devuelve los segundos restantes actuales (por si hay timer activo)
    const now = Date.now();
    const endAt = new Date(focus.inicio.getTime() + focus.minutosObjetivo * 60000);
    const secondsLeft = Math.max(0, Math.floor((endAt.getTime() - now) / 1000));

    return res.json({ ok: true, secondsLeft });
  } catch (err) {
    console.error("joinFocus error:", err);
    return res.status(500).json({
      message: "Error al unirse a enfoque",
      error: err.message
    });
  }
}

/**
 * 🔹 Finaliza un enfoque grupal activo
 */
export async function endFocus(req, res) {
  try {
    const { groupId } = req.params;
    if (!mongoose.isValidObjectId(groupId))
      return res.status(400).json({ message: "groupId inválido" });

    const focus = await GroupFocus.findOne({ grupo: groupId, estado: "activa" });
    if (!focus) return res.status(404).json({ message: "No hay sesión activa" });

    focus.estado = "finalizada";
    focus.fin = new Date();
    await focus.save();

    // 🔴 Detener el timer sincronizado
    try { stopFocusTicker(groupId); } catch {}

    const pacto = await Pacto.findOne({ grupo: groupId, activo: true }).lean();
    const puntos = pacto?.reglasPuntos?.completarSesion ?? 20;

    const participantIds = (focus.participantes || [])
      .map(p => toObjectId(p.usuario))
      .filter(Boolean);

    if (participantIds.length > 0) {
      const upd = await Membresia.updateMany(
        { grupo: new mongoose.Types.ObjectId(groupId), usuario: { $in: participantIds } },
        { $inc: { puntos } }
      );
      console.log(`endFocus: +${puntos} puntos a ${upd.modifiedCount}/${participantIds.length} miembros`);
    } else {
      console.log("endFocus: sin participantes válidos para sumar puntos");
    }

    try {
      emitToGroup(groupId, "focus:state", {
        estado: "finalizada",
        fin: focus.fin,
        puntos
      });
      emitToGroup(groupId, "leaderboard:update", { groupId });
    } catch (e) {
      console.warn("endFocus: fallo al emitir/socket:", e?.message || e);
    }

    return res.json({ focus, puntos });
  } catch (err) {
    console.error("endFocus error:", err);
    if (err?.name === "CastError") {
      return res.status(400).json({
        message: "Datos inválidos al finalizar enfoque",
        error: err.message
      });
    }
    return res.status(500).json({
      message: "Error al finalizar enfoque",
      error: err.message
    });
  }
}

/**
 * 🔹 Devuelve el enfoque activo actual, con segundos restantes si está corriendo
 */
export async function getFocus(req, res) {
  try {
    const { groupId } = req.params;
    const focus = await GroupFocus.findOne({ grupo: groupId, estado: "activa" }).lean();
    if (!focus) return res.json(null);

    const now = Date.now();
    const endAt = new Date(new Date(focus.inicio).getTime() + focus.minutosObjetivo * 60000);
    const secondsLeft = Math.max(0, Math.floor((endAt.getTime() - now) / 1000));

    return res.json({ ...focus, secondsLeft });
  } catch (err) {
    console.error("getFocus error:", err);
    return res.status(500).json({
      message: "Error al obtener enfoque",
      error: err.message
    });
  }
}
