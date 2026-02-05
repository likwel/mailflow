// src/components/BulkActionsBar.jsx
import { Trash2, X, Users, List, Tag, Mail } from "lucide-react";
import { T } from "../theme";

export default function BulkActionsBar({ count, onDelete, onCancel, onAddToList, onAddTags }) {
  const barStyles = {
    container: {
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9998,
      animation: "slideUpBar 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
    },
    bar: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "16px 24px",
      background: `linear-gradient(135deg, ${T.text} 0%, ${T.text}ee 100%)`,
      borderRadius: 16,
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      minWidth: 500,
      maxWidth: 700
    },
    countBadge: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      background: "rgba(255, 255, 255, 0.15)",
      borderRadius: 10,
      border: "1px solid rgba(255, 255, 255, 0.2)"
    },
    countText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: 700,
      margin: 0
    },
    divider: {
      width: 1,
      height: 32,
      background: "rgba(255, 255, 255, 0.2)"
    },
    actions: {
      display: "flex",
      gap: 8,
      flex: 1
    },
    button: (variant = "default") => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 18px",
      background: variant === "danger" 
        ? T.danger 
        : variant === "primary"
        ? T.primary
        : "rgba(255, 255, 255, 0.15)",
      color: "#fff",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: 10,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 600,
      transition: "all 0.2s",
      whiteSpace: "nowrap"
    }),
    closeButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      borderRadius: 8,
      cursor: "pointer",
      color: "#fff",
      transition: "all 0.2s"
    }
  };

  return (
    <>
      <div style={barStyles.container}>
        <div style={barStyles.bar}>
          {/* Count Badge */}
          <div style={barStyles.countBadge}>
            <Users size={18} color="#fff" />
            <span style={barStyles.countText}>
              {count} sélectionné{count > 1 ? "s" : ""}
            </span>
          </div>

          <div style={barStyles.divider} />

          {/* Actions */}
          <div style={barStyles.actions}>
            {/* Add to List (optional) */}
            {onAddToList && (
              <button
                onClick={onAddToList}
                style={barStyles.button("default")}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.25)";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <List size={16} />
                Ajouter à une liste
              </button>
            )}

            {/* Add Tags (optional) */}
            {onAddTags && (
              <button
                onClick={onAddTags}
                style={barStyles.button("default")}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.25)";
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                <Tag size={16} />
                Ajouter des tags
              </button>
            )}

            {/* Delete */}
            <button
              onClick={onDelete}
              style={barStyles.button("danger")}
              onMouseEnter={(e) => {
                e.target.style.background = "#dc2626";
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow = "0 4px 12px rgba(220, 38, 38, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = T.danger;
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>

          <div style={barStyles.divider} />

          {/* Close Button */}
          <button
            onClick={onCancel}
            style={barStyles.closeButton}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.2)";
              e.target.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.1)";
              e.target.style.transform = "rotate(0deg)";
            }}
            title="Annuler la sélection"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Animations CSS */}
      <style>{`
        @keyframes slideUpBar {
          from { 
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}