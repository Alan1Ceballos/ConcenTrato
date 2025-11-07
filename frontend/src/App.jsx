import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import AuthProvider from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Navbar from "./components/Navbar.jsx";

// === IMPORTA TODAS TUS PÁGINAS ===
import LandingPage from "./pages/LandingPage.jsx"; 
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Group from "./pages/Group.jsx";
import Focus from "./pages/Focus.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";

function AppContent() {
  const location = useLocation();
  const hideNavbar =
    location.pathname === "/login" || 
    location.pathname === "/register" || 
    location.pathname === "/"; 

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* PÚBLICAS */}
        <Route path="/" element={<LandingPage />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PRIVADAS */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group"
          element={
            <ProtectedRoute>
              <Group />
            </ProtectedRoute>
          }
        />
        <Route
          path="/focus"
          element={
            <ProtectedRoute>
              <Focus />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        {/* 404 → Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}