// =====================================================
// src/pages/dashboard/Templates.jsx
// =====================================================
import { useState } from "react";
import { T, styles } from "../../theme";
import Modal from "../../components/Modal";

const initTemplates = [
  { id: "t1", name: "Bienvenue",    subject: "Bienvenue sur {{platform}}!", html: "<h1>Bonjour {{name}}</h1><p>Bienvenue sur {{platform}}. Votre compte est prêt !</p>", type: "PERSONAL" },
  { id: "t2", name: "Reset MP",     subject: "Réinitialiser votre MP",      html: "<p>Cliquez <a href='{{link}}' style='color:#6366f1'>ici</a> pour réinitialiser. Ce lien expire dans 24h.</p>", type: "PERSONAL" },
  { id: "t3", name: "Confirmation", subject: "Commande #{{orderId}}",       html: "<h2>✅ Confirmée</h2><p><b>Produit :</b> {{product}}<br/><b>Montant :</b> {{amount}} €</p>", type: "PERSONAL" },
  { id: "t4", name: "Newsletter",   subject: "Newsletter — {{month}}",      html: "<h1>📬 Newsletter {{month}}</h1><p>{{content}}</p><hr/><p style='color:#94a3b8;font-size:12px'>— {{sender}}</p>", type: "SYSTEM" },
];

export default function Templates() {
  const [list, setList]       = useState(initTemplates);
  const [ed, setEd]           = useState(null);                          // null | "new" | id
  const [form, setForm]       = useState({ name: "", subject: "", html: "" });
  const [previewData, setPreviewData] = useState(null);                 // null | { name, subject, html }

  function save() {
    if (ed === "new") setList([...list, { id: "t" + Date.now(), ...form, type: "PERSONAL" }]);
    else              setList(list.map((t) => t.id === ed ? { ...t, ...form } : t));
    setEd(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          {/* <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Templates</h1> */}
          <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>Créez des templates avec des variables {"{{variable}}"}</p>
        </div>
        <button onClick={() => { setEd("new"); setForm({ name: "", subject: "", html: "" }); }} style={styles.btnSm}>+ Nouveau</button>
      </div>

      {/* Modal Preview */}
      <Modal open={!!previewData} onClose={() => setPreviewData(null)} title={previewData?.name || ""}>
        <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 12px" }}><strong>Subject :</strong> {previewData?.subject}</p>
        <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, color: T.text, fontSize: 14, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: previewData?.html || "" }} />
      </Modal>

      {/* Formulaire edit / new */}
      {ed && (
        <div style={{ ...styles.card, padding: 20, border: `1.5px solid ${T.primary}` }}>
          <p style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: "0 0 14px" }}>{ed === "new" ? "Nouveau template" : "Éditer template"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.name}    onChange={(e) => setForm({ ...form, name: e.target.value })}    placeholder="Nom du template"          style={styles.input} />
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Sujet ({{variable}})"     style={styles.input} />
            <textarea value={form.html} onChange={(e) => setForm({ ...form, html: e.target.value })}    placeholder="<h1>Contenu HTML...</h1>" rows={5} style={{ ...styles.input, resize: "vertical", fontFamily: "monospace", fontSize: 12, padding: "10px 13px" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={save}                                                       style={styles.btnSm}>💾 Sauvegarder</button>
              <button onClick={() => setPreviewData({ name: form.name, subject: form.subject, html: form.html })} style={{ ...styles.btnSm, background: T.primaryLight, color: T.primary }}>👁 Aperçu</button>
              <button onClick={() => setEd(null)}                                          style={{ ...styles.btnSm, background: T.bg, color: T.textSub }}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Grille de templates */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 12 }}>
        {list.map((t) => (
          <div key={t.id} style={{ ...styles.card, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: 0 }}>{t.name}</p>
              <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 12, background: t.type === "SYSTEM" ? T.primaryLight : "#f3e8ff", color: t.type === "SYSTEM" ? T.primary : "#7c3aed" }}>{t.type}</span>
            </div>
            <p style={{ color: T.textSub, fontSize: 12, margin: 0, fontStyle: "italic" }}>{t.subject}</p>
            <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
              <button onClick={() => setPreviewData(t)}                                                   style={{ ...styles.btnSm, background: T.primaryLight,  color: T.primary }}>👁 Voir</button>
              {t.type !== "SYSTEM" && <>
                <button onClick={() => { setEd(t.id); setForm({ name: t.name, subject: t.subject, html: t.html }); }} style={{ ...styles.btnSm, background: "#f3e8ff",        color: "#7c3aed" }}>✏️</button>
                <button onClick={() => setList(list.filter((x) => x.id !== t.id))}                        style={{ ...styles.btnSm, background: T.dangerLight,  color: T.danger }}>🗑</button>
              </>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}