import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useSocket(groupId) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !groupId) return;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket"],
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join:group", { groupId });
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence:update", (p) => setOnlineUsers(p.users ?? []));
    socket.on("focus:tick", ({ secondsLeft }) => setSecondsLeft(secondsLeft));
    socket.on("focus:state", (s) => {
      if (s.estado === "activa") setSecondsLeft((s.minutosObjetivo || 50) * 60);
      if (s.estado === "finalizada") setSecondsLeft(null);
    });
    socket.on("focus:timeup", () => setSecondsLeft(0));

    return () => {
      socket.emit("leave:group", { groupId });
      socket.disconnect();
    };
  }, [groupId]);

  return { socket: socketRef.current, connected, onlineUsers, secondsLeft, setSecondsLeft };
}
