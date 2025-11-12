import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket(groupId) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Si ya existe una conexión, no la recrees
    if (socketRef.current) return;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // si ya hay un grupo guardado, lo une automáticamente
      const gid = localStorage.getItem("groupId");
      if (gid) socket.emit("join:group", { groupId: gid });
    });

    socket.on("disconnect", () => setConnected(false));
    socket.on("presence:update", (p) => setOnlineUsers(p.users ?? []));
    socket.on("focus:tick", ({ secondsLeft }) => setSecondsLeft(secondsLeft));
    socket.on("focus:state", (s) => {
      if (s.estado === "activa")
        setSecondsLeft((s.minutosObjetivo || 50) * 60);
      if (s.estado === "finalizada") setSecondsLeft(null);
    });
    socket.on("focus:timeup", () => setSecondsLeft(0));

    // cleanup
    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
      setOnlineUsers([]);
    };
  }, []);

  // si cambia el grupo, re-une sin reconectar todo
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) return;
    if (!groupId) return;
    socket.emit("join:group", { groupId });
  }, [groupId, connected]);

  return {
    socket: socketRef.current,
    connected,
    onlineUsers,
    secondsLeft,
    setSecondsLeft,
  };
}
