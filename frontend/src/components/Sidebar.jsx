// =====================================================
// src/components/Sidebar.jsx  (Dashboard)
// =====================================================
import { T } from "../theme";

const NAV_ITEMS = [
  { key: "overview",   icon: "🏠",  label: "Overview" },
  { key: "logs",       icon: "📋",  label: "Email Logs" },
  { key: "apikeys",    icon: "🔑",  label: "API Keys" },
  { key: "templates",  icon: "📝",  label: "Templates" },
  { key: "bulk",       icon: "📬",  label: "Bulk Send" },
  { key: "settings",   icon: "⚙️",  label: "Settings" },
];

export default function Sidebar({ active, onNavigate, user }) {
  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: "#fff",
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      top: 0, left: 0, bottom: 0,
      boxShadow: T.shadow,
    }}>
      {/* Logo */}
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 }}>
          M
        </div>
        <span style={{ color: T.text, fontWeight: 700, fontSize: 17 }}>MailFlow</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(({ key, icon, label }) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 13px", borderRadius: 8, border: "none", cursor: "pointer",
              background: active === key ? T.primaryLight : "transparent",
              color: active === key ? T.primary : T.textSub,
              fontSize: 13,
              fontWeight: active === key ? 600 : 500,
            }}
          >
            <span style={{ fontSize: 15 }}>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* User card */}
      <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 8, background: T.bg }}>
          <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: "50%" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: T.text, fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
            <p style={{ color: T.primary, fontSize: 10, margin: 0, fontWeight: 600 }}>{user.plan}</p>
          </div>
        </div>
        <button style={{ width: "100%", marginTop: 7, padding: 7, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 8, color: T.textSub, fontSize: 11, cursor: "pointer" }}>
          🚪 Déconnecter
        </button>
      </div>
    </aside>
  );
}