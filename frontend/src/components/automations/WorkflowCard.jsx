// src/components/automations/WorkflowCard.jsx
import { useState } from "react";
import {
  Play, Pause, Copy, Edit, Trash2,
  Zap, Clock, Mail, GitBranch, Tag, Globe,
  Bot, Share2, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Pen, Check, X,
} from "lucide-react";

// Import à mettre à jour
import { AlarmClock, MessageSquare, Bell, Phone, Send,
  Filter, Shuffle, RefreshCw, Slash,
  UserPlus, UserMinus, UserCheck, ThumbsUp, Archive,
  Database, Star, FileText, BarChart2,
} from "lucide-react";

/* ── Statuts ─────────────────────────────────────── */
const STATUS = {
  active:   { label: "Actif",     bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  inactive: { label: "Inactif",   bg: "#f8fafc", color: "#64748b", dot: "#94a3b8" },
  draft:    { label: "Brouillon", bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
};

/* ── Icônes par type de node ─────────────────────── */

const NODE_ICONS = {
  // ── Déclencheurs ──────────────────────────────────
  trigger:        { Icon: Zap,          color: "#f59e0b", bg: "#fffbeb" },
  schedule:       { Icon: Clock,        color: "#f97316", bg: "#fff7ed" },
  alarm:          { Icon: AlarmClock,   color: "#fb923c", bg: "#fff7ed" },

  // ── Timing ────────────────────────────────────────
  delay:          { Icon: Clock,        color: "#6366f1", bg: "#f5f3ff" },

  // ── Communication ─────────────────────────────────
  email:          { Icon: Mail,         color: "#0891b2", bg: "#ecfeff" },
  sms:            { Icon: Phone,        color: "#0d9488", bg: "#f0fdfa" },
  push:           { Icon: Bell,         color: "#7c3aed", bg: "#f5f3ff" },
  chat:           { Icon: MessageSquare,color: "#2563eb", bg: "#eff6ff" },
  telegram:       { Icon: Send,         color: "#0088cc", bg: "#e8f4fd" },
  broadcast:      { Icon: Share2,       color: "#0ea5e9", bg: "#f0f9ff" },

  // ── Logique ───────────────────────────────────────
  condition:      { Icon: GitBranch,    color: "#10b981", bg: "#f0fdf4" },
  filter:         { Icon: Filter,       color: "#059669", bg: "#ecfdf5" },
  split:          { Icon: Shuffle,      color: "#14b8a6", bg: "#f0fdfa" },
  loop:           { Icon: RefreshCw,    color: "#0891b2", bg: "#ecfeff" },
  stop:           { Icon: Slash,        color: "#64748b", bg: "#f8fafc" },

  // ── Contact ───────────────────────────────────────
  tag:            { Icon: Tag,          color: "#8b5cf6", bg: "#faf5ff" },
  add_contact:    { Icon: UserPlus,     color: "#6366f1", bg: "#eef2ff" },
  remove_contact: { Icon: UserMinus,    color: "#ef4444", bg: "#fff1f2" },
  update_contact: { Icon: UserCheck,    color: "#3b82f6", bg: "#eff6ff" },
  subscribe:      { Icon: ThumbsUp,     color: "#10b981", bg: "#f0fdf4" },
  unsubscribe:    { Icon: Archive,      color: "#f59e0b", bg: "#fffbeb" },

  // ── Données ───────────────────────────────────────
  webhook:        { Icon: Globe,        color: "#ef4444", bg: "#fff1f2" },
  database:       { Icon: Database,     color: "#475569", bg: "#f8fafc" },
  copy_field:     { Icon: Copy,         color: "#64748b", bg: "#f8fafc" },
  score:          { Icon: Star,         color: "#eab308", bg: "#fefce8" },
  note:           { Icon: FileText,     color: "#64748b", bg: "#f8fafc" },

  // ── IA ────────────────────────────────────────────
  ai_agent:       { Icon: Bot,          color: "#6d28d9", bg: "#ede9fe" },

  // ── Reporting ─────────────────────────────────────
  goal:           { Icon: BarChart2,    color: "#8b5cf6", bg: "#faf5ff" },
};

/* ── Badge dernière exécution ────────────────────── */
function ExecBadge({ status }) {
  if (!status) return null;
  const map = {
    success: { Icon: CheckCircle, color: "#16a34a", label: "Succès"   },
    error:   { Icon: XCircle,     color: "#ef4444", label: "Erreur"   },
    running: { Icon: AlertCircle, color: "#6366f1", label: "En cours" },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: s.color, fontWeight: 700 }}>
      <s.Icon size={11}/> {s.label}
    </span>
  );
}

/* ── Aperçu visuel des nodes ─────────────────────── */
function NodesSummary({ nodes = [] }) {
  if (!nodes.length) return null;
  const visible = nodes.slice(0, 5);
  const more    = nodes.length - 5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {visible.map((node, i) => {
        const cfg  = NODE_ICONS[node.type] || NODE_ICONS.trigger;
        const Icon = cfg.Icon;
        return (
          <div key={node.id || i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: cfg.bg,
              border: `1px solid ${cfg.color}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={12} color={cfg.color}/>
            </div>
            {i < visible.length - 1 && <ChevronRight size={10} color="#cbd5e1"/>}
          </div>
        );
      })}
      {more > 0 && (
        <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>+{more}</span>
      )}
    </div>
  );
}

/* ── Composant principal ─────────────────────────── */
export default function WorkflowCard({ workflow, onEdit, onDelete, onToggleStatus, onDuplicate, onRename, T }) {
  const [editing,     setEditing]     = useState(false);
  const [name,        setName]        = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || "");

  function handleSave(e) {
    e.stopPropagation();
    if (!name.trim()) return;
    onRename?.(workflow.id, { name: name.trim(), description });
    setEditing(false);
  }

  function handleCancel(e) {
    e.stopPropagation();
    setName(workflow.name);
    setDescription(workflow.description || "");
    setEditing(false);
  }

  const st        = STATUS[workflow.status] || STATUS.draft;
  const nodes     = workflow.nodes || [];
  const lastEx    = workflow.lastExecution;
  const totalRuns = workflow.totalRuns || 0;

  const triggerNode = nodes.find(n => ["trigger", "schedule", "alarm"].includes(n.type));
  const triggerCfg  = NODE_ICONS[triggerNode?.type] || NODE_ICONS.trigger;
  const TriggerIcon = triggerCfg.Icon;

  const lastRunDate = lastEx?.startedAt ? formatRelative(new Date(lastEx.startedAt)) : null;
  const avgDuration = workflow.avgDuration ? formatDuration(workflow.avgDuration) : null;

  return (
    <div
      onClick={() => !editing && onEdit(workflow)}
      style={{
        background: "#fff",
        border: `1px solid ${T?.border || "#e2e8f0"}`,
        borderRadius: 16,
        overflow: "hidden",
        transition: "all .18s ease",
        cursor: editing ? "default" : "pointer",
      }}
      onMouseEnter={e => {
        if (editing) return;
        e.currentTarget.style.borderColor = "#6366f1";
        e.currentTarget.style.boxShadow   = "0 4px 20px rgba(99,102,241,.10)";
        e.currentTarget.style.transform   = "translateY(-1px)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = T?.border || "#e2e8f0";
        e.currentTarget.style.boxShadow   = "none";
        e.currentTarget.style.transform   = "translateY(0)";
      }}
    >
      {/* Barre colorée top */}
      <div style={{ height: 3, background: st.dot }}/>

      <div style={{ padding: "16px 18px" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>

          {/* Icône trigger */}
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: triggerCfg.bg,
            border: `1.5px solid ${triggerCfg.color}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 8px ${triggerCfg.color}15`,
          }}>
            <TriggerIcon size={20} color={triggerCfg.color}/>
          </div>

          {/* Nom + description — zone éditable */}
          <div style={{ flex: 1, minWidth: 0 }} onClick={e => e.stopPropagation()}>
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSave(e); if (e.key === "Escape") handleCancel(e); }}
                  style={{
                    fontSize: 13, fontWeight: 700, color: "#0f172a",
                    border: "1.5px solid #6366f1", borderRadius: 7,
                    padding: "5px 9px", outline: "none", width: "100%",
                    boxSizing: "border-box", background: "#f8fafc",
                  }}
                />
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Description (optionnel)"
                  onKeyDown={e => { if (e.key === "Enter") handleSave(e); if (e.key === "Escape") handleCancel(e); }}
                  style={{
                    fontSize: 11, color: "#64748b",
                    border: "1.5px solid #e2e8f0", borderRadius: 7,
                    padding: "5px 9px", outline: "none", width: "100%",
                    boxSizing: "border-box", background: "#f8fafc",
                  }}
                />
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={handleSave} style={{ ...miniBtn, background: "#eef0ff", color: "#6366f1", borderColor: "#6366f1", border :"1px solid rgb(181, 182, 249)", boxShadow: "rgba(99, 102, 241, 0.3) 0px 4px 12px" }}>
                    <Check size={11}/> Enregistrer
                  </button>
                  <button onClick={handleCancel} style={{...miniBtn, color:"#e7673e", border: "1px solid #ebc6ba"}}>
                    <X size={11}/> Annuler
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 3 }}>
                  <h3 style={{
                    fontSize: 14, fontWeight: 700, color: T?.text || "#0f172a", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 190,
                  }}>
                    {workflow.name}
                  </h3>

                  {/* Badge statut */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    background: st.bg, color: st.color,
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, display: "inline-block" }}/>
                    {st.label}
                  </span>

                  {/* ── Bouton crayon ── */}
                  <button
                    title="Modifier le nom et la description"
                    onClick={e => { e.stopPropagation(); setEditing(true); }}
                    style={{
                      width: 22, height: 22, borderRadius: 6,
                      border: "1px solid #e2e8f0", background: "transparent",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#94a3b8", transition: "all .15s", flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#ede9fe"; e.currentTarget.style.color = "#6366f1"; e.currentTarget.style.borderColor = "#a5b4fc"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94a3b8"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    <Pen size={11}/>
                  </button>
                </div>

                <p style={{
                  color: T?.textSub || "#64748b", fontSize: 12, margin: 0, lineHeight: 1.4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {workflow.description || <span style={{ fontStyle: "italic", opacity: .5 }}>Aucune description</span>}
                </p>
              </>
            )}
          </div>

          {/* Boutons d'action */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
            <ActionBtn
              title={workflow.status === "active" ? "Désactiver" : "Activer"}
              onClick={() => onToggleStatus(workflow.id, workflow.status)}>
              {workflow.status === "active" ? <Pause size={14}/> : <Play size={14}/>}
            </ActionBtn>
            <ActionBtn title="Dupliquer" onClick={() => onDuplicate(workflow)}>
              <Copy size={14}/>
            </ActionBtn>
            <ActionBtn title="Modifier le workflow" onClick={() => onEdit(workflow)}>
              <Edit size={14}/>
            </ActionBtn>
            <ActionBtn title="Supprimer" danger onClick={() => onDelete(workflow.id)}>
              <Trash2 size={14}/>
            </ActionBtn>
          </div>
        </div>

        {/* ── Aperçu nodes ── */}
        {nodes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <NodesSummary nodes={nodes}/>
          </div>
        )}

        {/* ── Stats réelles ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8,
          marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T?.border || "#e2e8f0"}`,
        }}>
          <StatBox label="Exécutions"    value={totalRuns}                        color={T?.text || "#0f172a"}/>
          <StatBox label="Dernière exec." value={lastRunDate || "—"}              color={T?.primary || "#6366f1"} small/>
          <StatBox label="Statut"        value={<ExecBadge status={lastEx?.status}/>} color={T?.text || "#0f172a"}/>
          <StatBox label="Nodes"         value={nodes.length}                     color="#10b981"/>
        </div>

        {/* ── Footer ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T?.border || "#e2e8f0"}`,
        }}>
          <span style={{ fontSize: 10, color: T?.textSub || "#64748b" }}>
            Modifié {formatRelative(new Date(workflow.updatedAt))}
          </span>
          {avgDuration && (
            <span style={{ fontSize: 10, color: T?.textSub || "#64748b" }}>⏱ {avgDuration}</span>
          )}
          {lastEx?.error && (
            <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
              ⚠ {lastEx.error}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Micro-composants ────────────────────────────── */
function StatBox({ label, value, color, small = false }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 8, background: "#f8fafc", textAlign: "center", display :"flex", flexDirection :"column", alignItems :"center", }}>
      <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 3px", fontWeight: 600, textTransform: "uppercase", letterSpacing: .3 }}>
        {label}
      </p>
      <div style={{ fontSize: small ? 11 : 16, fontWeight: 800, color, margin: 0, lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

function ActionBtn({ children, onClick, title, danger }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 7,
        border: "1px solid #e2e8f0", background: "#f8fafc",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        color: danger ? "#ef4444" : "#64748b", transition: "all .15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = danger ? "#fff1f2" : "#f1f5f9";
        e.currentTarget.style.borderColor = danger ? "#fca5a5" : "#cbd5e1";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = "#f8fafc";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {children}
    </button>
  );
}

/* ── Styles ──────────────────────────────────────── */
const miniBtn = {
  display: "flex", alignItems: "center", gap: 4,
  padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
  border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569",
  cursor: "pointer",
};

/* ── Helpers ─────────────────────────────────────── */
function formatRelative(date) {
  if (!date || isNaN(date)) return "—";
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60)     return "à l'instant";
  if (diff < 3600)   return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400)  return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `il y a ${Math.floor(diff / 86400)} j`;
  return date.toLocaleDateString("fr-FR");
}

function formatDuration(ms) {
  if (ms < 1000)  return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m${Math.floor((ms % 60000) / 1000)}s`;
}