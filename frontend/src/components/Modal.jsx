import { useEffect } from "react";
import { X } from "lucide-react";
import { T } from "../theme";

const SIZES = {
  sm:   { maxWidth: 400  },
  md:   { maxWidth: 560  },
  lg:   { maxWidth: 760  },
  xl:   { maxWidth: 1000 },
  full: { maxWidth: "calc(100vw - 40px)" },
};

export default function Modal({ open, onClose, title, subtitle, icon: Icon, footer, children, size = "md" }) {
  const { maxWidth } = SIZES[size] || SIZES.md;

  // Fermer avec Echap
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquer le scroll du body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(15,23,42,.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",                         // mobile : marges réduites
        boxSizing: "border-box",
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth,
          maxHeight: "92vh",
          background: "#fff", borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.06)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          // Responsive : sur très petits écrans, prend tout l'écran
          ...(typeof maxWidth === "number" && { "@media (maxWidth: 480px)": { borderRadius: 0, maxHeight: "100vh" } }),
        }}>

        {/* ── Header style client mail ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          background: "#fff",
          flexShrink: 0,
        }}>
          {/* Icône optionnelle */}
          {Icon && (
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#eff6ff",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Icon size={18} color={T.primary}/>
            </div>
          )}

          {/* Titre + sous-titre */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              margin: 0, fontSize: 15, fontWeight: 700, color: T.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: 0, fontSize: 12, color: T.textSub, marginTop: 1 }}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Fermer */}
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 8,
            background: "#f1f5f9", border: "none",
            cursor: "pointer", color: T.textSub, flexShrink: 0,
            transition: "all .15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = T.text; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#f1f5f9"; e.currentTarget.style.color = T.textSub; }}
          >
            <X size={15}/>
          </button>
        </div>

        {/* ── Contenu scrollable ── */}
        <div style={{
          flex: 1, overflowY: "auto",
          padding: "20px 24px",
          // Scrollbar discrète
          scrollbarWidth: "thin",
          scrollbarColor: `${T.border} transparent`,
        }}>
          {children}
        </div>

        {/* ── Footer optionnel ── */}
        {footer && (
          <div style={{
            padding: "12px 24px",
            borderTop: `1px solid ${T.border}`,
            background: "#f8fafc",
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}