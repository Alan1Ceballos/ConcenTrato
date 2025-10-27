import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

function SocketProviderImpl({ children }) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const socketRef = useRef(null);
  const currentGroupRef = useRef(null);

  // Conexión única
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence:update", (p) => setOnlineUsers(p?.users ?? []));
    socket.on("focus:tick", ({ secondsLeft }) => setSecondsLeft(secondsLeft));
    socket.on("focus:state", (s) => {
      if (s.estado === "activa") setSecondsLeft((s.minutosObjetivo || 50) * 60);
      if (s.estado === "finalizada") setSecondsLeft(null);
    });
    socket.on("focus:timeup", () => setSecondsLeft(0));

    return () => {
      try { socket.disconnect(); } catch {}
    };
  }, []);

  // joinGroup estable + no re-entra si es el mismo groupId
  const joinGroup = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !groupId) return;
    if (currentGroupRef.current === groupId) return; // 🔒 no rejoin mismo grupo
    if (currentGroupRef.current && currentGroupRef.current !== groupId) {
      s.emit("leave:group", { groupId: currentGroupRef.current });
    }
    currentGroupRef.current = groupId;
    s.emit("join:group", { groupId });
  }, []);

  // Al conectar, únite al groupId actual (si existe)
  useEffect(() => {
    if (!connected) return;
    const gid = localStorage.getItem("groupId");
    if (gid) joinGroup(gid);
  }, [connected, joinGroup]);

  // Escuchar cambios reales de groupId (custom event y storage cross-tab)
  useEffect(() => {
    const onCustom = () => {
      const gid = localStorage.getItem("groupId");
      if (gid) joinGroup(gid);
    };
    const onStorage = (e) => {
      if (e.key === "groupId") onCustom();
    };

    window.addEventListener("groupId-changed", onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("groupId-changed", onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, [joinGroup]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      onlineUsers,
      secondsLeft,
      setSecondsLeft,
      joinGroup, // estable y con guard
    }),
    [connected, onlineUsers, secondsLeft, joinGroup]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketCtx() {
  return useContext(SocketContext);
}

export const SocketProvider = SocketProviderImpl;
export default SocketProviderImpl;
