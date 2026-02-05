// src/components/ContactModal.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../theme";
import client from "../api/client";
import { X, User, Mail, Phone, Building, Tag, List } from "lucide-react";

export default function ContactModal({ contact, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    tags: [],
    listIds: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        listIds: contact.lists?.map(l => l.list.id) || [],
      });
    }
  }, [contact]);

  async function fetchLists() {
    try {
      const res = await client.get("/lists");
      setLists(res.data.lists || []);
    } catch (err) {
      console.error("Error fetching lists:", err);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  }

  function handleAddTag() {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  }

  function handleRemoveTag(tag) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
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

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      setError("L'email est requis");
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Email invalide");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (contact) {
        await client.put(`/contacts/${contact.id}`, formData);
      } else {
        await client.post("/contacts", formData);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div 
        style={{ ...styles.modal, maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: `1px solid ${T.border}`
        }}>
          <h2 style={{ color: T.text, fontSize: 24, fontWeight: 700, margin: 0 }}>
            {contact ? "Modifier le contact" : "Nouveau contact"}
          </h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ 
            background: T.dangerLight, 
            border: `1px solid ${T.danger}`,
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            color: T.danger,
            fontSize: 14
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            {/* Email */}
            <div>
              <label style={styles.label}>
                <Mail size={16} style={{ marginRight: 6 }} />
                Email *
              </label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@example.com"
                disabled={loading}
                required
                style={styles.input}
              />
            </div>

            {/* First Name & Last Name */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={styles.label}>
                  <User size={16} style={{ marginRight: 6 }} />
                  Prénom
                </label>
                <input 
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange("firstName", e.target.value)}
                  placeholder="Jean"
                  disabled={loading}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>
                  <User size={16} style={{ marginRight: 6 }} />
                  Nom
                </label>
                <input 
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  placeholder="Dupont"
                  disabled={loading}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={styles.label}>
                <Phone size={16} style={{ marginRight: 6 }} />
                Téléphone
              </label>
              <input 
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+33 6 12 34 56 78"
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* Company */}
            <div>
              <label style={styles.label}>
                <Building size={16} style={{ marginRight: 6 }} />
                Entreprise
              </label>
              <input 
                type="text"
                value={formData.company}
                onChange={(e) => handleChange("company", e.target.value)}
                placeholder="Acme Inc."
                disabled={loading}
                style={styles.input}
              />
            </div>

            {/* Tags */}
            <div>
              <label style={styles.label}>
                <Tag size={16} style={{ marginRight: 6 }} />
                Tags
              </label>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
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
                  placeholder="Ajouter un tag..."
                  disabled={loading}
                  style={{ ...styles.input, flex: 1 }}
                />
                <button 
                  type="button"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || loading}
                  style={{ 
                    ...styles.btn, 
                    padding: "0 20px",
                    opacity: !tagInput.trim() || loading ? 0.5 : 1
                  }}
                >
                  Ajouter
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {formData.tags.map(tag => (
                    <span 
                      key={tag}
                      style={{ 
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "4px 10px",
                        background: T.primaryLight,
                        color: T.primary,
                        borderRadius: 16,
                        fontSize: 13,
                        fontWeight: 500
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ 
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 0,
                          display: "flex",
                          color: T.primary
                        }}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Lists */}
            <div>
              <label style={styles.label}>
                <List size={16} style={{ marginRight: 6 }} />
                Listes
              </label>
              {lists.length === 0 ? (
                <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>
                  Aucune liste disponible
                </p>
              ) : (
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 8,
                  padding: 12,
                  background: T.bg,
                  borderRadius: 8,
                  maxHeight: 200,
                  overflowY: "auto"
                }}>
                  {lists.map(list => (
                    <label 
                      key={list.id}
                      style={{ 
                        display: "flex", 
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: 6,
                        transition: "background 0.2s",
                        background: formData.listIds.includes(list.id) ? T.primaryLight : "transparent"
                      }}
                    >
                      <input 
                        type="checkbox"
                        checked={formData.listIds.includes(list.id)}
                        onChange={() => toggleList(list.id)}
                        disabled={loading}
                        style={{ cursor: "pointer" }}
                      />
                      <span style={{ 
                        fontSize: 14, 
                        color: T.text,
                        fontWeight: formData.listIds.includes(list.id) ? 600 : 400
                      }}>
                        {list.name}
                      </span>
                      {list.description && (
                        <span style={{ fontSize: 12, color: T.textSub }}>
                          — {list.description}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Actions */}
          <div style={{ 
            display: "flex", 
            gap: 12, 
            marginTop: 24,
            paddingTop: 20,
            borderTop: `1px solid ${T.border}`
          }}>
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ 
                ...styles.btn, 
                flex: 1,
                background: "#fff",
                color: T.text,
                border: `1px solid ${T.border}`
              }}
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{ 
                ...styles.btn, 
                flex: 1,
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "Enregistrement..." : contact ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}