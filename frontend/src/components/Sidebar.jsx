// =====================================================
// src/components/Sidebar.jsx  (Dashboard)
// =====================================================
import { useState, useEffect } from "react";
import { T } from "../theme";
import { useAuth } from "../hooks/useAuth";
import {
  FiHome,
  FiFileText,
  FiKey,
  FiMail,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiX, FiZap, FiUsers,
} from "react-icons/fi";
import { FaLayerGroup } from "react-icons/fa";
import client from "../api/client";
import { Link } from "react-router-dom";

import {
    Workflow, Mail, BarChart3, Plus, Search, Play, Pause,
    Copy, Trash2, Settings, Edit, RefreshCw
} from "lucide-react";

const NAV_ITEMS = [
  { key: "overview", icon: FiHome, label: "Vue d’ensemble" },
  { key: "bulk", icon: FiMail, label: "Envoi mail" },
  { key: "logs", icon: FiFileText, label: "Historique" },
  { key: "apikeys", icon: FiKey, label: "Clés API" },
  { key: "templates", icon: FaLayerGroup, label: "Modèles" },
  { key: "automations", icon: Workflow, label: "Automatisation" },
  { key: "contacts", icon: FiUsers, label: "Contacts" },
  { key: "settings", icon: FiSettings, label: "Paramètres" },
];

export default function Sidebar({ active, onNavigate, user }) {
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [plan, setPlan] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    
    checkMobile();
    getMyPlan()
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fermer le menu mobile lors de la navigation
  const handleNavigate = (key) => {
    onNavigate(key);
    if (isMobile) setIsOpen(false);
  };

  async function getMyPlan() {
    try {
      const res = await client.get("/plans/me");
      setPlan(res.data);
    } catch (err) {
      // setError(err.response?.data?.error || "Erreur lors du chargement des logs");
    } finally {
      // setLoading(false);
    }
  }

  return (
    <>
      {/* Menu burger (mobile uniquement) */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "fixed",
            top: 10,
            left: 16,
            zIndex: 1001,
            background: T.primary,
            border: "none",
            borderRadius: 8,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: T.shadowMd,
            color: "#fff",
          }}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      )}

      {/* Overlay (mobile uniquement) */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: isMobile ? 220 : 220,
          minHeight: "100vh",
          background: "#fff",
          borderRight: `1px solid ${T.border}`,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: isMobile ? (isOpen ? 0 : -220) : 0,
          bottom: 0,
          boxShadow: T.shadow,
          zIndex: 1000,
          transition: "left 0.3s ease",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "11px 18px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: isMobile ? 60 : 0,
          }}
        >
          <Link to="/">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                // background: T.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 16,
                overflow: "hidden",
              }}
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </Link>
          <span
            style={{
              color: T.text,
              fontWeight: 700,
              fontSize: "1.5rem",
              fontFamily: "'Pacifico', cursive",
              letterSpacing: "0.5px",
            }}
          >
            MailFlow
          </span>
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "10px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY : 'auto',
          }}
        >
          {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => handleNavigate(key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "13px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: active === key ? T.primaryLight : "transparent",
                color: active === key ? T.primary : T.textSub,
                fontSize: 13,
                fontWeight: active === key ? 600 : 500,
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: "1rem" }}>{label}</span>
            </button>
          ))}
        </nav>

        {/* User card */}
        <div style={{ padding: 12, borderTop: `1px solid ${T.border}` }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              background: T.bg,
              marginBottom: 8,
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt=""
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `2px solid ${T.border}`,
                }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: T.primaryLight,
                  border: `2px solid ${T.primary}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.primary,
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  color: T.text,
                  fontSize: 13,
                  fontWeight: 600,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </p>
              <p
                style={{
                  color: T.primary,
                  fontSize: 11,
                  margin: "2px 0 0",
                  fontWeight: 700,
                }}
              >
                Plan {plan ? plan.name : 'Gratuit'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.textSub,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = T.danger;
              e.currentTarget.style.color = T.danger;
              e.currentTarget.style.background = T.dangerLight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = T.border;
              e.currentTarget.style.color = T.textSub;
              e.currentTarget.style.background = "transparent";
            }}
          >
            <FiLogOut size={16} />
            Déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}