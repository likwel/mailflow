// =====================================================
// src/hooks/useAuth.jsx
// =====================================================
import { createContext, useContext, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("mf_token");
    if (saved) {
      setToken(saved);
      fetchUser(saved);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(tk) {
    try {
      const res = await client.get("/auth/me", {
        headers: { Authorization: `Bearer ${tk}` },
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem("mf_token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  function login(tk) {
    localStorage.setItem("mf_token", tk);
    setToken(tk);
    fetchUser(tk);
  }

  async function register(email, password, name) {
    const res = await client.post("/auth/register", { email, password, name });
    login(res.data.token);
  }

  async function loginWithCredentials(email, password) {
    const res = await client.post("/auth/login", { email, password });
    login(res.data.token);
  }

  async function logout() {
    try {
      await client.post("/auth/logout", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    localStorage.removeItem("mf_token");
    setToken(null);
    setUser(null);
    window.location.href = "/";
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, loginWithCredentials }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}