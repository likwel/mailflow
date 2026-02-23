// src/components/automations/CustomNode.jsx
import { useState } from "react";
import { Handle, Position } from "reactflow";
import { Plus, Zap, Clock, Mail, GitBranch, Tag, Globe,
  MessageSquare, Bell, UserPlus, UserMinus, UserCheck,
  FileText, BarChart2, Star, RefreshCw, Slash,
  Phone, Send, Database, Filter, Shuffle, Copy,
  AlarmClock, Calendar, ThumbsUp, Archive, Bot } from "lucide-react";

const NODE_CONFIG = {
  trigger:        { Icon: Zap,           color: "#f59e0b", bg: "#fff", border: "#e5e7eb", iconBg: "#fffbeb", label: "Déclencheur"   },
  schedule:       { Icon: Calendar,      color: "#f97316", bg: "#fff", border: "#e5e7eb", iconBg: "#fff7ed", label: "Planificateur" },
  alarm:          { Icon: AlarmClock,    color: "#fb923c", bg: "#fff", border: "#e5e7eb", iconBg: "#fff7ed", label: "Rappel"        },
  delay:          { Icon: Clock,         color: "#6366f1", bg: "#fff", border: "#e5e7eb", iconBg: "#f5f3ff", label: "Délai"         },
  email:          { Icon: Mail,          color: "#0891b2", bg: "#fff", border: "#e5e7eb", iconBg: "#ecfeff", label: "Email"         },
  sms:            { Icon: Phone,         color: "#0d9488", bg: "#fff", border: "#e5e7eb", iconBg: "#f0fdfa", label: "SMS"           },
  push:           { Icon: Bell,          color: "#7c3aed", bg: "#fff", border: "#e5e7eb", iconBg: "#f5f3ff", label: "Notification"  },
  chat:           { Icon: MessageSquare, color: "#2563eb", bg: "#fff", border: "#e5e7eb", iconBg: "#eff6ff", label: "Message"       },
  telegram:       { Icon: Send,          color: "#0088cc", bg: "#fff", border: "#e5e7eb", iconBg: "#e8f4fd", label: "Telegram"      },
  condition:      { Icon: GitBranch,     color: "#16a34a", bg: "#fff", border: "#e5e7eb", iconBg: "#f0fdf4", label: "Condition"     },
  filter:         { Icon: Filter,        color: "#059669", bg: "#fff", border: "#e5e7eb", iconBg: "#ecfdf5", label: "Filtre"        },
  split:          { Icon: Shuffle,       color: "#14b8a6", bg: "#fff", border: "#e5e7eb", iconBg: "#f0fdfa", label: "Split A/B"     },
  loop:           { Icon: RefreshCw,     color: "#0891b2", bg: "#fff", border: "#e5e7eb", iconBg: "#ecfeff", label: "Boucle"        },
  stop:           { Icon: Slash,         color: "#64748b", bg: "#fff", border: "#e5e7eb", iconBg: "#f8fafc", label: "Arrêt"         },
  tag:            { Icon: Tag,           color: "#8b5cf6", bg: "#fff", border: "#e5e7eb", iconBg: "#faf5ff", label: "Tag"           },
  add_contact:    { Icon: UserPlus,      color: "#6366f1", bg: "#fff", border: "#e5e7eb", iconBg: "#eef2ff", label: "Ajouter"       },
  remove_contact: { Icon: UserMinus,     color: "#ef4444", bg: "#fff", border: "#e5e7eb", iconBg: "#fff1f2", label: "Supprimer"     },
  update_contact: { Icon: UserCheck,     color: "#3b82f6", bg: "#fff", border: "#e5e7eb", iconBg: "#eff6ff", label: "Màj contact"   },
  subscribe:      { Icon: ThumbsUp,      color: "#10b981", bg: "#fff", border: "#e5e7eb", iconBg: "#f0fdf4", label: "Abonner"       },
  unsubscribe:    { Icon: Archive,       color: "#f59e0b", bg: "#fff", border: "#e5e7eb", iconBg: "#fffbeb", label: "Désabonner"    },
  webhook:        { Icon: Globe,         color: "#ef4444", bg: "#fff", border: "#e5e7eb", iconBg: "#fff1f2", label: "Webhook"       },
  database:       { Icon: Database,      color: "#475569", bg: "#fff", border: "#e5e7eb", iconBg: "#f8fafc", label: "Base données"  },
  copy_field:     { Icon: Copy,          color: "#64748b", bg: "#fff", border: "#e5e7eb", iconBg: "#f8fafc", label: "Copier champ"  },
  score:          { Icon: Star,          color: "#eab308", bg: "#fff", border: "#e5e7eb", iconBg: "#fefce8", label: "Score"         },
  note:           { Icon: FileText,      color: "#64748b", bg: "#fff", border: "#e5e7eb", iconBg: "#f8fafc", label: "Note"          },
  goal:           { Icon: BarChart2,     color: "#8b5cf6", bg: "#fff", border: "#e5e7eb", iconBg: "#faf5ff", label: "Objectif"      },
  ai_agent:       { Icon: Bot,           color: "#6d28d9", bg: "#fff", border: "#e5e7eb", iconBg: "#ede9fe", label: "Agent IA"      },
};

export default function CustomNode({ data, selected }) {
  const [hovered, setHovered] = useState(false);

  const cfg  = NODE_CONFIG[data.type] || NODE_CONFIG.trigger;
  const { Icon } = cfg;
  const isCondition = data.type === "condition";

  const borderColor = selected
    ? cfg.color
    : data.status === "error"   ? "#ef4444"
    : data.status === "success" ? "#10b981"
    : hovered ? cfg.color
    : cfg.border;

  const shadow = selected
    ? `0 0 0 2px ${cfg.color}40, 0 4px 20px rgba(0,0,0,.12)`
    : hovered
    ? `0 4px 16px rgba(0,0,0,.13)`
    : "0 1px 6px rgba(0,0,0,.08)";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: "'Inter','Segoe UI',sans-serif", position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Wrapper node + bouton + ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

        {/* Handle entrée gauche */}
        {data.type !== "trigger" && (
          <Handle type="target" position={Position.Left}
            style={{ width: 12, height: 12, background: "#9ca3af", border: "2px solid #fff", left: -7, top: "40%", transform: "translateY(-50%)", boxShadow: "0 1px 4px rgba(0,0,0,.15)" }}
          />
        )}

        {/* Carte principale */}
        <div
          onClick={() => data.onSelect?.()}
          style={{
            width: 60, height: 60,
            background: cfg.bg,
            border: `1.5px solid ${borderColor}`,
            borderRadius: 16,
            boxShadow: shadow,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            transition: "border-color .18s, box-shadow .18s",
            position: "relative",
          }}
        >
          {/* Icône */}
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: cfg.iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={26} color={cfg.color} strokeWidth={1.8}/>
          </div>

          {/* Badge statut */}
          {data.status && data.status !== "idle" && (
            <div style={{
              position: "absolute", top: -5, right: -5,
              width: 16, height: 16, borderRadius: "50%",
              background: data.status === "success" ? "#10b981" : data.status === "error" ? "#ef4444" : "#6366f1",
              border: "2px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {data.status === "running" && (
                <div style={{ width: 6, height: 6, borderRadius: "50%", border: "1.5px solid #fff", borderTopColor: "transparent", animation: "spin .7s linear infinite" }}/>
              )}
              {data.status === "success" && <span style={{ fontSize: 10, color: "#fff", fontWeight: 900 }}>✓</span>}
              {data.status === "error"   && <span style={{ fontSize: 10, color: "#fff", fontWeight: 900 }}>✕</span>}
            </div>
          )}

          {/* Handles condition */}
          {isCondition && (<>
            <Handle id="true"  type="source" position={Position.Right} style={{ ...handleStyle(), top: "30%" }}/>
            <Handle id="false" type="source" position={Position.Right} style={{ ...handleStyle(), top: "70%" }}/>
            <span style={{ position:"absolute", right:-30, top:"19%", fontSize:9, color:"#10b981", fontWeight:700 }}>true</span>
            <span style={{ position:"absolute", right:-34, top:"60%", fontSize:9, color:"#ef4444", fontWeight:700 }}>false</span>
          </>)}

          {/* Handle sortie droite */}
          {!isCondition && (
            <Handle type="source" position={Position.Right} style={handleStyle()}/>
          )}
        </div>

        {/* ── Bouton + : visible seulement au hover ─────────────────────── */}
        <button
          onClick={e => {
            e.stopPropagation();
            data.onAddNext?.(data.id);
          }}
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "#fff",
            border: `1.5px solid ${cfg.color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: cfg.color,
            boxShadow: `0 2px 8px ${cfg.color}25`,
            flexShrink: 0,
            transition: "opacity .15s, transform .15s",
            // ── Visible seulement au hover ──
            opacity:   hovered ? 1 : 0,
            pointerEvents: hovered ? "auto" : "none",
            transform: hovered ? "scale(1)" : "scale(0.7)",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = cfg.color;
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.transform = "scale(1.15)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "#fff";
            e.currentTarget.style.color = cfg.color;
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Ajouter un nœud suivant"
        >
          <Plus size={14} strokeWidth={2.5}/>
        </button>
      </div>

      {/* Label */}
      <div style={{ marginTop: 5, textAlign: "center", maxWidth: 100, alignSelf: "flex-start" }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: "#111827", lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {data.label || cfg.label}
        </div>
        {data.status === "error" && data.errorMsg && (
          <div style={{ fontSize: 9, color: "#ef4444", marginTop: 2 }}>{data.errorMsg}</div>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function handleStyle() {
  return {
    width: 12, height: 12,
    background: "#9ca3af",
    border: "2px solid #fff",
    right: -6,
    boxShadow: "0 1px 4px rgba(0,0,0,.15)",
  };
}