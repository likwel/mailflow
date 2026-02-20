// src/components/automations/NodePalette.jsx
import {
  Zap, Clock, Mail, GitBranch, Tag, Globe,
  MessageSquare, Bell, UserPlus, UserMinus, UserCheck,
  FileText, BarChart2, Star, RefreshCw, Slash,
  Phone, Send, Database, Filter, Shuffle, Copy,
  AlarmClock, Calendar, ThumbsUp, Archive, Trash2, Bot 
} from "lucide-react";
import { useState } from "react";

const CATEGORIES = [
  {
    label: "Déclencheurs",
    nodes: [
      { type: "trigger",  label: "Déclencheur",  icon: Zap,       color: "#f59e0b", bg: "#fffbeb", desc: "Point de départ du workflow"       },
      { type: "schedule", label: "Planificateur", icon: Calendar,  color: "#f97316", bg: "#fff7ed", desc: "Déclenche à une date / heure fixe"  },
      { type: "alarm",    label: "Rappel",        icon: AlarmClock,color: "#fb923c", bg: "#fff7ed", desc: "Déclenche après un délai relatif"   },
    ],
  },
  {
    label: "Timing",
    nodes: [
      { type: "delay", label: "Délai", icon: Clock, color: "#6366f1", bg: "#f5f3ff", desc: "Pause avant l'étape suivante" },
    ],
  },
  {
    label: "Communication",
    nodes: [
      { type: "email",    label: "Email",           icon: Mail,          color: "#0891b2", bg: "#ecfeff", desc: "Envoyer un email"              },
      { type: "sms",      label: "SMS",             icon: Phone,         color: "#0d9488", bg: "#f0fdfa", desc: "Envoyer un SMS"                },
      { type: "push",     label: "Notification",    icon: Bell,          color: "#7c3aed", bg: "#f5f3ff", desc: "Notification push"             },
      { type: "chat",     label: "Message interne", icon: MessageSquare, color: "#2563eb", bg: "#eff6ff", desc: "Message dans l'app"            },
      { type: "telegram", label: "Telegram",        icon: Send,          color: "#0088cc", bg: "#e8f4fd", desc: "Envoyer un message Telegram"   },
    ],
  },
  {
    label: "Logique",
    nodes: [
      { type: "condition", label: "Condition", icon: GitBranch, color: "#10b981", bg: "#f0fdf4", desc: "Branchement conditionnel"            },
      { type: "filter",    label: "Filtre",    icon: Filter,    color: "#059669", bg: "#ecfdf5", desc: "Stoppe si condition fausse"          },
      { type: "split",     label: "Split A/B", icon: Shuffle,   color: "#14b8a6", bg: "#f0fdfa", desc: "Répartit en 2 groupes aléatoires"   },
      { type: "loop",      label: "Boucle",    icon: RefreshCw, color: "#0891b2", bg: "#ecfeff", desc: "Répète pour chaque élément"         },
      { type: "stop",      label: "Arrêt",     icon: Slash,     color: "#64748b", bg: "#f8fafc", desc: "Termine le workflow ici"            },
    ],
  },
  {
    label: "Contact",
    nodes: [
      { type: "tag",            label: "Tag",              icon: Tag,       color: "#8b5cf6", bg: "#faf5ff", desc: "Ajouter ou retirer un tag"     },
      { type: "add_contact",    label: "Ajouter contact",  icon: UserPlus,  color: "#6366f1", bg: "#eef2ff", desc: "Créer un nouveau contact"      },
      { type: "remove_contact", label: "Suppr. contact",   icon: UserMinus, color: "#ef4444", bg: "#fff1f2", desc: "Supprimer le contact"          },
      { type: "update_contact", label: "Màj contact",      icon: UserCheck, color: "#3b82f6", bg: "#eff6ff", desc: "Mettre à jour les champs"      },
      { type: "subscribe",      label: "Abonner",          icon: ThumbsUp,  color: "#10b981", bg: "#f0fdf4", desc: "Abonner à une liste"           },
      { type: "unsubscribe",    label: "Désabonner",       icon: Archive,   color: "#f59e0b", bg: "#fffbeb", desc: "Retirer d'une liste"           },
    ],
  },
  {
    label: "Données",
    nodes: [
      { type: "webhook",    label: "Webhook",        icon: Globe,     color: "#ef4444", bg: "#fff1f2", desc: "Appeler une URL externe"        },
      { type: "database",   label: "Base de données",icon: Database,  color: "#475569", bg: "#f8fafc", desc: "Lire ou écrire en base"         },
      { type: "copy_field", label: "Copier champ",   icon: Copy,      color: "#64748b", bg: "#f8fafc", desc: "Copier la valeur d'un champ"    },
      { type: "score",      label: "Score",          icon: Star,      color: "#eab308", bg: "#fefce8", desc: "Modifier le score du contact"   },
      { type: "note",       label: "Note",           icon: FileText,  color: "#64748b", bg: "#f8fafc", desc: "Ajouter une note au contact"    },
    ],
  },
  {
    label: "Reporting",
    nodes: [
      { type: "goal", label: "Objectif", icon: BarChart2, color: "#8b5cf6", bg: "#faf5ff", desc: "Marquer un objectif comme atteint" },
    ],
  },
  {
  label: "Intelligence Artificielle",
    nodes: [
      {
        type:  "ai_agent",
        label: "Agent IA",
        icon:  Bot,
        color: "#6d28d9",
        bg:    "#ede9fe",
        desc:  "Générer du contenu ou décider via IA",
      },
    ],
  },
];

export default function NodePalette({ x, y, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? CATEGORIES.map(cat => ({
        ...cat,
        nodes: cat.nodes.filter(n =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.desc.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(cat => cat.nodes.length > 0)
    : CATEGORIES;

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 19 }}/>

      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          position: "absolute", top: y, right: 0, zIndex: 20,
          background: "#fff", borderRadius: 14,
          border: "1px solid #e2e8f0",
          boxShadow: "0 16px 48px rgba(0,0,0,.15)",
          width: 260,
          maxHeight: "70vh",
          display: "flex", flexDirection: "column",
          marginTop : 5,
        }}
      >
        {/* Header */}
        <div style={{ padding: "12px 12px 8px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <p style={{ margin: "0 0 10px 2px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: .5 }}>
            Ajouter un nœud
          </p>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher…"
            autoFocus
            style={{
              width: "100%", padding: "6px 10px",
              border: "1.5px solid #e2e8f0", borderRadius: 8,
              fontSize: 12, outline: "none", boxSizing: "border-box",
              background: "#f8fafc", color: "#0f172a",
            }}
          />
        </div>

        {/* Liste scrollable */}
        <div style={{ overflowY: "auto", padding: "8px 8px", flex: 1 }}>
          {filtered.map(cat => (
            <div key={cat.label} style={{ marginBottom: 8 }}>
              {/* Titre catégorie */}
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#cbd5e1",
                textTransform: "uppercase", letterSpacing: .6,
                padding: "4px 6px",
              }}>
                {cat.label}
              </div>

              {cat.nodes.map(n => {
                const Icon = n.icon;
                return (
                  <button
                    key={n.type}
                    onClick={() => { onSelect(n.type); onClose(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "7px 8px",
                      background: "transparent", border: "none",
                      borderRadius: 9, cursor: "pointer",
                      textAlign: "left", transition: "background .1s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = n.bg}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                      background: n.bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: `1px solid ${n.color}20`,
                    }}>
                      <Icon size={15} color={n.color}/>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{n.label}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#cbd5e1", fontSize: 12 }}>
              Aucun nœud trouvé
            </div>
          )}
        </div>
      </div>
    </>
  );
}