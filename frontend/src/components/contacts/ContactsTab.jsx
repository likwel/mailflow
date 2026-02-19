// src/components/contacts/ContactsTab.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Users, Search, Plus, Upload, Download, Trash2, Edit, MoreVertical, CheckSquare, Square, ChevronLeft, ChevronRight } from "lucide-react";
import ContactModal from "./ContactModal";
import ImportModal  from "./ImportModal";
import BulkBar      from "./BulkBar";
import CustomBadge from "../../components/ui/CustomBadge";

// ─── StatCard mini ────────────────────────────────────
function Stat({ label, value, color }) {
  return (
    <div style={{ ...styles.card, padding: "16px 20px", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: T.text }}>{value ?? "—"}</div>
      <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ─── Row menu ─────────────────────────────────────────
function RowMenu({ contact, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.textSub, borderRadius: 6 }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div style={{
            position: "absolute", right: 0, top: "100%", zIndex: 100,
            background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,.1)", minWidth: 140, overflow: "hidden"
          }}>
            <button onClick={() => { onEdit(contact); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: T.text, fontSize: 14 }}>
              <Edit size={14} /> Modifier
            </button>
            <button onClick={() => { onDelete(contact.id); setOpen(false); }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", color: T.danger, fontSize: 14 }}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ContactsTab() {
  const [contacts, setContacts]       = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [selected, setSelected]       = useState([]);
  const [showContact, setShowContact] = useState(false);
  const [showImport, setShowImport]   = useState(false);
  const [editing, setEditing]         = useState(null);

  useEffect(() => { fetchContacts(); }, [search, filterStatus, page]);
  useEffect(() => { fetchStats(); }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const res = await client.get("/contacts", { params: { search, status: filterStatus, page, limit: 50 } });
      setContacts(res.data.contacts);
      setTotalPages(res.data.pagination.pages);
      setTotal(res.data.pagination.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchStats() {
    try { const r = await client.get("/contacts/stats/overview"); setStats(r.data); }
    catch (e) { console.error(e); }
  }

  function refresh() { fetchContacts(); fetchStats(); }

  async function handleDelete(id) {
    if (!confirm("Supprimer ce contact ?")) return;
    await client.delete(`/contacts/${id}`);
    refresh();
  }

  async function handleBulkDelete() {
    if (!confirm(`Supprimer ${selected.length} contact(s) ?`)) return;
    await client.post("/contacts/bulk/delete", { contactIds: selected });
    setSelected([]);
    refresh();
  }

  async function handleBulkAddToList(listId) {
    await client.post(`/contact-lists/${listId}/contacts`, { contactIds: selected });
    setSelected([]);
  }

  async function handleBulkStatus(status) {
    await Promise.all(selected.map(id => client.put(`/contacts/${id}`, { status })));
    setSelected([]);
    refresh();
  }

  async function handleBulkExport() {
    const all = contacts.filter(c => selected.includes(c.id));
    const csv = [
      ["Email","Prénom","Nom","Téléphone","Entreprise","Tags","Statut"].join(","),
      ...all.map(c => [c.email, c.firstName||"", c.lastName||"", c.phone||"", c.company||"", (c.tags||[]).join(";"), c.status].join(","))
    ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type:"text/csv" })),
      download: `contacts-selection-${new Date().toISOString().split("T")[0]}.csv`
    });
    a.click();
  }

  function toggleSelect(id) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  function toggleAll() {
    setSelected(selected.length === contacts.length ? [] : contacts.map(c => c.id));
  }

  async function handleExport() {
    const res = await client.get("/contacts", { params: { limit: 10000, status: filterStatus } });
    const rows = res.data.contacts;
    const csv = [
      ["Email","Prénom","Nom","Téléphone","Entreprise","Tags","Statut"].join(","),
      ...rows.map(c => [c.email, c.firstName||"", c.lastName||"", c.phone||"", c.company||"", (c.tags||[]).join(";"), c.status].join(","))
    ].join("\n");
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
      download: `contacts-${new Date().toISOString().split("T")[0]}.csv`
    });
    a.click();
  }

  const allSelected = contacts.length > 0 && selected.length === contacts.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          <Stat label="Total"       value={stats.total}        color={T.primary} />
          <Stat label="Actifs"      value={stats.active}       color="#10b981" />
          <Stat label="Désabonnés"  value={stats.unsubscribed} color="#f59e0b" />
          <Stat label="Rebonds"     value={stats.bounced}      color="#ef4444" />
          <Stat label="Plaintes"    value={stats.complained}   color="#8b5cf6" />
        </div>
      )}

      {/* Toolbar */}
      <div style={{ ...styles.card, padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <Search size={15} color={T.textSub} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
            <input placeholder="Rechercher..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ ...styles.input, paddingLeft: 36 }} />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            style={{ ...styles.input, width: "auto", minWidth: 140 }}>
            <option value="">Tous les statuts</option>
            <option value="ACTIVE">Actifs</option>
            <option value="UNSUBSCRIBED">Désabonnés</option>
            <option value="BOUNCED">Rebonds</option>
            <option value="COMPLAINED">Plaintes</option>
            <option value="BLOCKED">Bloqués</option>
          </select>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button onClick={() => setShowImport(true)}
              style={{ ...styles.btn, background:"#fff", color:T.primary, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
              <Upload size={14}/> Importer
            </button>
            <button onClick={handleExport}
              style={{ ...styles.btn, background:"#fff", color:T.primary, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
              <Download size={14}/> Exporter
            </button>
            <button onClick={() => { setEditing(null); setShowContact(true); }}
              style={{ ...styles.btnGray, display:"flex", alignItems:"center", gap:6 }}>
              <Plus size={14}/> Nouveau
            </button>
          </div>
        </div>
      </div>

      {selected.length > 0 && (
        <BulkBar
          count={selected.length}
          total={contacts.length}
          onDelete={handleBulkDelete}
          onAddToList={handleBulkAddToList}
          onExport={handleBulkExport}
          onChangeStatus={handleBulkStatus}
          onCancel={() => setSelected([])}
        />
      )}

      {/* Table */}
      <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign:"center", color: T.textSub }}>Chargement...</div>
        ) : contacts.length === 0 ? (
          <div style={{ padding: 60, textAlign:"center" }}>
            <Users size={44} color={T.border} style={{ marginBottom:12 }}/>
            <p style={{ color: T.textSub, margin:"0 0 16px" }}>Aucun contact trouvé</p>
            <button onClick={() => setShowContact(true)} style={styles.btn}>Créer votre premier contact</button>
          </div>
        ) : (
          <>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:14 }}>
                <thead>
                  <tr style={{ background: T.bg || "#f8fafc" }}>
                    <th style={{ padding:"12px 16px", textAlign:"left", width:40 }}>
                      <button onClick={toggleAll} style={{ background:"none", border:"none", cursor:"pointer", color: T.textSub, display:"flex" }}>
                        {allSelected ? <CheckSquare size={17} color={T.primary}/> : <Square size={17}/>}
                      </button>
                    </th>
                    {["Email","Nom","Entreprise","Tags","Statut","Listes",""].map(h => (
                      <th key={h} style={{ padding:"12px 16px", textAlign:"left", color: T.textSub, fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c, i) => (
                    <tr key={c.id} style={{ borderTop:`1px solid ${T.border}`, background: selected.includes(c.id) ? "#eff6ff" : i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"12px 16px" }}>
                        <button onClick={() => toggleSelect(c.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", color: T.textSub }}>
                          {selected.includes(c.id) ? <CheckSquare size={17} color={T.primary}/> : <Square size={17}/>}
                        </button>
                      </td>
                      <td style={{ padding:"12px 16px", color: T.text, fontWeight:500 }}>{c.email}</td>
                      <td style={{ padding:"12px 16px", color: T.textSub }}>
                        {[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td style={{ padding:"12px 16px", color: T.textSub }}>{c.company || "—"}</td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                          {(c.tags||[]).slice(0,3).map(tag => (
                            <span key={tag} style={{ background:"#eff6ff", color: T.primary, fontSize:11, padding:"2px 8px", borderRadius:99 }}>{tag}</span>
                          ))}
                          {(c.tags||[]).length > 3 && <span style={{ color: T.textSub, fontSize:11 }}>+{c.tags.length-3}</span>}
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px" }}><CustomBadge status={c.status}/></td>
                      <td style={{ padding:"12px 16px", color: T.textSub, fontSize:12 }}>
                        {(c.lists||[]).length > 0
                          ? (c.lists||[]).map(m => m.list?.name).filter(Boolean).join(", ")
                          : "—"}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <RowMenu contact={c}
                          onEdit={ct => { setEditing(ct); setShowContact(true); }}
                          onDelete={handleDelete}/>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color: T.textSub }}>{total} contacts</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                    style={{ ...styles.btn, background:"#fff", color:T.primary, border:`1px solid ${T.border}`, opacity:page===1?.5:1, display:"flex", alignItems:"center", gap:4 }}>
                    <ChevronLeft size={15}/> Préc.
                  </button>
                  <span style={{ fontSize:13, color: T.textSub }}>Page {page}/{totalPages}</span>
                  <button disabled={page===totalPages} onClick={() => setPage(p=>p+1)}
                    style={{ ...styles.btn, background:"#fff", color:T.primary, border:`1px solid ${T.border}`, opacity:page===totalPages?.5:1, display:"flex", alignItems:"center", gap:4 }}>
                    Suiv. <ChevronRight size={15}/>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showContact && (
        <ContactModal contact={editing}
          onClose={() => { setShowContact(false); setEditing(null); }}
          onSave={() => { refresh(); setShowContact(false); setEditing(null); }}/>
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={() => { refresh(); setShowImport(false); }}/>
      )}
    </div>
  );
}