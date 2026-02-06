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
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  // border: `1px solid ${T.border}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.primary;
                  e.currentTarget.style.boxShadow = `0 8px 24px ${T.primary}20`;
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Header avec gradient */}
                <div style={{
                  background: t.type === "SYSTEM"
                    ? `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primaryLight}dd 100%)`
                    : "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
                  padding: "16px 20px",
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8
                  }}>
                    <h3 style={{
                      color: T.text,
                      fontSize: 16,
                      fontWeight: 700,
                      margin: 0,
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      {t.type === "SYSTEM" ? "📧" : "✉️"} {t.name}
                    </h3>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 16,
                        background: t.type === "SYSTEM" ? T.primary : "#7c3aed",
                        color: "#fff",
                        flexShrink: 0,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        boxShadow: t.type === "SYSTEM"
                          ? `0 2px 8px ${T.primary}40`
                          : "0 2px 8px #7c3aed40",
                      }}
                    >
                      {t.type === "SYSTEM" ? "Système" : "Custom"}
                    </span>
                  </div>

                  <p style={{
                    color: T.textSub,
                    fontSize: 13,
                    margin: 0,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}>
                    <span style={{ fontSize: 16 }}>📝</span>
                    <span style={{ fontStyle: "italic" }}>{t.subject}</span>
                  </p>
                </div>

                {/* Content */}
                <div style={{ padding: "16px 10px", flex: 1 }}>
                  {/* ID avec amélioration visuelle */}
                  <div style={{
                    marginBottom: 16,
                    padding: "10px 12px",
                    background: `linear-gradient(135deg, ${T.bg} 0%, #fafbfc 100%)`,
                    borderRadius: 10,
                    border: `1px solid ${T.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: 10,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 4
                      }}>
                        ID du template
                      </span>
                      <code style={{
                        fontSize: 12,
                        color: T.text,
                        fontFamily: "monospace",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block"
                      }}>
                        {t.id}
                      </code>
                    </div>

                    <button
                      onClick={() => copyId(t.id)}
                      style={{
                        background: copiedId === t.id ? T.success + "15" : "transparent",
                        border: `1px solid ${copiedId === t.id ? T.success : T.border}`,
                        borderRadius: 8,
                        cursor: "pointer",
                        padding: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        color: copiedId === t.id ? T.success : T.textSub,
                        fontSize: 11,
                        fontWeight: 600,
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                      title="Copier l'ID"
                      onMouseEnter={(e) => {
                        if (copiedId !== t.id) {
                          e.currentTarget.style.background = T.primaryLight;
                          e.currentTarget.style.borderColor = T.primary;
                          e.currentTarget.style.color = T.primary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedId !== t.id) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.borderColor = T.border;
                          e.currentTarget.style.color = T.textSub;
                        }
                      }}
                    >
                      {copiedId === t.id ? (
                        <>
                          <Check size={14} />
                          Copié !
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copier
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 12,
                    marginBottom: 4,
                    padding: 12,
                    background: T.bg,
                    borderRadius: 8,
                    border: `1px solid ${T.border}`
                  }}>
                    <div>
                      <span style={{
                        fontSize: 10,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 1
                      }}>
                        Type
                      </span>
                      <span style={{
                        fontSize: 13,
                        color: T.text,
                        fontWeight: 600
                      }}>
                        {t.type === "SYSTEM" ? "Email système" : "Template personnalisé"}
                      </span>
                    </div>

                    <div>
                      <span style={{
                        fontSize: 10,
                        color: T.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        display: "block",
                        marginBottom: 4
                      }}>
                        Statut
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: T.success,
                          display: "inline-block",
                          boxShadow: `0 0 8px ${T.success}60`
                        }}></span>
                        <span style={{
                          fontSize: 13,
                          color: T.success,
                          fontWeight: 600
                        }}>
                          Actif
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions footer */}
                <div style={{
                  padding: "12px 20px",
                  background: "#fafbfc",
                  borderTop: `1px solid ${T.border}`,
                  display: "flex",
                  gap: 8
                }}>
                  <button
                    onClick={() => setPreviewData(t)}
                    style={{
                      flex: 1,
                      background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "all 0.2s ease",
                      boxShadow: `0 4px 12px ${T.primary}30`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 6px 16px ${T.primary}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${T.primary}30`;
                    }}
                  >
                    <Eye size={16} />
                    Prévisualiser
                  </button>

                  {t.type !== "SYSTEM" && (
                    <>
                      <button
                        onClick={() => {
                          setEd(t.id);
                          setForm({ name: t.name, subject: t.subject, html: t.htmlBody });
                        }}
                        style={{
                          background: "transparent",
                          border: `2px solid ${T.primary}`,
                          borderRadius: 8,
                          padding: "10px 14px",
                          cursor: "pointer",
                          color: T.primary,
                          fontSize: 13,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        title="Modifier"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = T.primaryLight;
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Supprimer le template "${t.name}" ?`)) {
                            deleteTemplate(t.id);
                          }
                        }}
                        style={{
                          background: "transparent",
                          border: `2px solid ${T.danger}`,
                          borderRadius: 8,
                          padding: "10px 14px",
                          cursor: "pointer",
                          color: T.danger,
                          fontSize: 13,
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        title="Supprimer"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = T.danger + "15";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <Trash2 size={16} />
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