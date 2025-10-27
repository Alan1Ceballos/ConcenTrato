import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const loc = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: loc }} />;
  return children;
}
