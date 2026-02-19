// src/components/automations/WorkflowNode.jsx
import { useState } from "react";
import { Trash2, Settings, Zap, Clock, Mail, GitBranch, Tag, Globe, CheckCircle, XCircle, Loader } from "lucide-react";

const NODE_CONFIG = {
  trigger:   { icon: Zap,        color: "#f59e0b", bg: "#fef3c7", label: "Déclencheur" },
  delay:     { icon: Clock,      color: "#6366f1", bg: "#ede9fe", label: "Délai" },
  email:     { icon: Mail,       color: "#0891b2", bg: "#e0f2fe", label: "Email" },
  condition: { icon: GitBranch,  color: "#10b981", bg: "#d1fae5", label: "Condition" },
  tag:       { icon: Tag,        color: "#8b5cf6", bg: "#ede9fe", label: "Tag" },
  webhook:   { icon: Globe,      color: "#ef4444", bg: "#fee2e2", label: "Webhook" },
};

const STATUS_CONFIG = {
  idle:    { icon: null,         color: "#94a3b8", label: "" },
  running: { icon: Loader,       color: "#6366f1", label: "En cours...", animate: true },
  success: { icon: CheckCircle,  color: "#10b981", label: "Succès" },
  error:   { icon: XCircle,      color: "#ef4444", label: "Erreur" },
};

const NODE_WIDTH  = 200;
const NODE_HEIGHT = 80;

export default function WorkflowNode({ node, selected, onMouseDown, onDelete, onChange }) {
  const [showConfig, setShowConfig] = useState(false);
  const cfg = NODE_CONFIG[node.type] || NODE_CONFIG.trigger;
  const Icon = cfg.icon;
  const status = STATUS_CONFIG[node.status] || STATUS_CONFIG.idle;
  const StatusIcon = status.icon;

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: node.x, top: node.y,
        width: NODE_WIDTH,
        userSelect: "none",
        zIndex: selected ? 10 : 1,
      }}>

      {/* ── Carte nœud ── */}
      <div style={{
        background: "#fff",
        border: `2px solid ${selected ? cfg.color : node.status === "error" ? "#ef4444" : "#e2e8f0"}`,
        borderRadius: 12,
        boxShadow: selected
          ? `0 0 0 4px ${cfg.color}30, 0 8px 24px rgba(0,0,0,.12)`
          : "0 2px 8px rgba(0,0,0,.08)",
        transition: "border-color .15s, box-shadow .15s",
        overflow: "hidden",
        cursor: "grab",
      }}>

        {/* Barre colorée en haut */}
        <div style={{ height: 4, background: cfg.color }}/>

        {/* Corps */}
        <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: cfg.bg, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={18} color={cfg.color}/>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: .5 }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {node.label}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setShowConfig(o => !o); }}
              style={{ ...iconBtn, background: showConfig ? cfg.bg : "transparent", color: showConfig ? cfg.color : "#94a3b8" }}>
              <Settings size={13}/>
            </button>
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); onDelete(); }}
              style={{ ...iconBtn, color: "#94a3b8" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
              <Trash2 size={13}/>
            </button>
          </div>
        </div>

        {/* Status bar */}
        {node.status !== "idle" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 12px",
            background: `${status.color}12`,
            borderTop: `1px solid ${status.color}25`,
          }}>
            {StatusIcon && (
              <StatusIcon
                size={11} color={status.color}
                style={status.animate ? { animation: "spin 1s linear infinite" } : {}}
              />
            )}
            <span style={{ fontSize: 11, color: status.color, fontWeight: 600 }}>{status.label}</span>
          </div>
        )}
      </div>

      {/* Port de connexion (sortie) */}
      <div style={{
        position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", border: `2px solid ${cfg.color}`,
        cursor: "crosshair", zIndex: 2,
        boxShadow: "0 1px 4px rgba(0,0,0,.1)",
      }}/>

      {/* Port de connexion (entrée) */}
      <div style={{
        position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)",
        width: 16, height: 16, borderRadius: "50%",
        background: cfg.color, border: "2px solid #fff",
        zIndex: 2, boxShadow: "0 1px 4px rgba(0,0,0,.15)",
      }}/>

      {/* Panel config inline */}
      {showConfig && (
        <NodeConfigPanel node={node} onChange={onChange} color={cfg.color}/>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const iconBtn = {
  width: 24, height: 24, borderRadius: 6,
  border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all .15s",
};

// ── Config panel ────────────────────────────────────────────────
function NodeConfigPanel({ node, onChange, color }) {
  const cfg = node.config || {};

  function set(key, val) {
    onChange({ config: { ...cfg, [key]: val } });
  }

  return (
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
        background: "#fff", border: `1px solid ${color}40`,
        borderRadius: 10, padding: 14, zIndex: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,.12)",
      }}>
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
        Configuration
      </p>

      {node.type === "email" && <>
        <input value={cfg.subject||""} onChange={e=>set("subject",e.target.value)}
          placeholder="Sujet de l'email" style={inp}/>
      </>}

      {node.type === "delay" && (
        <div style={{ display:"flex", gap:6 }}>
          <input type="number" value={cfg.duration||1} min={1}
            onChange={e=>set("duration",+e.target.value)} style={{ ...inp, width:60 }}/>
          <select value={cfg.unit||"day"} onChange={e=>set("unit",e.target.value)} style={inp}>
            <option value="minute">min</option>
            <option value="hour">heure(s)</option>
            <option value="day">jour(s)</option>
          </select>
        </div>
      )}

      {node.type === "trigger" && (
        <select value={cfg.event||""} onChange={e=>set("event",e.target.value)} style={inp}>
          <option value="contact.created">Nouveau contact</option>
          <option value="contact.tagged">Tag ajouté</option>
          <option value="email.opened">Email ouvert</option>
          <option value="email.clicked">Lien cliqué</option>
        </select>
      )}

      {node.type === "condition" && <>
        <input value={cfg.field||""} onChange={e=>set("field",e.target.value)} placeholder="Champ" style={{ ...inp, marginBottom:6 }}/>
        <select value={cfg.operator||"eq"} onChange={e=>set("operator",e.target.value)} style={{ ...inp, marginBottom:6 }}>
          <option value="eq">est égal à</option>
          <option value="contains">contient</option>
          <option value="gt">supérieur à</option>
        </select>
        <input value={cfg.value||""} onChange={e=>set("value",e.target.value)} placeholder="Valeur" style={inp}/>
      </>}

      {node.type === "tag" && (
        <input value={cfg.tag||""} onChange={e=>set("tag",e.target.value)} placeholder="Nom du tag" style={inp}/>
      )}

      {node.type === "webhook" && (
        <input value={cfg.url||""} onChange={e=>set("url",e.target.value)} placeholder="https://..." style={inp}/>
      )}
    </div>
  );
}

const inp = {
  width: "100%", padding: "6px 10px",
  border: "1px solid #e2e8f0", borderRadius: 7,
  fontSize: 12, outline: "none", boxSizing: "border-box",
};