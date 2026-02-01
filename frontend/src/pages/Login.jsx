// =====================================================
// src/pages/Login.jsx
// =====================================================
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { T, styles } from "../theme";

export default function Login() {
  const { user, loading, loginWithCredentials } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg }}>
        <p style={{ color: T.textSub, fontSize: 15 }}>Chargement...</p>
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await loginWithCredentials(email, password);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la connexion");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        ...styles.card,
        width: "100%",
        maxWidth: 420,
        padding: 48,
        boxShadow: T.shadowMd,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: T.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: 20,
          }}>
            M
          </div>
          <span style={{ color: T.text, fontWeight: 700, fontSize: 22 }}>MailFlow</span>
        </div>

        {/* Titre */}
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: T.text, textAlign: "center" }}>
          Bienvenue
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: T.textSub, textAlign: "center" }}>
          Connectez-vous à votre compte
        </p>

        {/* Erreur */}
        {error && (
          <div style={{
            background: T.dangerLight,
            border: `1px solid ${T.danger}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 13,
            color: T.danger,
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="vous@example.com"
            required
            style={{ ...styles.input, marginBottom: 16 }}
          />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ ...styles.input, marginBottom: 24 }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.btn,
              width: "100%",
              opacity: submitting ? 0.6 : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {/* Link vers Register */}
        <p style={{ margin: "20px 0 0", fontSize: 13, color: T.textSub, textAlign: "center" }}>
          Pas de compte ?{" "}
          <Link to="/register" style={{ color: T.primary, textDecoration: "none", fontWeight: 600 }}>
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}