// src/components/bulksend/PreviewModal.jsx
// Remplace la fonction HtmlPreview inline dans ManualTab, BulkTab et FileTab
import { useState } from "react";
import { T } from "../../theme";
import { X, Monitor, Smartphone, Tablet, Maximize2 } from "lucide-react";

function resolveVars(text, vals) {
  if (!text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] || `{{${k}}}`);
}

// ─── Bouton d'ouverture ───────────────────────────────
export function PreviewButton({ onClick, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "7px 14px",
        background: active ? "#eff6ff" : "#fff",
        border: `1px solid ${active ? T.primary : T.border}`,
        borderRadius: 8, cursor: "pointer",
        fontSize: 13, color: active ? T.primary : T.text,
        fontWeight: 500, transition: "all .15s"
      }}
    >
      <Maximize2 size={14} />
      {active ? "Fermer l'aperçu" : "Aperçu"}
    </button>
  );
}

// ─── Modal principale ─────────────────────────────────
export default function PreviewModal({ html, subject, varValues, onClose }) {
  const [device, setDevice] = useState("desktop"); // desktop | tablet | mobile

  const DEVICES = [
    { id: "desktop",  icon: <Monitor size={15}/>,    label: "Bureau",  width: "100%" },
    { id: "tablet",   icon: <Tablet size={15}/>,     label: "Tablette", width: 768 },
    { id: "mobile",   icon: <Smartphone size={15}/>, label: "Mobile",  width: 375 },
  ];

  const resolvedHtml    = resolveVars(html || "", varValues);
  const resolvedSubject = resolveVars(subject || "", varValues);
  const current = DEVICES.find(d => d.id === device);

  // Envelopper dans un template email basique si pas de <html>
  const srcDoc = resolvedHtml.trim().startsWith("<html") || resolvedHtml.trim().startsWith("<!DOCTYPE")
    ? resolvedHtml
    : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; color: #1e293b; background: #f8fafc; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>${resolvedHtml || "<p style='color:#94a3b8'>Aucun contenu à prévisualiser</p>"}</body>
</html>`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 20
    }}>
      <div style={{
        width: "100%", maxWidth: 1100,
        height: "90vh",
        background: "#fff",
        borderRadius: 16,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,.3)"
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px",
          borderBottom: `1px solid ${T.border}`,
          background: "#f8fafc", flexShrink: 0
        }}>
          {/* Dots déco */}
          <div style={{ display: "flex", gap: 6 }}>
            {["#ef4444","#f59e0b","#10b981"].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }}/>
            ))}
          </div>

          {/* Sujet */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: T.textSub, marginBottom: 1 }}>Sujet :</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {resolvedSubject || <span style={{ color: T.textSub, fontStyle: "italic" }}>Aucun sujet</span>}
            </div>
          </div>

          {/* Toggle device */}
          <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 2 }}>
            {DEVICES.map(d => (
              <button key={d.id} onClick={() => setDevice(d.id)}
                title={d.label}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 500,
                  background: device === d.id ? "#fff" : "transparent",
                  color:      device === d.id ? T.primary : T.textSub,
                  boxShadow:  device === d.id ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                  transition: "all .15s"
                }}>
                {d.icon}
                <span style={{ display: device === d.id ? "inline" : "none" }}>{d.label}</span>
              </button>
            ))}
          </div>

          {/* Fermer */}
          <button onClick={onClose}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: "#fff", border: `1px solid ${T.border}`, cursor: "pointer", color: T.text, flexShrink: 0 }}>
            <X size={16}/>
          </button>
        </div>

        {/* ── Corps ── */}
        <div style={{
          flex: 1, overflow: "hidden",
          background: "#e2e8f0",
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: device === "desktop" ? 0 : "24px 0"
        }}>
          <div style={{
            width: typeof current.width === "number" ? current.width : "100%",
            height: "100%",
            background: "#fff",
            boxShadow: device !== "desktop" ? "0 8px 32px rgba(0,0,0,.15)" : "none",
            borderRadius: device !== "desktop" ? 12 : 0,
            overflow: "hidden",
            transition: "width .3s ease",
            flexShrink: 0
          }}>
            <iframe
              srcDoc={srcDoc}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              sandbox="allow-same-origin"
              title="Aperçu email"
            />
          </div>
        </div>

        {/* ── Footer info ── */}
        <div style={{
          padding: "10px 20px",
          borderTop: `1px solid ${T.border}`,
          background: "#f8fafc",
          display: "flex", alignItems: "center", gap: 8,
          flexShrink: 0
        }}>
          <span style={{ fontSize: 12, color: T.textSub }}>
            📌 Les variables <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>{"{{...}}"}</code> sont remplacées par les valeurs par défaut saisies
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: T.textSub }}>
            Résolution : {typeof current.width === "number" ? `${current.width}px` : "plein écran"}
          </span>
        </div>
      </div>
    </div>
  );
}