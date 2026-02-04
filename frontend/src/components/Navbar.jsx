// =====================================================
// src/components/Navbar.jsx  (Landing)
// =====================================================
import { T, styles } from "../theme";
import { useNavigate } from "react-router-dom";

const LINKS = ["Home", "Docs", "Pricing"];

export default function Navbar({ active, setActive }) {
  const navigate = useNavigate();
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "#fff",
      borderBottom: `1px solid ${T.border}`,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: 64,
      boxShadow: T.shadow,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setActive("Home")}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 17 }}>
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

      {/* Links */}
      <div style={{ display: "flex", gap: 4 }}>
        {LINKS.map((l) => (
          <button
            key={l}
            onClick={() => setActive(l)}
            style={{
              background: active === l ? T.primaryLight : "transparent",
              border: "none",
              color: active === l ? T.primary : T.textSub,
              padding: "7px 18px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: active === l ? 600 : 500,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* CTA */}
      <button style={styles.btn} onClick={() => navigate("/login")}>
        Se connecter
      </button>
    </nav>
  );
}