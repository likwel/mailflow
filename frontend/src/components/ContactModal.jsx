// src/components/ContactModal.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../theme";
import client from "../api/client";
import { Mail, User, Phone, Building, Tag, List, X, Plus, Check, Save, RefreshCw } from "lucide-react";

export default function ContactModal({ contact, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    tags: [],
    listIds: []
  });
  const [tagInput, setTagInput] = useState("");
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchLists();
    if (contact) {
      setFormData({
        email: contact.email || "",
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        phone: contact.phone || "",
        company: contact.company || "",
        tags: contact.tags || [],
        listIds: contact.lists?.map(l => l.listId) || []
      });
    }
  }, [contact]);

  async function fetchLists() {
    try {
      const res = await client.get("/lists");
      setLists(res.data);
    } catch (err) {
      console.error("Error fetching lists:", err);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }

  function handleAddTag() {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  }

  function handleRemoveTag(tagToRemove) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  }

  function toggleList(listId) {
    setFormData(prev => ({
      ...prev,
      listIds: prev.listIds.includes(listId)
        ? prev.listIds.filter(id => id !== listId)
        : [...prev.listIds, listId]
    }));
  }

  function validate() {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (contact) {
        await client.put(`/contacts/${contact.id}`, formData);
      } else {
        await client.post("/contacts", formData);
      }
      onSave();
    } catch (err) {
      console.error("Error saving contact:", err);
      if (err.response?.status === 409) {
        setErrors({ email: "Ce contact existe déjà" });
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } finally {
      setLoading(false);
    }
  }

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: 20,
      animation: "fadeIn 0.3s ease-out"
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: 16,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      width: "100%",
      maxWidth: 700,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
    },
    header: {
      padding: "24px 28px",
      borderBottom: `2px solid ${T.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16
    },
    content: {
      padding: 28,
      overflowY: "auto",
      flex: 1
    },
    footer: {
      padding: "20px 28px",
      borderTop: `2px solid ${T.border}`,
      display: "flex",
      gap: 12,
      backgroundColor: "#fafafa",
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16
    },
    section: {
      marginBottom: 24
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: T.text,
      margin: "0 0 20px",
      display: "flex",
      alignItems: "center",
      gap: 8
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: T.primaryLight,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18
    },
    label: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      fontSize: 14,
      fontWeight: 600,
      color: T.text
    },
    input: (hasError = false) => ({
      width: "100%",
      padding: "12px 16px",
      border: `2px solid ${hasError ? T.danger : T.border}`,
      borderRadius: 10,
      fontSize: 15,
      boxSizing: "border-box",
      transition: "all 0.2s",
      outline: "none"
    }),
    tagContainer: {
      display: "flex",
      flexWrap: "wrap",
      gap: 8,
      padding: 12,
      background: T.bg,
      borderRadius: 10,
      minHeight: 48,
      border: `2px dashed ${T.border}`,
      alignItems: "center"
    },
    tag: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primary}dd 100%)`,
      color: "#fff",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 2px 4px rgba(99, 102, 241, 0.2)"
    },
    listItem: (isSelected) => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 10,
      cursor: "pointer",
      transition: "all 0.2s",
      border: `2px solid ${isSelected ? T.primary : "transparent"}`,
      background: isSelected ? T.primaryLight : "transparent"
    })
  };

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>
            {contact ? "✏️ Modifier le contact" : "✨ Nouveau contact"}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 10,
              borderRadius: 8,
              display: "flex",
              color: T.textSub,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f3f4f6";
              e.target.style.color = T.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = T.textSub;
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={modalStyles.content}>
          <form onSubmit={handleSubmit}>
            
            {/* INFORMATIONS PRINCIPALES */}
            <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
              <h3 style={modalStyles.sectionTitle}>
                <div style={modalStyles.iconBox}>👤</div>
                Informations principales
              </h3>

              {/* Email */}
              <div style={modalStyles.section}>
                <label style={modalStyles.label}>
                  <Mail size={16} />
                  Email
                  <span style={{ color: T.danger, marginLeft: 2 }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="contact@example.com"
                  disabled={loading}
                  required
                  style={modalStyles.input(!!errors.email)}
                  onFocus={(e) => {
                    e.target.style.borderColor = T.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.email ? T.danger : T.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
                {errors.email && (
                  <p style={{ color: T.danger, fontSize: 13, margin: "8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                    ⚠️ {errors.email}
                  </p>
                )}
              </div>

              {/* Prénom & Nom */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, ...modalStyles.section }}>
                <div>
                  <label style={modalStyles.label}>
                    <User size={16} />
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    placeholder="Jean"
                    disabled={loading}
                    style={modalStyles.input()}
                    onFocus={(e) => {
                      e.target.style.borderColor = T.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = T.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
                <div>
                  <label style={modalStyles.label}>
                    <User size={16} />
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleChange("lastName", e.target.value)}
                    placeholder="Dupont"
                    disabled={loading}
                    style={modalStyles.input()}
                    onFocus={(e) => {
                      e.target.style.borderColor = T.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = T.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div style={modalStyles.section}>
                <label style={modalStyles.label}>
                  <Phone size={16} />
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                  disabled={loading}
                  style={modalStyles.input()}
                  onFocus={(e) => {
                    e.target.style.borderColor = T.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = T.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Entreprise */}
              <div style={modalStyles.section}>
                <label style={modalStyles.label}>
                  <Building size={16} />
                  Entreprise
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                  placeholder="Acme Inc."
                  disabled={loading}
                  style={modalStyles.input()}
                  onFocus={(e) => {
                    e.target.style.borderColor = T.primary;
                    e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = T.border;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* ORGANISATION */}
            <div>
              <h3 style={modalStyles.sectionTitle}>
                <div style={modalStyles.iconBox}>🏷️</div>
                Organisation
              </h3>

              {/* Tags */}
              <div style={modalStyles.section}>
                <label style={modalStyles.label}>
                  <Tag size={16} />
                  Tags
                  <span style={{ fontSize: 12, fontWeight: 400, color: T.textSub, marginLeft: 4 }}>
                    ({formData.tags.length})
                  </span>
                </label>
                <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Tapez un tag et appuyez sur Entrée..."
                    disabled={loading}
                    style={{ ...modalStyles.input(), flex: 1 }}
                    onFocus={(e) => {
                      e.target.style.borderColor = T.primary;
                      e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = T.border;
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || loading}
                    style={{
                      padding: "0 24px",
                      background: tagInput.trim() && !loading ? T.primary : "#e5e7eb",
                      color: tagInput.trim() && !loading ? "#fff" : "#9ca3af",
                      border: "none",
                      borderRadius: 10,
                      cursor: !tagInput.trim() || loading ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      whiteSpace: "nowrap"
                    }}
                    onMouseEnter={(e) => {
                      if (tagInput.trim() && !loading) {
                        e.target.style.background = "#5558e3";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (tagInput.trim() && !loading) {
                        e.target.style.background = T.primary;
                      }
                    }}
                  >
                    <Plus size={16} />
                    Ajouter
                  </button>
                </div>

                {formData.tags.length > 0 ? (
                  <div style={modalStyles.tagContainer}>
                    {formData.tags.map(tag => (
                      <span key={tag} style={modalStyles.tag}>
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          style={{
                            background: "rgba(255, 255, 255, 0.3)",
                            border: "none",
                            borderRadius: "50%",
                            width: 18,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            padding: 0,
                            color: "#fff",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "rgba(255, 255, 255, 0.5)";
                            e.target.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "rgba(255, 255, 255, 0.3)";
                            e.target.style.transform = "scale(1)";
                          }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    ...modalStyles.tagContainer,
                    justifyContent: "center",
                    color: T.textSub,
                    fontSize: 14
                  }}>
                    Aucun tag — Ajoutez-en pour organiser vos contacts
                  </div>
                )}
              </div>

              {/* Listes */}
              <div style={modalStyles.section}>
                <label style={modalStyles.label}>
                  <List size={16} />
                  Listes de diffusion
                  <span style={{ fontSize: 12, fontWeight: 400, color: T.textSub, marginLeft: 4 }}>
                    ({formData.listIds.length} sélectionnée{formData.listIds.length > 1 ? "s" : ""})
                  </span>
                </label>
                {lists.length === 0 ? (
                  <div style={{
                    padding: 20,
                    background: T.bg,
                    borderRadius: 10,
                    border: `2px dashed ${T.border}`,
                    textAlign: "center",
                    color: T.textSub,
                    fontSize: 14
                  }}>
                    📭 Aucune liste disponible — Créez-en une d'abord
                  </div>
                ) : (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    padding: 12,
                    background: T.bg,
                    borderRadius: 10,
                    maxHeight: 220,
                    overflowY: "auto",
                    border: `2px solid ${T.border}`
                  }}>
                    {lists.map(list => {
                      const isSelected = formData.listIds.includes(list.id);
                      return (
                        <label
                          key={list.id}
                          style={modalStyles.listItem(isSelected)}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "#f9fafb";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleList(list.id)}
                            disabled={loading}
                            style={{ width: 20, height: 20, cursor: "pointer", accentColor: T.primary }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: 14,
                              color: T.text,
                              fontWeight: isSelected ? 600 : 500,
                              marginBottom: list.description ? 4 : 0
                            }}>
                              {list.name}
                            </div>
                            {list.description && (
                              <div style={{ fontSize: 12, color: T.textSub }}>
                                {list.description}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <Check size={18} color={T.primary} strokeWidth={3} />
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={modalStyles.footer}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 28px",
              background: "#fff",
              color: T.text,
              border: `2px solid ${T.border}`,
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 600,
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1
            }}
            onMouseEnter={(e) => !loading && (e.target.style.background = "#f9fafb")}
            onMouseLeave={(e) => (e.target.style.background = "#fff")}
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 28px",
              background: loading ? T.textSub : `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15,
              fontWeight: 600,
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)",
              opacity: loading ? 0.7 : 1
            }}
            onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
          >
            {loading ? (
              <>
                <RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
                Enregistrement...
              </>
            ) : contact ? (
              <>
                <Save size={16} />
                Mettre à jour
              </>
            ) : (
              <>
                <Plus size={16} />
                Créer le contact
              </>
            )}
          </button>
        </div>

      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}