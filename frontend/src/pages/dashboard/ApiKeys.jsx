// =====================================================
// src/pages/dashboard/ApiKeys.jsx
// =====================================================
import { useState } from "react";
import { T, styles } from "../../theme";

const initKeys = [
  { id: "ak1", name: "Production", prefix: "sk_live_Ab3dF...", active: true,  used: "30 jan." },
  { id: "ak2", name: "Staging",    prefix: "sk_live_Xk9mP...", active: true,  used: "28 jan." },
  { id: "ak3", name: "Test",       prefix: "sk_live_Yz2qR...", active: false, used: null },
];

export default function ApiKeys() {
  const [keys, setKeys]     = useState(initKeys);
  const [showForm, setForm] = useState(false);
  const [name, setName]     = useState("");
  const [raw, setRaw]       = useState(null);
  const [copied, setCopied] = useState(false);

  function add() {
    if (!name.trim()) return;
    const r = "sk_live_" + Math.random().toString(36).slice(2, 28);
    setRaw(r);
    setKeys([...keys, { id: "ak" + Date.now(), name, prefix: r.slice(0, 16) + "...", active: true, used: null }]);
    setName("");
    setForm(false);
  }

  function toggle(id) { setKeys(keys.map((k) => k.id === id ? { ...k, active: !k.active } : k)); }
  function remove(id) { setKeys(keys.filter((k) => k.id !== id)); }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {/* <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>API Keys</h1> */}
          <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>Gérez vos clés d'authentification</p>
        </div>
        <button onClick={() => setForm(true)} style={styles.btnSm}>+ Nouvelle clé</button>
      </div>

      {/* Alerte: clé générée */}
      {raw && (
        <div style={{ background: T.successLight, border: "1px solid #bbf7d0", borderRadius: T.radius, padding: "14px 18px" }}>
          <p style={{ color: T.success, fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>✅ Clé créée ! Copiez-la maintenant, elle ne sera plus affichée.</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ flex: 1, background: "#fff", border: `1px solid ${T.border}`, padding: "7px 11px", borderRadius: 7, color: T.primary, fontSize: 12, wordBreak: "break-all" }}>{raw}</code>
            <button onClick={() => { navigator.clipboard.writeText(raw); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ ...styles.btnSm, background: copied ? T.success : T.primary, whiteSpace: "nowrap" }}>
              {copied ? "✓ Copié" : "📋 Copier"}
            </button>
          </div>
          <button onClick={() => setRaw(null)} style={{ background: "none", border: "none", color: T.textSub, fontSize: 11, cursor: "pointer", marginTop: 6, padding: 0 }}>Fermer</button>
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div style={{ ...styles.card, padding: 18, border: `1.5px solid ${T.primary}` }}>
          <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>Nouvelle API Key</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Nom (ex: Production)" style={{ ...styles.input, flex: 1 }} />
            <button onClick={add}                                          style={styles.btnSm}>Créer</button>
            <button onClick={() => setForm(false)} style={{ ...styles.btnSm, background: T.bg, color: T.textSub }}>✕</button>
          </div>
        </div>
      )}

      {/* Liste */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {keys.map((k) => (
          <div key={k.id} style={{ ...styles.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{k.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: k.active ? T.successLight : T.bg, color: k.active ? T.success : T.textSub }}>
                  {k.active ? "ACTIVE" : "INACTIF"}
                </span>
              </div>
              <code style={{ color: T.textMuted, fontSize: 12 }}>{k.prefix}</code>
              {k.used && <span style={{ color: T.textMuted, fontSize: 11, marginLeft: 10 }}>Utilisée le {k.used}</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => toggle(k.id)} style={{ ...styles.btnSm, background: k.active ? T.warningLight : T.successLight, color: k.active ? T.warning : T.success }}>
                {k.active ? "Désactiver" : "Activer"}
              </button>
              <button onClick={() => remove(k.id)} style={{ ...styles.btnSm, background: T.dangerLight, color: T.danger }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}