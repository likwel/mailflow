// =====================================================
// src/pages/dashboard/Settings.jsx
// =====================================================
import { useState } from "react";
import { T, styles } from "../../theme";

export default function Settings() {
  const [notifs, setNotifs] = useState({ failed: true, bounced: true, weekly: false });
  const [smtp, setSmtp]     = useState({ host: "smtp.gmail.com", port: "587", user: "jean@gmail.com", pass: "••••••••" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        {/* <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Settings</h1> */}
        <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>Configuration de votre compte</p>
      </div>

      {/* Profil */}
      <div style={{ ...styles.card, padding: 20 }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>👤 Profil</p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="https://i.pravatar.cc/50?img=3" alt="" style={{ width: 50, height: 50, borderRadius: "50%", border: `2px solid ${T.border}` }} />
          <div>
            <p style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: 0 }}>Jean Dupont</p>
            <p style={{ color: T.textSub, fontSize: 12, margin: "2px 0 0" }}>jean@email.com</p>
            <span style={{ display: "inline-block", marginTop: 4, background: T.primaryLight, color: T.primary, fontSize: 11, fontWeight: 600, padding: "2px 10px", borderRadius: 12 }}>Plan PRO</span>
          </div>
        </div>
      </div>

      {/* SMTP */}
      <div style={{ ...styles.card, padding: 20 }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>📧 Configuration SMTP</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["Host","host"],["Port","port"],["User","user"],["Password","pass"]].map(([label, key]) => (
            <div key={key}>
              <label style={{ color: T.textSub, fontSize: 11, display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
              <input value={smtp[key]} onChange={(e) => setSmtp({ ...smtp, [key]: e.target.value })} style={styles.input} />
            </div>
          ))}
        </div>
        <button style={{ ...styles.btnSm, marginTop: 14 }}>💾 Sauvegarder SMTP</button>
      </div>

      {/* Notifications */}
      <div style={{ ...styles.card, padding: 20 }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>🔔 Notifications</p>
        {[["failed","Alertes sur échecs d'envoi"],["bounced","Alertes sur bounces"],["weekly","Rapport hebdomadaire"]].map(([key, label]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ color: T.text, fontSize: 13 }}>{label}</span>
            <div
              onClick={() => setNotifs({ ...notifs, [key]: !notifs[key] })}
              style={{ width: 40, height: 22, borderRadius: 11, background: notifs[key] ? T.primary : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s" }}
            >
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: notifs[key] ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div style={{ ...styles.card, padding: 20, border: `1px solid #fecaca`, background: T.dangerLight }}>
        <p style={{ color: T.danger, fontSize: 14, fontWeight: 600, margin: "0 0 8px" }}>⚠️ Zone dangereuse</p>
        <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 12px" }}>Cette action supprimera votre compte et toutes vos données de manière irréversible.</p>
        <button style={{ ...styles.btnSm, background: "#fff", color: T.danger, border: `1px solid #fecaca` }}>Supprimer mon compte</button>
      </div>
    </div>
  );
}