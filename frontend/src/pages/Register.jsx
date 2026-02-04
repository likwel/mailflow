// =====================================================
// src/pages/Register.jsx
// =====================================================
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Navigate, Link } from "react-router-dom";
import { T, styles } from "../theme";

export default function Register() {
  const { user, loading, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (password !== confirmPassword)
      return setError("Les mots de passe ne correspondent pas");

    setSubmitting(true);
    try {
      await register(email, password, name);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création du compte");
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
            <img
              src="../public/logo.png"
              alt="Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
          <span style={{ color: T.text, fontWeight: 700, fontSize: '1.5rem', fontFamily: "'Pacifico', cursive", letterSpacing: '0.5px'}}>MailFlow</span>
        </div>

        {/* Titre */}
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, color: T.text, textAlign: "center" }}>
          Créer un compte
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 14, color: T.textSub, textAlign: "center" }}>
          Commencez à envoyer des emails en quelques secondes
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
            Nom
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Jean Dupont"
            required
            style={{ ...styles.input, marginBottom: 16 }}
          />

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
            style={{ ...styles.input, marginBottom: 16 }}
          />

          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
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
            {submitting ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        {/* Link vers Login */}
        <p style={{ margin: "20px 0 0", fontSize: 13, color: T.textSub, textAlign: "center" }}>
          Déjà un compte ?{" "}
          <Link to="/login" style={{ color: T.primary, textDecoration: "none", fontWeight: 600 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}