// src/components/automations/CustomNode.jsx
import { Handle, Position } from "reactflow";
import { useState } from "react";
import {
  Zap, Clock, Mail, GitBranch, Tag, Globe,
  Trash2, Settings, CheckCircle, XCircle, Loader
} from "lucide-react";

const NODE_CONFIG = {
  trigger:   { icon: Zap,       color: "#f59e0b", bg: "#fef3c7", label: "Déclencheur" },
  delay:     { icon: Clock,     color: "#6366f1", bg: "#ede9fe", label: "Délai"       },
  email:     { icon: Mail,      color: "#0891b2", bg: "#e0f2fe", label: "Email"       },
  condition: { icon: GitBranch, color: "#10b981", bg: "#d1fae5", label: "Condition"   },
  tag:       { icon: Tag,       color: "#8b5cf6", bg: "#ede9fe", label: "Tag"         },
  webhook:   { icon: Globe,     color: "#ef4444", bg: "#fee2e2", label: "Webhook"     },
};

const STATUS_ICON = {
  running: <Loader    size={11} color="#6366f1" style={{ animation: "spin 1s linear infinite" }}/>,
  success: <CheckCircle size={11} color="#10b981"/>,
  error:   <XCircle   size={11} color="#ef4444"/>,
};

export default function CustomNode({ data, selected }) {
  const [showConfig, setShowConfig] = useState(false);
  const cfg = NODE_CONFIG[data.type] || NODE_CONFIG.trigger;
  const Icon = cfg.icon;
  const statusIcon = STATUS_ICON[data.status];

  return (
    <div style={{ position: "relative" }}>
      {/* Handle entrée (haut) — pas sur trigger */}
      {data.type !== "trigger" && (
        <Handle
          type="target" position={Position.Top}
          style={{ width: 12, height: 12, background: cfg.color, border: "2px solid #fff", top: -6 }}
        />
      )}

      {/* Carte */}
      <div style={{
        width: 170, background: "#fff",
        border: `1px solid ${selected ? cfg.color : data.status === "error" ? "#ef4444" : "#e2e8f0"}`,
        borderRadius: 12,
        boxShadow: selected
          ? `0 0 0 3px ${cfg.color}30, 0 8px 24px rgba(0,0,0,.12)`
          : "0 2px 8px rgba(0,0,0,.07)",
        overflow: "hidden",
        transition: "border-color .15s, box-shadow .15s",
        fontFamily: "sans-serif",
      }}>

        {/* Barre couleur top */}
        <div style={{ height: 2, background: cfg.color }}/>

        {/* Corps */}
        <div style={{ padding: "5px 10px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: cfg.bg, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={17} color={cfg.color}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 8, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5 }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: 8, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {data.label}
            </div>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <button
              onClick={() => setShowConfig(o => !o)}
              style={{ ...iconBtn, background: showConfig ? cfg.bg : "transparent", color: showConfig ? cfg.color : "#94a3b8" }}>
              <Settings size={12}/>
            </button>
            <button
              onClick={() => data.onDelete?.()}
              style={{ ...iconBtn, color: "#94a3b8" }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}>
              <Trash2 size={12}/>
            </button>
          </div>
        </div>

        {/* Status bar */}
        {data.status && data.status !== "idle" && (
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 12px",
            background: data.status === "success" ? "#f0fdf4" : data.status === "error" ? "#fff1f2" : "#eff6ff",
            borderTop: "1px solid #f1f5f9",
            fontWeight : "bold",
          }}>
            {statusIcon}
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: data.status === "success" ? "#10b981" : data.status === "error" ? "#ef4444" : "#6366f1"
            }}>
              {data.status === "running" ? "En cours..." : data.status === "success" ? "Succès" : "Erreur"}
            </span>
          </div>
        )}
      </div>

      {/* Panel config inline */}
      {showConfig && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute", top: "calc(100% + 8px)", left: 0, width: 200,
            background: "#fff", border: `1px solid ${cfg.color}40`,
            borderRadius: 10, padding: 12, zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          }}>
          <p style={{ margin: "0 0 8px", fontSize: 8, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            Configuration
          </p>
          <NodeConfig type={data.type} config={data.config || {}} onChange={cfg => data.onConfigChange?.(cfg)}/>
        </div>
      )}

      {/* Handle sortie (bas) */}
      <Handle
        type="source" position={Position.Bottom}
        style={{ width: 12, height: 12, background: cfg.color, border: "2px solid #fff", bottom: -6 }}
      />

      {/* condition : 2 sorties (oui/non) */}
      {data.type === "condition" && (
        <>
          <Handle id="yes" type="source" position={Position.Left}
            style={{ width: 12, height: 12, background: "#10b981", border: "2px solid #fff", left: -6 }}/>
          <Handle id="no"  type="source" position={Position.Right}
            style={{ width: 12, height: 12, background: "#ef4444", border: "2px solid #fff", right: -6 }}/>
        </>
      )}

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function NodeConfig({ type, config, onChange }) {
  const set = (k, v) => onChange({ ...config, [k]: v });
  const inp = { width: "100%", padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 10, outline: "none", boxSizing: "border-box", marginBottom: 6 };

  if (type === "email") return (
    <input value={config.subject||""} onChange={e=>set("subject",e.target.value)} placeholder="Sujet" style={inp}/>
  );
  if (type === "delay") return (
    <div style={{ display:"flex", gap:4 }}>
      <input type="number" value={config.duration||1} min={1} onChange={e=>set("duration",+e.target.value)} style={{ ...inp, width:60 }}/>
      <select value={config.unit||"day"} onChange={e=>set("unit",e.target.value)} style={inp}>
        <option value="minute">min</option>
        <option value="hour">heure(s)</option>
        <option value="day">jour(s)</option>
      </select>
    </div>
  );
  if (type === "trigger") return (
    <select value={config.event||""} onChange={e=>set("event",e.target.value)} style={inp}>
      <option value="contact.created">Nouveau contact</option>
      <option value="contact.tagged">Tag ajouté</option>
      <option value="email.opened">Email ouvert</option>
      <option value="email.clicked">Lien cliqué</option>
    </select>
  );
  if (type === "condition") return (<>
    <input value={config.field||""}    onChange={e=>set("field",e.target.value)}    placeholder="Champ"  style={inp}/>
    <select value={config.operator||"eq"} onChange={e=>set("operator",e.target.value)} style={inp}>
      <option value="eq">est égal à</option>
      <option value="contains">contient</option>
      <option value="gt">supérieur à</option>
    </select>
    <input value={config.value||""}    onChange={e=>set("value",e.target.value)}    placeholder="Valeur" style={inp}/>
  </>);
  if (type === "tag")     return <input value={config.tag||""} onChange={e=>set("tag",e.target.value)} placeholder="Nom du tag" style={inp}/>;
  if (type === "webhook") return <input value={config.url||""} onChange={e=>set("url",e.target.value)} placeholder="https://..." style={inp}/>;
  return null;
}

const iconBtn = {
  width: 22, height: 22, borderRadius: 5,
  border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all .15s",
};