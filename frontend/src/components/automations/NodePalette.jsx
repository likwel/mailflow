// src/components/automations/NodePalette.jsx
import { Zap, Clock, Mail, GitBranch, Tag, Globe } from "lucide-react";

const NODES = [
  { type: "trigger",   label: "Déclencheur", icon: Zap,       color: "#f59e0b", bg: "#fef3c7", desc: "Point de départ du workflow" },
  { type: "email",     label: "Email",        icon: Mail,      color: "#0891b2", bg: "#e0f2fe", desc: "Envoyer un email" },
  { type: "delay",     label: "Délai",        icon: Clock,     color: "#6366f1", bg: "#ede9fe", desc: "Attendre avant la suite" },
  { type: "condition", label: "Condition",    icon: GitBranch, color: "#10b981", bg: "#d1fae5", desc: "Branchement conditionnel" },
  { type: "tag",       label: "Tag",          icon: Tag,       color: "#8b5cf6", bg: "#ede9fe", desc: "Ajouter un tag au contact" },
  { type: "webhook",   label: "Webhook",      icon: Globe,     color: "#ef4444", bg: "#fee2e2", desc: "Appeler une URL externe" },
];

export default function NodePalette({ x, y, onSelect, onClose }) {
  return (
    <>
      {/* Overlay invisible pour fermer */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, zIndex: 19 }}/>

      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: "absolute", top: y, zIndex: 20,
          background: "#fff", borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 16px 48px rgba(0,0,0,.15)",
          padding: 10, width: 240, right : 0,
        }}>
        <p style={{ margin: "0 0 8px 4px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: .5 }}>
          Ajouter un nœud
        </p>

        {NODES.map(n => {
          const Icon = n.icon;
          return (
            <button
              key={n.type}
              onClick={() => onSelect(n.type)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 10px",
                background: "transparent", border: "none",
                borderRadius: 9, cursor: "pointer",
                textAlign: "left", transition: "background .1s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = n.bg}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: n.bg, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={16} color={n.color}/>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{n.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{n.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}