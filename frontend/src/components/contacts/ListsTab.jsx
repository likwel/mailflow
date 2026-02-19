// src/components/contacts/ListsTab.jsx
import { useState, useEffect, useCallback } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
  List, Plus, Edit, Trash2, MoreVertical, Users,
  Search, X, CheckSquare, Square, UserPlus, Upload
} from "lucide-react";

// ─── Helpers UI ───────────────────────────────────────
function Overlay({ children, onClose, wide }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ ...styles.card, width:"100%", maxWidth: wide?660:480, maxHeight:"92vh", overflowY:"auto", padding:28, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", color:T.textSub }}><X size={20}/></button>
        {children}
      </div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ color:T.textSub, fontSize:13, fontWeight:500 }}>{label}</label>
      {children}
    </div>
  );
}
function MenuItem({ icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display:"flex", alignItems:"center", gap:8, width:"100%", padding:"10px 14px", background:"none", border:"none", cursor:"pointer", color: danger?T.danger:T.text, fontSize:13 }}>
      {icon} {label}
    </button>
  );
}

const STATUS_CONFIG = {
  ACTIVE:       { bg:"#d1fae5", color:"#065f46", dot:"#10b981", label:"Actif" },
  UNSUBSCRIBED: { bg:"#fef3c7", color:"#92400e", dot:"#f59e0b", label:"Désabonné" },
  BOUNCED:      { bg:"#fee2e2", color:"#991b1b", dot:"#ef4444", label:"Rebond" },
  COMPLAINED:   { bg:"#ede9fe", color:"#5b21b6", dot:"#8b5cf6", label:"Plainte" },
  BLOCKED:      { bg:"#f1f5f9", color:"#475569", dot:"#94a3b8", label:"Bloqué" },
};

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.BLOCKED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 99, fontSize: 11, fontWeight: 600,
      padding: "3px 10px 3px 7px",
      border: `1px solid ${s.color}25`,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: s.dot, flexShrink: 0,
      }}/>
      {s.label}
    </span>
  );
}

// ─── Checkbox ─────────────────────────────────────────
function Checkbox({ checked, indeterminate }) {
  if (indeterminate) return (
    <div style={{ width:16, height:16, borderRadius:4, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
      <svg width="10" height="2" viewBox="0 0 10 2"><rect x="1" y="0.5" width="8" height="1.5" rx="1" fill="white"/></svg>
    </div>
  );
  return checked
    ? <div style={{ width:16, height:16, borderRadius:4, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    : <div style={{ width:16, height:16, borderRadius:4, border:"2px solid #cbd5e1", flexShrink:0, background:"#fff" }}/>;
}

// ─── List Modal (create / edit) ───────────────────────
function ListModal({ list, onClose, onSave }) {
  const [name, setName]       = useState(list?.name || "");
  const [desc, setDesc]       = useState(list?.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError("Nom requis"); return; }
    setLoading(true);
    try {
      if (list) await client.put(`/contact-lists/${list.id}`, { name, description: desc });
      else      await client.post("/contact-lists", { name, description: desc });
      onSave();
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setLoading(false); }
  }

  return (
    <Overlay onClose={onClose}>
      <h2 style={{ margin:"0 0 20px", color:T.text, fontSize:20, fontWeight:700 }}>{list?"Modifier":"Nouvelle liste"}</h2>
      <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
        <Field label="Nom *"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex : Newsletter mensuelle" style={styles.input}/></Field>
        <Field label="Description"><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3} placeholder="Description optionnelle..." style={{ ...styles.input, resize:"vertical" }}/></Field>
        {error && <p style={{ color:T.danger, fontSize:13, margin:0 }}>{error}</p>}
        <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:8 }}>
          <button type="button" onClick={onClose} style={{ ...styles.btn, background:"#fff", color:T.text, border:`1px solid ${T.border}` }}>Annuler</button>
          <button type="submit" disabled={loading} style={styles.btn}>{loading?"...":list?"Mettre à jour":"Créer"}</button>
        </div>
      </form>
    </Overlay>
  );
}

// ─── Add Contacts Modal ───────────────────────────────
function AddContactsModal({ listId, existingIds, onClose, onSave }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get("/contacts", { params: { search, limit: 100 } });
      const all = res.data.contacts || [];
      setContacts(all.filter(c => !existingIds.includes(c.id)));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [search, existingIds]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  function toggle(id) { setSelected(p => p.includes(id) ? p.filter(x=>x!==id) : [...p, id]); }
  function toggleAll() { setSelected(selected.length === contacts.length ? [] : contacts.map(c=>c.id)); }

  async function handleAdd() {
    if (!selected.length) return;
    setSaving(true); setError("");
    try {
      await client.post(`/contact-lists/${listId}/contacts`, { contactIds: selected });
      onSave();
    } catch (err) { setError(err.response?.data?.error || "Erreur"); }
    finally { setSaving(false); }
  }

  const allSel = contacts.length > 0 && selected.length === contacts.length;

  return (
    <Overlay onClose={onClose} wide>
      <h2 style={{ margin:"0 0 16px", color:T.text, fontSize:20, fontWeight:700 }}>Ajouter des contacts</h2>
      <div style={{ position:"relative", marginBottom:12 }}>
        <Search size={15} color={T.textSub} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}/>
        <input placeholder="Rechercher par email, nom..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...styles.input, paddingLeft:36 }}/>
      </div>
      {contacts.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"#f8fafc", borderRadius:8, marginBottom:8, cursor:"pointer" }} onClick={toggleAll}>
          <Checkbox checked={allSel} indeterminate={selected.length > 0 && !allSel}/>
          <span style={{ fontSize:13, color:T.textSub }}>
            {allSel ? "Tout désélectionner" : "Tout sélectionner"} ({contacts.length})
          </span>
          {selected.length > 0 && (
            <span style={{ marginLeft:"auto", fontSize:13, fontWeight:600, color:T.primary }}>{selected.length} sélectionné(s)</span>
          )}
        </div>
      )}
      <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", maxHeight:340, overflowY:"auto", marginBottom:14 }}>
        {loading ? (
          <div style={{ padding:24, textAlign:"center", color:T.textSub }}>Chargement...</div>
        ) : contacts.length === 0 ? (
          <div style={{ padding:24, textAlign:"center", color:T.textSub }}>
            {search ? "Aucun contact trouvé" : "Tous vos contacts sont déjà dans cette liste"}
          </div>
        ) : contacts.map((c, i) => (
          <div key={c.id} onClick={() => toggle(c.id)}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer",
              borderTop: i>0?`1px solid ${T.border}`:"none",
              background: selected.includes(c.id)?"#eff6ff":"#fff",
              transition:"background .1s" }}>
            <Checkbox checked={selected.includes(c.id)}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:500, color:T.text, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.email}</div>
              {(c.firstName||c.lastName) && (
                <div style={{ color:T.textSub, fontSize:12 }}>{[c.firstName,c.lastName].filter(Boolean).join(" ")}</div>
              )}
            </div>
            {c.company && <span style={{ fontSize:12, color:T.textSub, flexShrink:0 }}>{c.company}</span>}
            <StatusBadge status={c.status}/>
          </div>
        ))}
      </div>
      {error && <p style={{ color:T.danger, fontSize:13, margin:"0 0 12px" }}>{error}</p>}
      <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
        <button onClick={onClose} style={{ ...styles.btn, background:"#fff", color:T.text, border:`1px solid ${T.border}` }}>Annuler</button>
        <button onClick={handleAdd} disabled={!selected.length || saving} style={{ ...styles.btn, opacity: !selected.length?0.5:1 }}>
          {saving ? "Ajout..." : `Ajouter ${selected.length > 0 ? `(${selected.length})` : ""}`}
        </button>
      </div>
    </Overlay>
  );
}

// ─── Import CSV dans une liste ────────────────────────
function ImportToListModal({ listId, listName, onClose, onSave }) {
  const [step, setStep]       = useState("upload");
  const [rows, setRows]       = useState([]);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  function parseCsv(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["]/g,""));
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g,""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return {
        email:     obj.email || obj.mail || "",
        firstName: obj.firstname || obj.prenom || obj.first || "",
        lastName:  obj.lastname  || obj.nom    || obj.last  || "",
        phone:     obj.phone || obj.telephone  || obj.tel   || "",
        company:   obj.company || obj.entreprise || obj.societe || "",
        tags:      obj.tags || obj.tag || "",
      };
    }).filter(r => r.email);
  }

  async function handleFile(e) {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("Seul le format CSV est supporté."); return; }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) { setError("Aucun contact valide trouvé."); return; }
    setRows(parsed);
    setStep("preview");
  }

  async function handleImport() {
    setLoading(true); setError("");
    try {
      const res = await client.post("/contacts/import", { contacts: rows, listId });
      setResult(res.data);
      setStep("result");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'import");
    } finally { setLoading(false); }
  }

  return (
    <Overlay onClose={onClose} wide>
      <h2 style={{ margin:"0 0 4px", color:T.text, fontSize:20, fontWeight:700 }}>Importer dans « {listName} »</h2>
      <p style={{ color:T.textSub, fontSize:13, margin:"0 0 20px" }}>Les contacts seront créés et ajoutés à cette liste</p>

      {step === "upload" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <label style={{ border:`2px dashed ${T.border}`, borderRadius:12, padding:36, textAlign:"center", cursor:"pointer", display:"block" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.primary}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
            <Upload size={32} color={T.primary} style={{ marginBottom:10 }}/>
            <p style={{ color:T.text, fontWeight:600, margin:"0 0 4px" }}>Cliquez pour choisir un fichier CSV</p>
            <p style={{ color:T.textSub, fontSize:13, margin:0 }}>ou glissez-déposez ici</p>
            <input type="file" accept=".csv" onChange={handleFile} style={{ display:"none" }}/>
          </label>
          {error && <p style={{ color:T.danger, fontSize:13, margin:0 }}>{error}</p>}
          <div style={{ background:"#f8fafc", borderRadius:8, padding:14 }}>
            <p style={{ color:T.text, fontWeight:600, fontSize:13, margin:"0 0 6px" }}>Format attendu :</p>
            <code style={{ fontSize:12, color:T.textSub, lineHeight:1.8 }}>
              email,firstName,lastName,phone,company,tags<br/>
              jean@exemple.com,Jean,Dupont,,Acme,vip;newsletter
            </code>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#eff6ff", borderRadius:8 }}>
            <Users size={18} color={T.primary}/>
            <span style={{ color:T.text, fontWeight:500 }}>{rows.length} contact(s) détecté(s)</span>
          </div>
          <div style={{ overflowX:"auto", border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {["Email","Prénom","Nom","Entreprise","Tags"].map(h=>(
                    <th key={h} style={{ padding:"9px 12px", textAlign:"left", color:T.textSub, fontWeight:600, fontSize:12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0,8).map((r,i)=>(
                  <tr key={i} style={{ borderTop:`1px solid ${T.border}` }}>
                    <td style={{ padding:"8px 12px", color:T.text }}>{r.email}</td>
                    <td style={{ padding:"8px 12px", color:T.textSub }}>{r.firstName||"—"}</td>
                    <td style={{ padding:"8px 12px", color:T.textSub }}>{r.lastName||"—"}</td>
                    <td style={{ padding:"8px 12px", color:T.textSub }}>{r.company||"—"}</td>
                    <td style={{ padding:"8px 12px", color:T.textSub }}>{r.tags||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 8 && <p style={{ color:T.textSub, fontSize:12, padding:"8px 12px", margin:0 }}>... et {rows.length-8} autres</p>}
          </div>
          {error && <p style={{ color:T.danger, fontSize:13, margin:0 }}>{error}</p>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button onClick={() => setStep("upload")} style={{ ...styles.btn, background:"#fff", color:T.text, border:`1px solid ${T.border}` }}>Retour</button>
            <button onClick={handleImport} disabled={loading} style={styles.btn}>
              {loading ? "Import en cours..." : `Importer ${rows.length} contacts`}
            </button>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center", padding:"16px 0" }}>
          <div style={{ width:60, height:60, borderRadius:"50%", background:"#d1fae5", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontSize:28 }}>✓</span>
          </div>
          <h3 style={{ margin:0, color:T.text, fontSize:18, fontWeight:700 }}>Import terminé !</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, width:"100%" }}>
            {[
              { label:"Total",   value:result.total,   color:T.primary },
              { label:"Créés",   value:result.created, color:"#10b981" },
              { label:"Ignorés", value:result.skipped, color:"#f59e0b" },
            ].map(s=>(
              <div key={s.label} style={{ padding:"14px 10px", borderRadius:10, border:`2px solid ${s.color}30`, background:`${s.color}10` }}>
                <div style={{ fontSize:26, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:13, color:T.textSub }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ color:T.textSub, fontSize:13, margin:0 }}>Les doublons ont été ignorés.</p>
          <button onClick={onSave} style={styles.btn}>Fermer</button>
        </div>
      )}
    </Overlay>
  );
}

// ─── List Detail ──────────────────────────────────────
function ListDetail({ listId, onBack }) {
  const [list, setList]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [removing, setRemoving]     = useState(null);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState([]);
  const [bulkRemoving, setBulkRemoving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get(`/contact-lists/${listId}`);
      setList(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [listId]);

  useEffect(() => { reload(); }, [reload]);

  async function handleRemove(contactId) {
    if (!confirm("Retirer ce contact de la liste ?")) return;
    setRemoving(contactId);
    try {
      await client.delete(`/contact-lists/${listId}/contacts`, { data: { contactIds: [contactId] } });
      setSelected(p => p.filter(id => id !== contactId));
      await reload();
    } catch { alert("Erreur lors du retrait"); }
    finally { setRemoving(null); }
  }

  async function handleBulkRemove() {
    if (!confirm(`Retirer ${selected.length} contact(s) de la liste ?`)) return;
    setBulkRemoving(true);
    try {
      await client.delete(`/contact-lists/${listId}/contacts`, { data: { contactIds: selected } });
      setSelected([]);
      await reload();
    } catch { alert("Erreur lors du retrait"); }
    finally { setBulkRemoving(false); }
  }

  function toggleSelect(id) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }

  if (loading || !list) return (
    <div style={{ padding:60, textAlign:"center", color:T.textSub }}>Chargement...</div>
  );

  const members    = list.contacts || [];
  const existingIds = members.map(m => m.contactId || m.contact?.id).filter(Boolean);

  const filtered = members.filter(m => {
    const c = m.contact || {};
    const q = search.toLowerCase();
    return !q
      || (c.email||"").includes(q)
      || (c.firstName||"").toLowerCase().includes(q)
      || (c.lastName||"").toLowerCase().includes(q);
  });

  // ✅ Toujours après `filtered`
  const allIds     = filtered.map(m => m.contact?.id).filter(Boolean);
  const someSelected = selected.length > 0 && selected.length < allIds.length;
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.includes(id));

  function toggleAll() {
    setSelected(allSelected ? [] : allIds);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, flexWrap:"wrap" }}>
        <button onClick={onBack}
          style={{ ...styles.btn, background:"#fff", color:T.text, border:`1px solid ${T.border}`, padding:"7px 14px", flexShrink:0 }}>
          ← Retour
        </button>
        <div style={{ flex:1 }}>
          <h2 style={{ margin:0, color:T.text, fontSize:22, fontWeight:700 }}>{list.name}</h2>
          {list.description && <p style={{ margin:"2px 0 0", color:T.textSub, fontSize:13 }}>{list.description}</p>}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <button onClick={() => setShowImport(true)}
            style={{ ...styles.btn, background:"#fff", color:T.primary, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
            <Upload size={14}/> Importer CSV
          </button>
          <button onClick={() => setShowAdd(true)}
            style={{ ...styles.btn, display:"flex", alignItems:"center", gap:6 }}>
            <UserPlus size={14}/> Ajouter des contacts
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div style={{ ...styles.card, padding:"12px 18px", display:"flex", alignItems:"center", gap:16 }}>
        <span style={{ display:"flex", alignItems:"center", gap:7, color:T.text, fontWeight:600 }}>
          <Users size={18} color={T.primary}/> {members.length} contact(s)
        </span>
        <span style={{ color:T.textSub, fontSize:13 }}>
          Créée le {new Date(list.createdAt).toLocaleDateString("fr-FR")}
        </span>
      </div>

      {/* Search */}
      {members.length > 0 && (
        <div style={{ position:"relative" }}>
          <Search size={15} color={T.textSub} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}/>
          <input placeholder="Filtrer les contacts..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, paddingLeft:36 }}/>
        </div>
      )}

      {/* ── Bulk action bar ─────────────────────────────── */}
      {selected.length > 0 && (
        <div style={{
          display:"flex", alignItems:"center", gap:10,
          padding:"10px 16px",
          background:"#0f172a", borderRadius:10,
          boxShadow:"0 4px 16px rgba(0,0,0,.2)",
          flexWrap:"wrap"
        }}>
          {/* Badge count */}
          <div style={{
            minWidth:26, height:26, borderRadius:7,
            background:"rgba(255,255,255,.15)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, fontWeight:700, color:"#fff", padding:"0 6px"
          }}>
            {selected.length}
          </div>
          <span style={{ color:"rgba(255,255,255,.7)", fontSize:13 }}>
            contact{selected.length > 1 ? "s" : ""} sélectionné{selected.length > 1 ? "s" : ""}
          </span>

          <div style={{ width:1, height:20, background:"rgba(255,255,255,.15)", margin:"0 4px" }}/>

          {/* Action : Retirer de la liste */}
          <button onClick={handleBulkRemove} disabled={bulkRemoving}
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"6px 14px",
              background:"rgba(239,68,68,.15)",
              border:"1px solid rgba(239,68,68,.3)",
              borderRadius:8, cursor:"pointer",
              color:"#fca5a5", fontSize:13, fontWeight:500,
              opacity: bulkRemoving ? 0.6 : 1
            }}>
            <Trash2 size={13}/> {bulkRemoving ? "Retrait..." : "Retirer de la liste"}
          </button>

          {/* Action : Exporter la sélection */}
          <button
            onClick={() => {
              const rows = filtered
                .filter(m => selected.includes(m.contact?.id))
                .map(m => {
                  const c = m.contact || {};
                  return [c.email, c.firstName, c.lastName, c.company, c.status].join(",");
                });
              const csv = ["email,firstName,lastName,company,status", ...rows].join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
              a.download = `export-${list.name}.csv`;
              a.click();
            }}
            style={{
              display:"flex", alignItems:"center", gap:6,
              padding:"6px 14px",
              background:"rgba(255,255,255,.08)",
              border:"1px solid rgba(255,255,255,.15)",
              borderRadius:8, cursor:"pointer",
              color:"rgba(255,255,255,.8)", fontSize:13, fontWeight:500
            }}>
            <Upload size={13}/> Exporter
          </button>

          {/* Annuler */}
          <button onClick={() => setSelected([])}
            style={{
              marginLeft:"auto",
              background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,.4)", fontSize:13,
              display:"flex", alignItems:"center", gap:4
            }}>
            <X size={13}/> Annuler
          </button>
        </div>
      )}

      {/* Table */}
      <div style={{ ...styles.card, padding:0, overflow:"hidden" }}>
        {members.length === 0 ? (
          <div style={{ padding:50, textAlign:"center" }}>
            <Users size={42} color={T.border} style={{ marginBottom:12 }}/>
            <p style={{ color:T.textSub, margin:"0 0 16px" }}>Cette liste est vide</p>
            <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
              <button onClick={() => setShowImport(true)}
                style={{ ...styles.btn, background:"#fff", color:T.primary, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
                <Upload size={14}/> Importer CSV
              </button>
              <button onClick={() => setShowAdd(true)} style={{ ...styles.btn, display:"flex", alignItems:"center", gap:6 }}>
                <UserPlus size={14}/> Ajouter des contacts
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:30, textAlign:"center", color:T.textSub }}>Aucun résultat pour « {search} »</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
              <thead>
                <tr style={{ background:"#f8fafc" }}>
                  {/* ── En-tête checkbox ── */}
                  <th style={{ padding:"11px 16px", width:40 }}>
                    <div
                      onClick={toggleAll}
                      style={{ cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Checkbox checked={allSelected} indeterminate={someSelected}/>
                    </div>
                  </th>
                  {["Email","Nom","Entreprise","Statut","Ajouté le",""].map(h => (
                    <th key={h} style={{ padding:"11px 16px", textAlign:"left", color:T.textSub, fontWeight:600, fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, i) => {
                  const c   = m.contact || {};
                  const cId = c.id;
                  const isSel = selected.includes(cId);
                  return (
                    <tr key={m.id||i}
                      style={{
                        borderTop:`1px solid ${T.border}`,
                        background: isSel ? "#eff6ff" : i%2===0 ? "#fff" : "#fafafa",
                        transition:"background .1s"
                      }}>
                      {/* ── Cellule checkbox ── */}
                      <td style={{ padding:"11px 16px" }}>
                        <div
                          onClick={() => toggleSelect(cId)}
                          style={{ cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Checkbox checked={isSel}/>
                        </div>
                      </td>
                      <td style={{ padding:"11px 16px", color:T.text, fontWeight:500 }}>{c.email||"—"}</td>
                      <td style={{ padding:"11px 16px", color:T.textSub }}>{[c.firstName,c.lastName].filter(Boolean).join(" ")||"—"}</td>
                      <td style={{ padding:"11px 16px", color:T.textSub }}>{c.company||"—"}</td>
                      <td style={{ padding:"11px 16px" }}><StatusBadge status={c.status}/></td>
                      <td style={{ padding:"11px 16px", color:T.textSub, fontSize:12 }}>
                        {m.addedAt ? new Date(m.addedAt).toLocaleDateString("fr-FR") : "—"}
                      </td>
                      <td style={{ padding:"11px 16px" }}>
                        <button onClick={() => handleRemove(cId)} disabled={removing===cId}
                          style={{ display:"flex", alignItems:"center", gap:5, background:"none", border:`1px solid ${T.danger}20`, borderRadius:6, padding:"4px 10px", cursor:"pointer", color:T.danger, fontSize:12 }}>
                          {removing===cId ? "..." : <><X size={12}/> Retirer</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAdd && (
        <AddContactsModal
          listId={listId}
          existingIds={existingIds}
          onClose={() => setShowAdd(false)}
          onSave={() => { reload(); setShowAdd(false); }}/>
      )}
      {showImport && (
        <ImportToListModal
          listId={listId}
          listName={list.name}
          onClose={() => setShowImport(false)}
          onSave={() => { reload(); setShowImport(false); }}/>
      )}
    </div>
  );
}

// ─── Main ListsTab ────────────────────────────────────
export default function ListsTab() {
  const [lists, setLists]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [detailId, setDetailId]   = useState(null);
  const [openMenu, setOpenMenu]   = useState(null);

  useEffect(() => { fetchLists(); }, []);

  async function fetchLists() {
    setLoading(true);
    try { const r = await client.get("/contact-lists"); setLists(r.data.lists || []); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm("Supprimer cette liste ? Les contacts ne seront pas supprimés.")) return;
    try { await client.delete(`/contact-lists/${id}`); fetchLists(); }
    catch { alert("Erreur lors de la suppression"); }
  }

  if (detailId) {
    return <ListDetail listId={detailId} onBack={() => { setDetailId(null); fetchLists(); }}/>;
  }

  const filtered = lists.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
      <div style={{ ...styles.card, padding: 14 }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:220, position:"relative" }}>
          <Search size={15} color={T.textSub} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}/>
          <input placeholder="Rechercher une liste..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...styles.input, paddingLeft:36 }}/>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          style={{ ...styles.btn, display:"flex", alignItems:"center", gap:6 }}>
          <Plus size={15}/> Nouvelle liste
        </button>
      </div>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:"center", color:T.textSub }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...styles.card, padding:60, textAlign:"center" }}>
          <List size={44} color={T.border} style={{ marginBottom:12 }}/>
          <p style={{ color:T.textSub, margin:"0 0 16px" }}>{search?"Aucune liste trouvée":"Aucune liste créée"}</p>
          {!search && <button onClick={() => setShowModal(true)} style={styles.btn}>Créer votre première liste</button>}
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))", gap:16 }}>
          {filtered.map(l => (
            <div key={l.id} style={{ ...styles.card, padding:20, position:"relative" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ width:42, height:42, borderRadius:10, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <List size={20} color={T.primary}/>
                </div>
                <div style={{ position:"relative" }}>
                  <button onClick={() => setOpenMenu(openMenu===l.id?null:l.id)}
                    style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, color:T.textSub }}>
                    <MoreVertical size={17}/>
                  </button>
                  {openMenu===l.id && (
                    <>
                      <div onClick={() => setOpenMenu(null)} style={{ position:"fixed", inset:0, zIndex:90 }}/>
                      <div style={{ position:"absolute", right:0, top:"100%", zIndex:100, background:"#fff", border:`1px solid ${T.border}`, borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,.1)", minWidth:160, overflow:"hidden" }}>
                        <MenuItem icon={<Edit size={13}/>} label="Modifier" onClick={() => { setEditing(l); setShowModal(true); setOpenMenu(null); }}/>
                        <MenuItem icon={<Users size={13}/>} label="Voir les contacts" onClick={() => { setDetailId(l.id); setOpenMenu(null); }}/>
                        {!l.isDefault && <MenuItem icon={<Trash2 size={13}/>} label="Supprimer" danger onClick={() => { handleDelete(l.id); setOpenMenu(null); }}/>}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ marginTop:12, cursor:"pointer" }} onClick={() => setDetailId(l.id)}>
                <h3 style={{ margin:"0 0 4px", color:T.text, fontSize:16, fontWeight:600 }}>{l.name}</h3>
                {l.description && <p style={{ margin:"0 0 6px", color:T.textSub, fontSize:13, lineHeight:1.5 }}>{l.description}</p>}
              </div>
              <div style={{ display:"flex", alignItems:"center", marginTop:14, paddingTop:14, borderTop:`1px solid ${T.border}` }}>
                <span style={{ display:"flex", alignItems:"center", gap:5, color:T.textSub, fontSize:13 }}>
                  <Users size={13}/> {l._count?.contacts ?? 0} contacts
                </span>
                {l.isDefault && (
                  <span style={{ marginLeft:10, fontSize:11, fontWeight:600, background:"#eff6ff", color:T.primary, padding:"2px 8px", borderRadius:99 }}>Défaut</span>
                )}
                <span style={{ marginLeft:"auto", fontSize:12, color:T.textMuted }}>
                  {new Date(l.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ListModal list={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={() => { fetchLists(); setShowModal(false); setEditing(null); }}/>
      )}
    </div>
  );
}