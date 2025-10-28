import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  withCredentials: false
});

// Inyectar token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Mostrar la URL base solo en modo desarrollo
if (import.meta.env.DEV) {
  console.log("🌐 API Base URL:", import.meta.env.VITE_API_URL);
}

export default api;
