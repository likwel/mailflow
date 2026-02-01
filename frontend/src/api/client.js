// =====================================================
// src/api/client.js — Axios instance centralisée
// =====================================================
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Interceptor : ajoute automatiquement le token JWT si présent
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("mf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor : si 401, efface le token et redirige vers la landing
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("mf_token");
      localStorage.removeItem("mf_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export default client;
