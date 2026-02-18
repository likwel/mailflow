// src/components/contacts/ContactModal.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { X, Plus, Tag } from "lucide-react";

export default function ContactModal({ contact, onClose, onSave }) {
  const isEdit = !!contact;
  const [form, setForm]     = useState({
    email: "", firstName: "", lastName: "",
    phone: "", company: "", status: "ACTIVE",
  });
  const [tags, setTags]         = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [listIds, setListIds]   = useState([]);
  const [lists, setLists]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    // Charger les listes disponibles
    client.get("/contact-lists").then(r => setLists(r.data.lists || [])).catch(() => {});

    if (contact) {
      setForm({
        email:     contact.email     || "",
        firstName: contact.firstName || "",
        lastName:  contact.lastName  || "",
        phone:     contact.phone     || "",
        company:   contact.company   || "",
        status:    contact.status    || "ACTIVE",
      });
      setTags(contact.tags || []);
      setListIds((contact.lists || []).map(m => m.listId || m.list?.id).filter(Boolean));
    }
  }, [contact]);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput("");
  }

  function toggleList(id) {
    setListIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) { setError("L'email est requis"); return; }
    setLoading(true); setError("");
    try {
      const payload = { ...form, tags, listIds };
      if (isEdit) {
        await client.put(`/contacts/${contact.id}`, payload);
      } else {
        await client.post("/contacts", payload);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ ...styles.card, width:"100%", maxWidth:540, maxHeight:"90vh", overflowY:"auto", padding:28 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h2 style={{ margin:0, color: T.text, fontSize:20, fontWeight:700 }}>
            {isEdit ? "Modifier le contact" : "Nouveau contact"}
          </h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color: T.textSub }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>

          {/* Email */}
          <div>
            <label style={{ ...labelStyle }}>Email *</label>
            <input value={form.email} onChange={e => set("email", e.target.value)}
              placeholder="contact@exemple.com" style={{ ...styles.input, marginTop:5 }}/>
          </div>

          {/* Prénom / Nom */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Prénom</label>
              <input value={form.firstName} onChange={e => set("firstName", e.target.value)}
                placeholder="Jean" style={{ ...styles.input, marginTop:5 }}/>
            </div>
            <div>
              <label style={labelStyle}>Nom</label>
              <input value={form.lastName} onChange={e => set("lastName", e.target.value)}
                placeholder="Dupont" style={{ ...styles.input, marginTop:5 }}/>
            </div>
          </div>

          {/* Téléphone / Entreprise */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)}
                placeholder="+33 6 00 00 00 00" style={{ ...styles.input, marginTop:5 }}/>
            </div>
            <div>
              <label style={labelStyle}>Entreprise</label>
              <input value={form.company} onChange={e => set("company", e.target.value)}
                placeholder="Acme Corp" style={{ ...styles.input, marginTop:5 }}/>
            </div>
          </div>

          {/* Statut */}
          <div>
            <label style={labelStyle}>Statut</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              style={{ ...styles.input, marginTop:5 }}>
              <option value="ACTIVE">Actif</option>
              <option value="UNSUBSCRIBED">Désabonné</option>
              <option value="BOUNCED">Rebond</option>
              <option value="COMPLAINED">Plainte</option>
              <option value="BLOCKED">Bloqué</option>
            </select>
          </div>

          {/* Tags */}
          <div>
            <label style={labelStyle}>Tags</label>
            <div style={{ display:"flex", gap:8, marginTop:5 }}>
              <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); addTag(); }}}
                placeholder="Ajouter un tag..." style={{ ...styles.input, flex:1 }}/>
              <button type="button" onClick={addTag}
                style={{ ...styles.btn, padding:"0 14px" }}><Plus size={15}/></button>
            </div>
            {tags.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop:8 }}>
                {tags.map(t => (
                  <span key={t} style={{ background:"#eff6ff", color: T.primary, fontSize:12, padding:"3px 10px", borderRadius:99, display:"flex", alignItems:"center", gap:5 }}>
                    <Tag size={11}/> {t}
                    <button type="button" onClick={() => setTags(p => p.filter(x => x!==t))}
                      style={{ background:"none", border:"none", cursor:"pointer", color: T.primary, padding:0, lineHeight:1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Listes */}
          {lists.length > 0 && (
            <div>
              <label style={labelStyle}>Ajouter à des listes</label>
              <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:6 }}>
                {lists.map(l => (
                  <label key={l.id} style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"8px 12px", borderRadius:8, border:`1px solid ${listIds.includes(l.id) ? T.primary : T.border}`, background: listIds.includes(l.id) ? "#eff6ff" : "#fff" }}>
                    <input type="checkbox" checked={listIds.includes(l.id)} onChange={() => toggleList(l.id)} style={{ accentColor: T.primary }}/>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500, color: T.text }}>{l.name}</div>
                      {l.description && <div style={{ fontSize:12, color: T.textSub }}>{l.description}</div>}
                    </div>
                    <span style={{ marginLeft:"auto", fontSize:12, color: T.textSub }}>
                      {l._count?.contacts ?? 0} contacts
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: T.danger, fontSize:13, margin:0 }}>{error}</p>}

          {/* Actions */}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
            <button type="button" onClick={onClose}
              style={{ ...styles.btn, background:"#fff", color: T.text, border:`1px solid ${T.border}` }}>
              Annuler
            </button>
            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { color: T.textSub, fontSize:13, fontWeight:500 };