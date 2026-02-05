// =====================================================
// src/pages/dashboard/Templates.jsx
// =====================================================
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import Modal from "../../components/Modal";
import client from "../../api/client";
import { Plus, Eye, Edit2, Trash2, Save, X, Copy, Check } from "lucide-react";

export default function Templates() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ed, setEd] = useState(null); // null | "new" | id
  const [form, setForm] = useState({ name: "", subject: "", html: "" });
  const [previewData, setPreviewData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/dashboard/templates");
      console.log(res)
      setList(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!form.name.trim() || !form.subject.trim() || !form.html.trim()) {
      setError("Tous les champs sont requis");
      return;
    }

    setSaving(true);
    setError("");
    try {
      if (ed === "new") {
        const res = await client.post("/dashboard/templates", form);
        setList([res.data, ...list]);
      } else {
        const res = await client.put(`/dashboard/templates/${ed}`, form);
        setList(list.map(t => t.id === ed ? res.data : t));
      }
      setEd(null);
      setForm({ name: "", subject: "", html: "" });
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce template ?")) return;
    try {
      await client.delete(`/dashboard/templates/${id}`);
      setList(list.filter(t => t.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression");
    }
  }

  function copyId(id) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>
            Créez des templates avec des variables {"{{variable}}"}
          </p>
        </div>
        <button 
          onClick={() => { setEd("new"); setForm({ name: "", subject: "", html: "" }); }}
          style={{ 
            ...styles.btn, 
            display: "flex", 
            alignItems: "center", 
            gap: 6 
          }}
        >
          <Plus size={16} />
          Nouveau
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.danger, fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Modal Preview */}
      <Modal open={!!previewData} onClose={() => setPreviewData(null)} title={previewData?.name || ""}>
        
        {/* Variables extraites de name, subject et htmlBody */}
          {previewData && (
            (() => {
              const fields = [previewData.name, previewData.subject, previewData.htmlBody];
              const regex = /{{\s*([^}]+)\s*}}/g;
              const variablesSet = new Set();

              fields.forEach(field => {
                if (!field) return;
                let match;
                while ((match = regex.exec(field)) !== null) {
                  variablesSet.add(match[1].trim());
                }
              });

              const variables = Array.from(variablesSet);

              if (variables.length === 0) return null;

              return (
                <div 
                  style={{ 
                    fontSize: '1rem', 
                    color: T.textSub, 
                    marginBottom: 10, 
                    border: `1px solid ${T.primary}`,       // bordure visible
                    borderRadius: 6,                         // coins arrondis
                    padding: '10px 12px',                    // espace intérieur
                    backgroundColor: `${T.primaryLight}33`,  // fond légèrement transparent
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // légère ombre pour le relief
                  }}
                >
                  <strong>Variables utilisées :</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {variables.map((v, i) => (
                      <span 
                        key={i} 
                        style={{ 
                          background: T.primaryLight, 
                          color: T.primary, 
                          padding: "2px 6px", 
                          borderRadius: 4, 
                          fontSize: 11, 
                          fontWeight: 600 
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()
          )}
        <div 
          style={{
            padding: '14px 16px',
            border: `1px solid ${T.primary}`,
            borderRadius: 8,
            backgroundColor: `${T.primaryLight}33`, // fond légèrement transparent
            boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
            marginBottom: 16,
          }}
        >
          {/* Titre */}
          <p style={{ 
            color: T.textSub, 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            margin: "0 0 8px" 
          }}>
            <strong>Titre :</strong> {previewData?.name}
          </p>

          {/* Sujet */}
          <p style={{ 
            color: T.textSub, 
            fontWeight: 600, 
            fontSize: '1rem', 
            margin: "0 0 12px" 
          }}>
            <strong>Sujet :</strong> {previewData?.subject}
          </p>

          {/* Corps du mail */}
          <p style={{ 
            color: T.textSub, 
            fontWeight: 600, 
            fontSize: '1rem', 
            margin: "0 0 6px" 
          }}>
            <strong>Corps du mail :</strong>
          </p>
          <div style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 12,
            color: T.text,
            fontSize: 14,
            lineHeight: 1.6,
            maxHeight: 250,
            overflowY: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: previewData?.htmlBody || "" }}
          />
        </div>

      </Modal>

      {/* Formulaire edit / new */}
      {ed && (
        <div style={{ ...styles.card, padding: 20, border: `2px solid ${T.primary}` }}>
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>
            {ed === "new" ? "Nouveau template" : "Éditer template"}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
                Nom du template
              </label>
              <input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="Ex: Bienvenue" 
                disabled={saving}
                style={{ ...styles.input, opacity: saving ? 0.5 : 1 }} 
              />
            </div>

            <div>
              <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
                Sujet (utilisez {"{{variable}}"} pour des variables)
              </label>
              <input 
                value={form.subject} 
                onChange={(e) => setForm({ ...form, subject: e.target.value })} 
                placeholder="Ex: Bienvenue {{name}} !" 
                disabled={saving}
                style={{ ...styles.input, opacity: saving ? 0.5 : 1 }} 
              />
            </div>

            <div>
              <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
                Contenu HTML
              </label>
              <textarea 
                value={form.html} 
                onChange={(e) => setForm({ ...form, html: e.target.value })} 
                placeholder="<h1>Bonjour {{name}}</h1>\n<p>Contenu de votre email...</p>" 
                rows={8}
                disabled={saving}
                style={{ 
                  ...styles.input, 
                  resize: "vertical", 
                  fontFamily: "monospace", 
                  fontSize: 12, 
                  padding: "12px 14px",
                  opacity: saving ? 0.5 : 1,
                }} 
              />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button 
                onClick={save}
                disabled={saving}
                style={{ 
                  ...styles.btn, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Save size={16} />
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </button>
              
              <button 
                onClick={() => setPreviewData({ name: form.name, subject: form.subject, html: form.html, htmlBody: form.html })}
                disabled={saving}
                style={{ 
                  ...styles.btnOutline,
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                }}
              >
                <Eye size={16} />
                Aperçu
              </button>
              
              <button 
                onClick={() => { setEd(null); setForm({ name: "", subject: "", html: "" }); }}
                disabled={saving}
                style={{ 
                  ...styles.btnOutline,
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6,
                }}
              >
                <X size={16} />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ ...styles.card, padding: 40, textAlign: "center" }}>
          <p style={{ color: T.textSub, fontSize: 14 }}>Chargement des templates...</p>
        </div>
      )}

      {/* Grille de templates */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 14 }}>
          {list.length === 0 ? (
            <div style={{ ...styles.card, padding: 40, textAlign: "center", gridColumn: "1 / -1" }}>
              <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>Aucun template créé</p>
              <p style={{ color: T.textMuted, fontSize: 12, margin: "4px 0 0" }}>
                Créez votre premier template pour gagner du temps
              </p>
            </div>
          ) : (
            list.map((t) => (
              <div 
                key={t.id} 
                style={{ 
                  ...styles.card, 
                  padding: 18, 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 10 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: 0, flex: 1 }}>{t.name}</p>
                  <span 
                    style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      padding: "3px 8px", 
                      borderRadius: 12, 
                      background: t.type === "SYSTEM" ? T.primaryLight : "#f3e8ff", 
                      color: t.type === "SYSTEM" ? T.primary : "#7c3aed",
                      flexShrink: 0,
                    }}
                  >
                    {t.type}
                  </span>
                </div>
                
                <p style={{ 
                  color: T.textSub, 
                  fontSize: 12, 
                  margin: 0, 
                  fontStyle: "italic",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {t.subject}
                </p>
                
                <div style={{ marginTop: 8, padding: "6px 8px", background: T.bg, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <code style={{ fontSize: 10, color: T.textMuted, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.id}
                  </code>
                  <button
                    onClick={() => copyId(t.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 2,
                      display: "flex",
                      alignItems: "center",
                      color: copiedId === t.id ? T.success : T.textMuted,
                    }}
                    title="Copier l'ID"
                  >
                    {copiedId === t.id ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>

                <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                  <button 
                    onClick={() => setPreviewData(t)}
                    style={{ 
                      ...styles.btnOutline, 
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      fontSize: 12,
                      padding: "6px 10px",
                    }}
                  >
                    <Eye size={14} />
                    Voir
                  </button>
                  
                  {t.type !== "SYSTEM" && (
                    <>
                      <button 
                        onClick={() => { 
                          setEd(t.id); 
                          setForm({ name: t.name, subject: t.subject, html: t.htmlBody }); 
                        }}
                        style={{ 
                          ...styles.btnOutline,
                          padding: "6px 10px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Edit2 size={14} />
                      </button>
                      
                      <button 
                        onClick={() => deleteTemplate(t.id)}
                        style={{ 
                          ...styles.btnOutline,
                          borderColor: T.danger,
                          color: T.danger,
                          padding: "6px 10px",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}