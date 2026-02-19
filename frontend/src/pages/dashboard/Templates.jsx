// =====================================================
// src/pages/dashboard/Templates.jsx
// =====================================================
import { useState, useEffect, useMemo } from "react";
import { T, styles } from "../../theme";
import Modal from "../../components/Modal";
import client from "../../api/client";
import { Plus, Eye, Edit2, Trash2, Save, X, Copy, Check, FileText, MailOpen, Info, Mail, Users, FileSpreadsheet, LayoutList, ShieldCheck, Sparkles } from "lucide-react";
import TemplatePreviewModal from "../../components/ui/TemplatePreviewModal";
import CustomBadge from "../../components/ui/CustomBadge";

const tabs = [
  { id: "tous",   label: "Tous",               icon: LayoutList  },
  { id: "system", label: "Système",             icon: ShieldCheck },
  { id: "custom", label: "Mes templates",       icon: Sparkles    },
];

export default function Templates() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ed, setEd] = useState(null); // null | "new" | id
  const [form, setForm] = useState({ name: "", subject: "", html: "" });
  const [previewData, setPreviewData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedJson, setCopiedJson] = useState(null);
  const [activeTab, setActiveTab] = useState("tous"); // manual, bulk, template

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

  function copyVarsJson(itemId, vars) {
    const json = JSON.stringify(
      Object.fromEntries(vars.map(v => [v, ""])),
      null, 2
    );
    navigator.clipboard.writeText(json);
    setCopiedJson(itemId);
    setTimeout(() => setCopiedJson(null), 2000);
  }

  // ─── Helper — extraire les variables d'un item ───────
  function extractVars(item) {
    const set = new Set();
    const regex = /\{\{(\w+)\}\}/g;
    [item.name, item.subject, item.htmlBody].forEach(field => {
      if (!field) return;
      let m;
      const r = new RegExp(regex.source, "g");
      while ((m = r.exec(field)) !== null) set.add(m[1].trim());
    });
    return Array.from(set);
  }

  const filteredList = list.filter(t => {
    if (activeTab === "tous")   return true;
    if (activeTab === "system") return t.type == "SYSTEM";
    if (activeTab === "custom") return t.type != "SYSTEM";
    return true;
  });

  console.log(filteredList)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ color: T.text, fontSize: 28, fontWeight: 700, margin: 0 }}>Modèles et templates</h1>
          <p style={{ color: T.textSub, fontSize: 14, margin: "4px 0 0" }}>
            Gérez et créér vos templates avec des variables un ou plusieurs variables
          </p>
        </div>
        <button
          onClick={() => { setEd("new"); setForm({ name: "", subject: "", html: "" }); }}
          style={{
            ...styles.btnGray,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <Plus size={16} />
          Nouveau
        </button>
      </div>

      <div style={{ display:"flex", background:"#fff" , padding:5, border:'1px solid rgb(226, 230, 235)', borderRadius : 6 }}>
        <div style={{ display:"flex", background:"#f1f5f9", padding :3 , borderRadius : 6}}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                padding:"10px 14px", borderRadius:6, border:"none", cursor:"pointer",
                fontSize:".9rem", fontWeight:700,
                background: isActive ? "#fff" : "transparent",
                color: isActive ? T.primary : T.textSub,
                boxShadow: isActive ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                transition:"all .15s",
                borderBottom : 'none'
              }}>
              <Icon size={15}/>
              {tab.label}
            </button>
          );
        })}
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.danger, fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      <TemplatePreviewModal
        previewData={previewData}
        onClose={() => setPreviewData(null)}
      />
      
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
                  ...styles.btnGray,
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
                  color: "#ef4444",
                  border: "1px solid #fca5a5",
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 500,
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
          {filteredList.length === 0 ? (
            <div style={{ ...styles.card, padding: 40, textAlign: "center", gridColumn: "1 / -1" }}>
              <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>Aucun template créé</p>
              <p style={{ color: T.textMuted, fontSize: 12, margin: "4px 0 0" }}>
                Créez votre premier template pour gagner du temps
              </p>
            </div>
          ) : (
            filteredList.map((t) => {

              const vars = extractVars(t);

              return (
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
                    <h3 
                    className="truncate max-w-[150px] inline-block"
                    style={{
                      color: T.text,
                      fontSize: 16,
                      fontWeight: 700,
                      margin: 0,
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      <>
                        {t.type === "SYSTEM" ? (
                          <MailOpen size={16} className="inline mr-1" />
                        ) : (
                          <Mail size={16} className="inline mr-1" />
                        )}
                        {t.name}
                      </>
                    </h3>

                    <CustomBadge status={t.type}></CustomBadge>
                    
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
                    <FileText size={16} />
                    <span style={{ fontStyle: "normal" }}>{t.subject}</span>
                  </p>
                </div>

                {/* Variables de cet item */}
                {vars.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 , padding : 15, paddingBottom : 2}}>

                    {/* Badges + bouton copier */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {vars.map((v, i) => (
                        <span key={i} style={{
                          background: "#eff6ff", color: T.primary,
                          border: `1px solid ${T.primary}30`,
                          padding: "2px 8px", borderRadius: 99,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {`${v}`}
                        </span>
                      ))}

                      {/* Bouton copier avec tooltip */}
                      <div style={{ position: "relative", marginLeft: "auto" }}>
                        <button
                          onClick={() => copyVarsJson(t.id, vars)}
                          title="Copier en JSON"
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "3px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                            background: copiedJson === t.id ? "#f0fdf4" : "#fff",
                            color: copiedJson === t.id ? "#10b981" : T.textSub,
                            cursor: "pointer", fontSize: 11, fontWeight: 600,
                            transition: "all .15s",
                          }}>
                          {copiedJson === t.id
                            ? <><Check size={11}/> Copié !</>
                            : <><Copy size={11}/> Copier JSON</>
                          }
                        </button>

                        {/* Tooltip preview */}
                        {copiedJson === t.id && (
                          <div style={{
                            position: "absolute", bottom: "calc(100% + 6px)", right: 0,
                            background: "#1e293b", color: "#fff", borderRadius: 8,
                            padding: "8px 12px", fontSize: 11, whiteSpace: "pre",
                            boxShadow: "0 4px 12px rgba(0,0,0,.2)", zIndex: 10,
                            fontFamily: "monospace", lineHeight: 1.6,
                          }}>
                            {JSON.stringify(Object.fromEntries(vars.map(v => [v, ""])), null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: T.textSub, fontStyle: "italic" }}>
                    Aucune variable
                  </span>
                )}
                

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

                    <div style={{ justifySelf: "end" }}>
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
                      <CustomBadge status={'ACTIVE'}></CustomBadge>
                      
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
                      background: T.primaryLight,
                      color: T.primary,
                      border: `1px solid ${T.primaryGray}`,
                      borderRadius: 8,
                      padding: "8px 10px",
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
                      // e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = `0 6px 16px ${T.primary}40`;
                    }}
                    onMouseLeave={(e) => {
                      // e.currentTarget.style.transform = "translateY(0)";
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
                          border: `1px solid ${T.primary}`,
                          borderRadius: 8,
                          padding: "8px 10px",
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
                          border: `1px solid ${T.danger}`,
                          borderRadius: 8,
                          padding: "8px 10px",
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
            )
            })
            
          )}
        </div>
      )}
    </div>
  );
}