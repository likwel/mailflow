import { useState, useEffect, useRef } from "react";
import EmailEditor from "react-email-editor";

export default function EmailBuilderModal({ open, onClose, onSave, initialData }) {
  const editorRef = useRef(null);
  const [name, setName]       = useState("");
  const [subject, setSubject] = useState("");
  const [editorReady, setEditorReady] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialData?.name || "");
      setSubject(initialData?.subject || "");
      setEditorReady(false);
    }
  }, [open]);

  // Charge le design existant quand l'éditeur est prêt
  const handleReady = () => {
    setEditorReady(true);
    if (initialData?.design) {
      editorRef.current?.editor?.loadDesign(initialData.design);
    }
  };

  const handleSave = () => {
    if (!name.trim())    return alert("Le nom est requis.");
    if (!subject.trim()) return alert("Le sujet est requis.");

    editorRef.current?.editor?.exportHtml(({ design, html }) => {
      onSave({ name, subject, design, html });
      onClose();
    });
  };

  if (!open) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>✉️ {initialData?.name ? "Modifier le template" : "Nouveau template"}</span>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Champs */}
        <div style={styles.fields}>
          <div style={styles.field}>
            <label style={styles.label}>Nom du template</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Bienvenue client"
              style={styles.input}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Sujet de l'email</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Bienvenue sur Mailflow 🎉"
              style={styles.input}
            />
          </div>
        </div>

        {/* Builder Unlayer */}
        <div style={styles.builderWrapper}>
          {!editorReady && (
            <div style={styles.loader}>⏳ Chargement de l'éditeur...</div>
          )}
          <EmailEditor
            ref={editorRef}
            className = "andrans"
            onReady={handleReady}
            style={{ height: "100vh", display: editorReady ? "flex" : "none" }}
            options={{
              locale: "fr-FR",
              appearance: { theme: "light" },
              features: { preview: true },
            }}
          />
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Annuler</button>
          <button onClick={handleSave} disabled={!editorReady} style={{
            ...styles.saveBtn,
            opacity: editorReady ? 1 : 0.5,
            cursor: editorReady ? "pointer" : "not-allowed",
          }}>
            💾 Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1000,
    background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "#fff", borderRadius: 12,
    width: "95vw", maxWidth: 1200,
    height: "92vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: "1px solid #e5e7eb", flexShrink: 0,
  },
  title: { fontWeight: 700, fontSize: 16, color: "#1f2937" },
  closeBtn: {
    background: "none", border: "none", fontSize: 18,
    cursor: "pointer", color: "#6b7280", lineHeight: 1,
  },
  fields: {
    display: "flex", gap: 16, padding: "12px 20px",
    borderBottom: "1px solid #e5e7eb", flexShrink: 0,
  },
  field:  { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  label:  { fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em" },
  input:  { padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 14, outline: "none" },
  builderWrapper: { flex: 1, overflow: "hidden", position: "relative", height:"100%" },
  loader: {
    position: "absolute", inset: 0, display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "#9ca3af", fontSize: 14,
  },
  footer: {
    display: "flex", justifyContent: "flex-end", gap: 10,
    padding: "12px 20px", borderTop: "1px solid #e5e7eb", flexShrink: 0,
  },
  cancelBtn: {
    padding: "8px 18px", border: "1px solid #e5e7eb",
    borderRadius: 7, cursor: "pointer", fontSize: 14, background: "#fff", color: "#374151",
  },
  saveBtn: {
    padding: "8px 20px", background: "#6366f1", color: "#fff",
    border: "none", borderRadius: 7, fontWeight: 600, fontSize: 14,
  },
};