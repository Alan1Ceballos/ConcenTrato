import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const location = useLocation(); // ← useLocation, no "loc"

  if (!token) {
    // Redirige a LANDING, no a login
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}