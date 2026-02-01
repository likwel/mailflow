// =====================================================
// src/components/Header.jsx  (Dashboard)
// =====================================================
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { T, styles } from "../theme";

// Notifications mock — à remplacer par une vraie API
const MOCK_NOTIFICATIONS = [
  { id: 1, type: "success", title: "Email envoyé", desc: "Campagne newsletters — 2 min", time: "À l'instant", read: false },
  { id: 2, type: "danger",  title: "Bounce détecté", desc: "user@example.com a bouncé", time: "Il y a 15 min", read: false },
  { id: 3, type: "warning", title: "Quota à 80%", desc: "Il vous reste 200 emails ce mois", time: "Il y a 1h", read: false },
  { id: 4, type: "success", title: "API Key créée", desc: "sk_live_Xk29...", time: "Il y a 3h", read: true },
  { id: 5, type: "success", title: "Template sauvegardé", desc: "Welcome email v2", time: "Hier", read: true },
];

const ICONS = {
  success: { bg: T.successLight, color: T.success, icon: "✓" },
  danger:  { bg: T.dangerLight,  color: T.danger,  icon: "!" },
  warning: { bg: T.warningLight, color: T.warning, icon: "⚠" },
};

const PAGE_TITLES = {
  overview:  "Overview",
  logs:      "Email Logs",
  apikeys:   "API Keys",
  templates: "Templates",
  bulk:      "Bulk Send",
  settings:  "Settings",
};

export default function Header({ activePage }) {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const notifRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Fermer le dropdown en dehors
  useEffect(() => {
    function handler(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  return (
    <header style={{
      position: "fixed",
      top: 0, left: 220, right: 0,
      height: 64,
      background: "#fff",
      borderBottom: `1px solid ${T.border}`,
      boxShadow: T.shadow,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 40px",
      zIndex: 50,
    }}>
      {/* Titre de la page */}
      <div>
        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>
          {PAGE_TITLES[activePage] || "Dashboard"}
        </h1>
        {/* <p style={{ margin: 0, fontSize: 12, color: T.textSub }}>
          Bienvenue, {user?.name || "utilisateur"}
        </p> */}
      </div>

      {/* Actions droite */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>

        {/* Cloche notifications */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              position: "relative",
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              fontSize: 18,
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.bg}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            🔔
            {/* Badge */}
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: 5, right: 5,
                width: 18, height: 18,
                background: T.danger,
                color: "#fff",
                borderRadius: "50%",
                fontSize: 10,
                fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #fff",
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div style={{
              position: "absolute",
              top: 46, right: 0,
              width: 340,
              background: "#fff",
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              boxShadow: T.shadowMd,
              overflow: "hidden",
              zIndex: 100,
            }}>
              {/* Header dropdown */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
                  Notifications
                  {unreadCount > 0 && (
                    <span style={{
                      display: "inline-block",
                      background: T.primaryLight,
                      color: T.primary,
                      fontSize: 11,
                      fontWeight: 600,
                      borderRadius: 10,
                      padding: "2px 7px",
                      marginLeft: 8,
                    }}>
                      {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
                    </span>
                  )}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{ background: "none", border: "none", color: T.primary, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Tout lire
                  </button>
                )}
              </div>

              {/* Liste */}
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {notifications.map(n => {
                  const { bg, color, icon } = ICONS[n.type];
                  return (
                    <div
                      key={n.id}
                      style={{
                        display: "flex", gap: 12, padding: "12px 16px",
                        background: n.read ? "#fff" : T.primaryLight,
                        borderBottom: `1px solid ${T.border}`,
                        cursor: "pointer",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = n.read ? T.bg : "#e0e3ff"}
                      onMouseLeave={e => e.currentTarget.style.background = n.read ? "#fff" : T.primaryLight}
                    >
                      {/* Icône type */}
                      <div style={{
                        width: 34, height: 34, borderRadius: 8,
                        background: bg,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color, fontSize: 15, fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {icon}
                      </div>
                      {/* Texte */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{n.title}</p>
                        <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.desc}</p>
                        <p style={{ margin: "3px 0 0", fontSize: 11, color: T.textMuted }}>{n.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Avatar user */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: user?.avatar ? `url(${user.avatar}) center/cover` : T.primaryLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.primary, fontSize: 13, fontWeight: 700,
            border: `2px solid ${T.border}`,
          }}>
            {!user?.avatar && (user?.name?.[0]?.toUpperCase() || "U")}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{user?.name}</span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            padding: "6px 12px",
            fontSize: 12,
            color: T.textSub,
            cursor: "pointer",
            fontWeight: 500,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.danger; e.currentTarget.style.color = T.danger; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSub; }}
        >
          🚪 Déconnecter
        </button>
      </div>
    </header>
  );
}