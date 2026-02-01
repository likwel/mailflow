import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth.jsx";
import Landing from "./pages/landing/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import { useEffect } from "react";

export default function App() {
  const { user, loading, login } = useAuth();
  const location = useLocation();

  // Après le callback OAuth Google, le token arrive en query param ?token=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      login(token);
      window.history.replaceState({}, "", "/dashboard");
    }
  }, [location.search]);

  // Écran de chargement pendant la vérification de session
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f6f9" }}>
        <p style={{ color: "#64748b", fontSize: 15 }}>Chargement...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Landing — accessible à tous */}
      <Route path="/" element={<Landing />} />
      <Route path="/home" element={<Landing initialPage="Home" />} />
      <Route path="/docs" element={<Landing initialPage="Docs" />} />
      <Route path="/pricing" element={<Landing initialPage="Pricing" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard — nécessite une auth, sinon redirect vers / */}
      <Route
        path="/dashboard/*"
        element={user ? <Dashboard /> : <Navigate to="/" replace />}
      />
    </Routes>
  );
}