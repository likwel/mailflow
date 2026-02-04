// =====================================================
// src/pages/landing/Docs.jsx
// =====================================================
import { useState } from "react";
import { T, styles } from "../../theme";
import {
  FiKey,
  FiMail,
  FiFileText,
  FiUsers,
  FiZap,
  FiShield
} from "react-icons/fi";

const DOCS = [
  {
    title: "Authentication",
    icon: FiKey,
    desc: "Passez votre API Key via le header X-API-Key ou comme Bearer token dans Authorization. La clé est générée une seule fois dans votre dashboard.",
    code: 'fetch("/api/v1/send", {\n  headers: { "X-API-Key": "mfk_live_..." }\n})'
  },
  {
    title: "Send Email",
    icon: FiMail,
    desc: "Endpoint principal pour envoyer un ou plusieurs emails. Utilisez du HTML, du texte brut, ou un template.",
    code: 'POST /api/v1/send\n{\n  "to": ["dest@email.com"],\n  "subject": "Hello",\n  "html": "<p>Contenu</p>"\n}'
  },
  {
    title: "Templates",
    icon: FiFileText,
    desc: "Créez des templates réutilisables avec des variables dynamiques au format {{variable}}. Elles sont remplacées en temps réel lors de l'envoi.",
    code: '// Template: <h1>Bonjour {{name}}</h1>\n{\n  "templateId": "tmpl_abc123",\n  "to": ["user@email.com"],\n  "variables": { "name": "Marie" }\n}'
  },
  {
    title: "Bulk Sending",
    icon: FiUsers,
    desc: "Passez un tableau dans le champ to. Chaque destinataire reçoit un email individuel. Les envois sont groupés par un bulkGroupId.",
    code: '{\n  "to": ["user1@email.com", "user2@email.com"],\n  "subject": "Newsletter",\n  "html": "<p>Contenu</p>"\n}'
  },
  {
    title: "Rate Limits",
    icon: FiZap,
    desc: "L\'API est limitée à 10 requêtes par minute par clé. En cas de dépassement vous recevez un HTTP 429 avec un header Retry-After.",
    code: '// Réponse 429:\n{\n  "error": "Limite dépassée",\n  "retryAfter": 45\n}'
  },
  {
    title: "Error Handling",
    icon: FiShield,
    desc: "Les erreurs retournent un JSON avec un champ error. Codes utilisés : 400 (validation), 401 (auth), 403 (quota), 429 (rate limit), 500 (interne).",
    code: '{\n  "error": "Le champ to est requis"\n}\n// Quota:\n{\n  "error": "Quota mensuel dépassé",\n  "used": 100, "limit": 100\n}'
  },
];


export default function Docs() {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ paddingTop: 64, minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "72px 24px" }}>
        <h1 style={{ color: T.text, fontSize: 38, fontWeight: 700, margin: "0 0 10px" }}>Documentation</h1>
        <p style={{ color: T.textSub, fontSize: 15, margin: "0 0 40px" }}>Tout ce que vous devez savoir pour intégrer MailFlow.</p>

        {/* Accordion */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DOCS.map((d, i) => (
            <div key={i} style={{ ...styles.card, overflow: "hidden", border: `1px solid ${open === i ? T.primary : T.border}` }}>
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                style={{ width: "100%", background: open === i ? T.primaryLight : "#fff", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, padding: "16px 20px", textAlign: "left" }}
              >
                <span style={{ fontSize: 20 }}><d.icon fontSize={25} color="#6366f1"/></span>
                <span style={{ color: open === i ? T.primary : T.text, fontSize: 15, fontWeight: 600, flex: 1 }}>{d.title}</span>
                <span style={{ color: T.textMuted, fontSize: 16, transform: open === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▼</span>
              </button>

              {open === i && (
                <div style={{ padding: "0 20px 20px" }}>
                  <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.7, margin: "0 0 14px" }}>{d.desc}</p>
                  <div style={{ background: "#f1f5f9", border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 18px" }}>
                    <pre style={{ margin: 0, color: "#334155", fontSize: 12, lineHeight: 1.8, overflowX: "auto" }}>{d.code}</pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reference Table */}
        <div style={{ marginTop: 56 }}>
          <h2 style={{ color: T.text, fontSize: 20, fontWeight: 600, margin: "0 0 16px" }}>Référence rapide</h2>
          <div style={{ ...styles.card, overflow: "hidden" }}>
            {[
              ["Méthode", "Endpoint", "Description"],
              ["POST",    "/api/v1/send", "Envoyer un email"],
            ].map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", padding: "11px 18px", background: i === 0 ? T.primaryLight : "#fff", borderBottom: `1px solid ${T.border}` }}>
                {row.map((cell, j) => (
                  <span key={j} style={{ color: i === 0 ? T.primary : (j === 0 ? T.primary : T.text), fontSize: i === 0 ? 11 : 13, fontWeight: i === 0 ? 600 : 400, textTransform: i === 0 ? "uppercase" : "none", fontFamily: j <= 1 ? "monospace" : "inherit" }}>
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}