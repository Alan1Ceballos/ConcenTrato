import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

function SocketProviderImpl({ children }) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [focusActive, setFocusActive] = useState(false);
  const socketRef = useRef(null);
  const currentGroupRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket"],
      auth: { token }
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("presence:update", (p) => setOnlineUsers(p?.users ?? []));
    socket.on("focus:tick", ({ secondsLeft }) => {
      setSecondsLeft(secondsLeft);
      if (secondsLeft > 0) setFocusActive(true);
    });
    socket.on("focus:state", (s) => {
      if (s.estado === "activa") {
        setFocusActive(true);
        setSecondsLeft(s.secondsLeft);
      }
      if (s.estado === "finalizada") {
        setFocusActive(false);
        setSecondsLeft(null);
      }
    });
    socket.on("focus:timeup", () => {
      setFocusActive(false);
      setSecondsLeft(0);
    });

    return () => {
      try { socket.disconnect(); } catch {}
    };
  }, []);

  const joinGroup = useCallback((groupId) => {
    const s = socketRef.current;
    if (!s || !groupId) return;
    if (currentGroupRef.current === groupId) return;
    if (currentGroupRef.current && currentGroupRef.current !== groupId) {
      s.emit("leave:group", { groupId: currentGroupRef.current });
    }
    currentGroupRef.current = groupId;
    s.emit("join:group", { groupId });
  }, []);

  useEffect(() => {
    if (!connected) return;
    const gid = localStorage.getItem("groupId");
    if (gid) joinGroup(gid);
  }, [connected, joinGroup]);

  useEffect(() => {
    const onCustom = () => {
      const gid = localStorage.getItem("groupId");
      if (gid) joinGroup(gid);
    };
    window.addEventListener("groupId-changed", onCustom);
    window.addEventListener("storage", onCustom);
    return () => {
      window.removeEventListener("groupId-changed", onCustom);
      window.removeEventListener("storage", onCustom);
    };
  }, [joinGroup]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      onlineUsers,
      secondsLeft,
      focusActive,
      setSecondsLeft,
      joinGroup
    }),
    [connected, onlineUsers, secondsLeft, focusActive, joinGroup]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocketCtx() {
  return useContext(SocketContext);
}

export const SocketProvider = SocketProviderImpl;
export default SocketProviderImpl;
