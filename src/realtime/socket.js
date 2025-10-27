import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import GroupFocus from "../models/GroupFocus.js";
import Pacto from "../models/Pacto.js";
import Violacion from "../models/Violacion.js";
import Membresia from "../models/Membresia.js";

// presencia y timers por grupo
const presence = new Map(); // groupId -> Set<userId>
const focusTimers = new Map(); // groupId -> { endAt: Date, interval: NodeJS.Timer }

let io = null;

export function initSocket(server) {
  io = new Server(server, { cors: { origin: "*" } });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("unauthorized"));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.id, nombre: payload.nombre };
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    socket.data.groupId = null;

    socket.on("join:group", ({ groupId }) => {
      if (!groupId) return;

      // 🔒 Evitar re-join al mismo groupId: no hagas nada
      if (socket.data.groupId === groupId) return;

      // salir del grupo anterior (si existía)
      if (socket.data.groupId) {
        const prev = socket.data.groupId;
        socket.leave(`room:grupo:${prev}`);
        const removed = removePresence(prev, socket.user.id);
        if (removed) emitPresence(prev);
      }

      // entrar al nuevo
      socket.data.groupId = groupId;
      socket.join(`room:grupo:${groupId}`);
      const added = addPresence(groupId, socket.user.id);
      if (added) emitPresence(groupId);
    });

    socket.on("leave:group", ({ groupId }) => {
      if (!groupId) return;
      // si no está en ese grupo, nada
      if (socket.data.groupId !== groupId) return;

      socket.leave(`room:grupo:${groupId}`);
      const removed = removePresence(groupId, socket.user.id);
      if (removed) emitPresence(groupId);
      socket.data.groupId = null;
    });

    socket.on("disconnect", async () => {
      const gid = socket.data.groupId;
      if (gid) {
        const removed = removePresence(gid, socket.user.id);
        if (removed) emitPresence(gid);
        try {
          await handlePotentialAbandon(gid, socket.user.id, "Desconexión durante enfoque");
        } catch (e) {
          console.error("Abandono (disconnect) no registrado:", e?.message || e);
        }
      }
    });
  });

  console.log("🔌 Socket.IO con presencia global y ticker listos");
}

// ===== Presence helpers =====
function addPresence(groupId, userId) {
  if (!presence.has(groupId)) presence.set(groupId, new Set());
  const set = presence.get(groupId);
  const before = set.size;
  set.add(userId);
  return set.size !== before; // true sólo si cambió
}
function removePresence(groupId, userId) {
  if (!presence.has(groupId)) return false;
  const set = presence.get(groupId);
  const before = set.size;
  set.delete(userId);
  if (set.size === 0) presence.delete(groupId);
  return set.size !== before; // true sólo si cambió
}
function emitPresence(groupId) {
  const list = presence.has(groupId) ? Array.from(presence.get(groupId)) : [];
  io.to(`room:grupo:${groupId}`).emit("presence:update", { users: list, count: list.length });
}

export function getActiveUserIdsInGroup(groupId) {
  return presence.get(groupId) || new Set();
}

// ===== Focus ticker =====
export function ensureFocusTicker(groupId, minutosObjetivo) {
  stopFocusTicker(groupId);
  const ms = (Number(minutosObjetivo) || 50) * 60 * 1000;
  const endAt = new Date(Date.now() + ms);

  const interval = setInterval(() => {
    const now = Date.now();
    const left = Math.max(0, Math.floor((endAt.getTime() - now) / 1000));
    io.to(`room:grupo:${groupId}`).emit("focus:tick", { secondsLeft: left });

    if (left <= 0) {
      clearInterval(interval);
      focusTimers.delete(groupId);
      io.to(`room:grupo:${groupId}`).emit("focus:timeup", { at: new Date() });
    }
  }, 1000);

  focusTimers.set(groupId, { endAt, interval });
}

export function stopFocusTicker(groupId) {
  const t = focusTimers.get(groupId);
  if (t?.interval) clearInterval(t.interval);
  focusTimers.delete(groupId);
}

// ===== generic emitter =====
export function emitToGroup(groupId, event, payload) {
  if (!io) return;
  io.to(`room:grupo:${groupId}`).emit(event, payload);
}

// ===== abandono helper =====
async function handlePotentialAbandon(groupId, userId, detalle) {
  const focus = await GroupFocus.findOne({ grupo: groupId, estado: "activa" }).lean();
  if (!focus) return;

  const participo = focus.participantes?.some(p => String(p.usuario) === String(userId));
  if (!participo) return;

  const pacto = await Pacto.findOne({ grupo: groupId, activo: true }).lean();
  const puntosAplicados = pacto?.reglasPuntos?.violacion ?? -100;

  const v = await Violacion.create({
    usuario: userId,
    grupo: groupId,
    detalle: detalle || "Abandono durante enfoque",
    origen: "socket",
    tipo: "abandono",
    puntosAplicados
  });

  await Membresia.updateOne(
    { usuario: userId, grupo: groupId },
    { $inc: { puntos: puntosAplicados } }
  );

  emitToGroup(groupId, "violation", {
    usuario: { id: userId },
    detalle: v.detalle,
    puntos: puntosAplicados,
    tipo: "abandono"
  });
  emitToGroup(groupId, "leaderboard:update", { grupoId });
}
