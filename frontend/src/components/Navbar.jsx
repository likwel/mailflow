// =====================================================
// src/components/Navbar.jsx  (Landing)
// =====================================================
import { useState } from "react";
import { T, styles } from "../theme";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const LINKS = ["Home", "Tarifs", "Docs"];

export default function Navbar({ active, setActive }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <nav style={{
        position: "fixed", 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        background: "#fff",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        padding: "0 clamp(16px, 5vw, 48px)", 
        height: 64,
        boxShadow: T.shadow,
      }}>
        {/* Left side: Menu Button (mobile) + Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Mobile Menu Button - À GAUCHE */}
          <button
            onClick={toggleMobileMenu}
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
              color: T.text,
            }}
            className="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 10, 
              cursor: "pointer",
            }} 
            onClick={() => {
              setActive("Home");
              setMobileMenuOpen(false);
            }}
          >
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 9, 
              background: T.primary, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              overflow: "hidden",
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
            <span style={{ 
              color: T.text, 
              fontWeight: 700, 
              fontSize: 'clamp(1.2rem, 4vw, 1.5rem)', 
              fontFamily: "'Pacifico', cursive", 
              letterSpacing: '0.5px',
            }}>
              MailFlow
            </span>
          </div>
        </div>

        {/* Center: Desktop Links */}
        <div style={{ 
          display: "flex", 
          gap: 4,
        }}
        className="desktop-links"
        >
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
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (active !== l) {
                  e.currentTarget.style.background = T.primaryLight;
                  e.currentTarget.style.color = T.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (active !== l) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = T.textSub;
                }
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Right: Desktop CTA */}
        <button 
          style={{
            ...styles.btn,
            fontSize: 14,
            padding: "8px 20px",
          }}
          className="desktop-cta"
          onClick={() => navigate("/login")}
        >
          Se connecter
        </button>

        {/* Right: Mobile CTA (visible en mobile) */}
        <button 
          style={{
            ...styles.btn,
            fontSize: 13,
            padding: "7px 16px",
            display: "none",
          }}
          className="mobile-cta"
          onClick={() => navigate("/login")}
        >
          Connexion
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      <div
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          background: "#fff",
          borderBottom: `1px solid ${T.border}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          maxHeight: mobileMenuOpen ? "400px" : "0",
          overflow: "hidden",
          transition: "max-height 0.3s ease-in-out, box-shadow 0.3s ease-in-out",
          zIndex: 99,
          display: "none",
        }}
        className="mobile-dropdown"
      >
        <div style={{ 
          display: "flex", 
          flexDirection: "column",
          padding: "12px 16px",
        }}>
          {LINKS.map((l, index) => (
            <button
              key={l}
              onClick={() => {
                setActive(l);
                setMobileMenuOpen(false);
              }}
              style={{
                background: active === l ? T.primaryLight : "transparent",
                border: "none",
                borderBottom: index < LINKS.length - 1 ? `1px solid ${T.border}` : "none",
                color: active === l ? T.primary : T.text,
                padding: "16px 12px",
                cursor: "pointer",
                fontSize: 15,
                fontWeight: active === l ? 600 : 500,
                textAlign: "left",
                transition: "all 0.2s",
                borderRadius: 0,
              }}
              onMouseEnter={(e) => {
                if (active !== l) {
                  e.currentTarget.style.background = T.primaryLight;
                }
              }}
              onMouseLeave={(e) => {
                if (active !== l) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay pour fermer le menu en cliquant à l'extérieur */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 98,
            display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* Styles CSS responsifs */}
      <style>{`
        @media (max-width: 768px) {
          /* Cacher les éléments desktop */
          .desktop-links,
          .desktop-cta {
            display: none !important;
          }
          
          /* Afficher les éléments mobile */
          .mobile-menu-btn {
            display: block !important;
          }

          .mobile-cta {
            display: block !important;
          }

          .mobile-dropdown {
            display: block !important;
          }

          .mobile-overlay {
            display: block !important;
          }
        }

        @media (min-width: 769px) {
          /* Cacher complètement le menu mobile sur desktop */
          .mobile-dropdown,
          .mobile-overlay {
            display: none !important;
          }
        }

        /* Animations smooth */
        .mobile-dropdown {
          -webkit-overflow-scrolling: touch;
        }

        /* Effet hover sur mobile */
        @media (hover: none) {
          .mobile-dropdown button:active {
            background: ${T.primaryLight} !important;
          }
        }
      `}</style>
    </>
  );
}