import { useState, useMemo } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import Modal from "../Modal";
import { T } from "../../theme";

const DEVICES = [
  { id: "desktop", icon: Monitor,    label: "Bureau",   width: "100%" },
  { id: "tablet",  icon: Tablet,     label: "Tablette", width: 600    },
  { id: "mobile",  icon: Smartphone, label: "Mobile",   width: 375    },
];

function extractVariables(fields) {
  const set = new Set();
  const regex = /{{\s*([^}]+)\s*}}/g;
  fields.forEach(f => {
    if (!f) return;
    let m;
    const r = new RegExp(regex.source, "g");
    while ((m = r.exec(f)) !== null) set.add(m[1].trim());
  });
  return Array.from(set);
}

export default function TemplatePreviewModal({ previewData, onClose }) {
  const [device, setDevice] = useState("desktop");

  const variables = useMemo(() =>
    previewData ? extractVariables([previewData.name, previewData.subject, previewData.htmlBody]) : []
  , [previewData]);

  const current = DEVICES.find(d => d.id === device);

  // Toggle device : désactive icône du device actif, active le suivant
  const DeviceToggle = (
    <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3, gap:2 }}>
      {DEVICES.map(({ id, icon: Icon, label }) => {
        const active = device === id;
        return (
          <button key={id} onClick={() => setDevice(id)} title={label}
            style={{
              display:"flex", alignItems:"center", gap:5,
              padding:"6px 10px", borderRadius:6, border:"none", cursor:"pointer",
              fontSize:12, fontWeight:500,
              background: active ? "#fff" : "transparent",
              color:      active ? T.primary : T.textSub,
              boxShadow:  active ? "0 1px 4px rgba(0,0,0,.08)" : "none",
              transition: "all .15s",
            }}>
            <Icon size={14}/>
            {active && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <Modal
      open={!!previewData}
      onClose={onClose}
      title={previewData?.name || "Aperçu du template"}
      subtitle={previewData?.subject ? `Sujet : ${previewData.subject}` : undefined}
      size="xl"
      footer={
        <span style={{ fontSize:12, color:T.textSub }}>
          Résolution : {typeof current.width === "number" ? `${current.width}px` : "plein écran"}
        </span>
      }
    >
      {previewData && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* ── Toggle device ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
            <span style={{ fontSize:13, color:T.textSub, fontWeight:500 }}>Mode d'affichage</span>
            {DeviceToggle}
          </div>

          {/* ── Variables ── */}
          {variables.length > 0 && (
            <div style={{
              padding:"10px 14px", borderRadius:8,
              background:"#eff6ff", border:`1px solid ${T.primary}20`,
            }}>
              <p style={{ margin:"0 0 8px", fontSize:12, fontWeight:600, color:T.primary }}>
                Variables utilisées
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {variables.map((v, i) => (
                  <span key={i} style={{
                    background:"#fff", color:T.primary,
                    border:`1px solid ${T.primary}30`,
                    padding:"2px 8px", borderRadius:99,
                    fontSize:11, fontWeight:600,
                  }}>
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Aperçu HTML responsive ── */}
          <div style={{
            background:"#e2e8f0", borderRadius:10,
            padding: device === "desktop" ? 0 : "16px",
            display:"flex", justifyContent:"center",
            minHeight: 400, overflow:"hidden",
            transition:"all .3s",
          }}>
            <div style={{
              width: typeof current.width === "number" ? current.width : "100%",
              maxWidth: "100%",
              background:"#fff",
              borderRadius: device !== "desktop" ? 12 : 0,
              boxShadow: device !== "desktop" ? "0 8px 32px rgba(0,0,0,.15)" : "none",
              overflow:"hidden",
              transition:"width .3s ease",
              flexShrink: 0,
            }}>
              <iframe
                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>body{margin:0;padding:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#1e293b;background:#fff}*{box-sizing:border-box}</style></head><body>${previewData.htmlBody || "<p style='color:#94a3b8'>Aucun contenu</p>"}</body></html>`}
                style={{ width:"100%", minHeight:380, border:"none", display:"block" }}
                sandbox="allow-same-origin"
                title="Aperçu email"
              />
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
}