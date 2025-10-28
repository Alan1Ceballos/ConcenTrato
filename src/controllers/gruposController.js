import mongoose from "mongoose";
import Grupo from "../models/Grupo.js";
import Membresia from "../models/Membresia.js";
import Usuario from "../models/Usuario.js";

// Crea un grupo y agrega al creador como owner
export async function crearGrupo(req, res) {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ message: "Falta nombre" });
    if (!req.user?.id) return res.status(401).json({ message: "Usuario no autenticado" });

    // Crear grupo con campo 'creador'
    const grupo = await Grupo.create({
      nombre,
      creador: req.user.id,
    });

    // Crear membresía del creador como 'admin'
    const memb = await Membresia.create({
      usuario: req.user.id,
      grupo: grupo._id,
      rol: "admin",
      puntos: 0,
      lastActiveAt: new Date(),
    });

    // Generar código de invitación si no existe
    if (!grupo.codigoInvitacion) {
      grupo.codigoInvitacion = Math.random().toString(36).slice(2, 8).toUpperCase();
      await grupo.save();
    }

    return res.status(201).json({ grupo, membership: memb });
  } catch (e) {
    console.error("❌ crearGrupo error:", e);
    return res.status(500).json({ message: "Error al crear grupo", error: e.message });
  }
}

// Unirse por código
export async function unirseGrupo(req, res) {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ message: "Falta código" });
    if (!req.user?.id) return res.status(401).json({ message: "Usuario no autenticado" });

    const grupo = await Grupo.findOne({ codigoInvitacion: codigo.trim() });
    if (!grupo) return res.status(404).json({ message: "Código inválido" });

    let memb = await Membresia.findOne({ usuario: req.user.id, grupo: grupo._id });
    if (!memb) {
      memb = await Membresia.create({
        usuario: req.user.id,
        grupo: grupo._id,
        rol: "miembro",
        puntos: 0,
        lastActiveAt: new Date(),
      });
    } else {
      memb.lastActiveAt = new Date();
      await memb.save();
    }

    return res.status(200).json({ grupo, membership: memb });
  } catch (e) {
    console.error("❌ unirseGrupo error:", e);
    return res.status(500).json({ message: "Error al unirse al grupo", error: e.message });
  }
}

// Listar grupos del usuario (para vistas)
export async function misGrupos(req, res) {
  try {
    const membs = await Membresia.find({ usuario: req.user.id })
      .populate("grupo")
      .sort({ lastActiveAt: -1, updatedAt: -1 })
      .lean();

    return res.json(
      membs.map((m) => ({
        grupo: m.grupo,
        rol: m.rol,
        puntos: m.puntos,
        lastActiveAt: m.lastActiveAt,
      }))
    );
  } catch (e) {
    return res.status(500).json({ message: "Error al listar mis grupos", error: e.message });
  }
}

// Ver detalle de un grupo
export async function detalleGrupo(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "id inválido" });

    const grupo = await Grupo.findById(id).lean();
    if (!grupo) return res.status(404).json({ message: "No existe el grupo" });

    const miembros = await Membresia.find({ grupo: id })
      .populate("usuario", "nombre email")
      .lean();

    return res.json({ grupo, miembros });
  } catch (e) {
    return res.status(500).json({ message: "Error al obtener grupo", error: e.message });
  }
}

// Devuelve el grupo preferido (último activo)
export async function grupoPreferido(req, res) {
  try {
    const memb = await Membresia.findOne({ usuario: req.user.id })
      .sort({ lastActiveAt: -1, updatedAt: -1 })
      .lean();

    if (!memb) return res.json({ groupId: null });
    return res.json({ groupId: String(memb.grupo) });
  } catch (e) {
    return res.status(500).json({ message: "Error al obtener grupo preferido", error: e.message });
  }
}

// Setea el grupo activo para el usuario actual
export async function setGrupoActivo(req, res) {
  try {
    const { groupId } = req.body;
    if (!mongoose.isValidObjectId(groupId))
      return res.status(400).json({ message: "groupId inválido" });

    const memb = await Membresia.findOne({ usuario: req.user.id, grupo: groupId });
    if (!memb)
      return res.status(403).json({ message: "No sos miembro de este grupo" });

    memb.lastActiveAt = new Date();
    await memb.save();

    return res.json({ ok: true, groupId });
  } catch (e) {
    return res.status(500).json({ message: "Error al fijar grupo activo", error: e.message });
  }
}

// Leaderboard del grupo
export async function leaderboardGrupo(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ message: "id inválido" });

    const membs = await Membresia.find({ grupo: id })
      .populate("usuario", "nombre email")
      .select("usuario puntos rol updatedAt")
      .sort({ puntos: -1, updatedAt: -1 })
      .lean();

    let lastPoints = null;
    let currentRank = 0;
    const rows = membs.map((m, idx) => {
      if (m.puntos !== lastPoints) {
        currentRank = idx + 1;
        lastPoints = m.puntos;
      }
      return {
        rank: currentRank,
        usuario: {
          _id: String(m.usuario?._id || ""),
          nombre: m.usuario?.nombre || "—",
        },
        puntos: m.puntos ?? 0,
        rol: m.rol || "miembro",
      };
    });

    return res.json({ grupoId: String(id), total: rows.length, rows });
  } catch (e) {
    return res
      .status(500)
      .json({ message: "Error al obtener leaderboard", error: e.message });
  }
}
