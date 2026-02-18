// src/components/contacts/BulkBar.jsx
import { useState, useEffect, useRef } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
  Trash2, X, Tag, List, Download, ChevronDown,
  CheckCircle, UserX, AlertTriangle
} from "lucide-react";

// ─── Status options ────────────────────────────────────
const STATUS_OPTIONS = [
  { value:"ACTIVE",       label:"Actif",       color:"#10b981", icon:<CheckCircle size={13}/> },
  { value:"UNSUBSCRIBED", label:"Désabonné",   color:"#f59e0b", icon:<UserX size={13}/> },
  { value:"BLOCKED",      label:"Bloqué",      color:"#64748b", icon:<AlertTriangle size={13}/> },
];

// ─── Dropdown generic ─────────────────────────────────
function Dropdown({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:200,
          background:"#fff", border:`1px solid ${T.border}`, borderRadius:10,
          boxShadow:"0 8px 24px rgba(0,0,0,.12)", minWidth:200, overflow:"hidden"
        }}>
          {typeof children === "function" ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

// ─── Add to list dropdown ─────────────────────────────
function AddToListDropdown({ onSelect }) {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get("/contact-lists")
      .then(r => setLists(r.data.lists || []))
      .finally(() => setLoading(false));
  }, []);

  return (children => (
    <>
      <div style={{ padding:"10px 14px 6px", fontSize:11, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:".05em" }}>
        Choisir une liste
      </div>
      {loading ? (
        <div style={{ padding:"12px 14px", color:T.textSub, fontSize:13 }}>Chargement...</div>
      ) : lists.length === 0 ? (
        <div style={{ padding:"12px 14px", color:T.textSub, fontSize:13 }}>Aucune liste disponible</div>
      ) : lists.map(l => (
        <button key={l.id}
          onClick={() => { onSelect(l.id, l.name); children(); }}
          style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"9px 14px", background:"none", border:"none", cursor:"pointer", fontSize:13, color:T.text, gap:10 }}
          onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
          onMouseLeave={e => e.currentTarget.style.background="none"}
        >
          <span style={{ fontWeight:500 }}>{l.name}</span>
          <span style={{ fontSize:11, color:T.textSub, background:"#f1f5f9", borderRadius:99, padding:"1px 7px" }}>
            {l._count?.contacts ?? 0}
          </span>
        </button>
      ))}
    </>
  ));
}

// ─── BulkBar ──────────────────────────────────────────
export default function BulkBar({ count, total, onDelete, onAddToList, onExport, onChangeStatus, onCancel }) {
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }

  async function handleStatus(status, label) {
    await onChangeStatus(status);
    showToast(`${count} contact(s) marqué(s) "${label}"`);
  }

  async function handleAddToList(listId, listName) {
    await onAddToList(listId);
    showToast(`${count} contact(s) ajouté(s) à "${listName}"`);
  }

  return (
    <>
      {/* Bar */}
      <div style={{
        position:"sticky", top:16, zIndex:100,
        display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
        background:"linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",
        padding: "14px 24px",
        borderRadius:12,
        boxShadow:"0 4px 20px rgba(0,0,0,.25)",
        border:"1px solid rgba(255,255,255,.08)"
      }}>

        {/* Count badge */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:4 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>
            {count}
          </div>
          <span style={{ color:"rgba(255,255,255,.7)", fontSize:13 }}>
            sélectionné{count > 1 ? "s" : ""} / {total}
          </span>
        </div>

        <div style={{ width:1, height:24, background:"rgba(255,255,255,.12)", margin:"0 4px" }}/>

        {/* Ajouter à une liste */}
        <Dropdown trigger={
          <button style={ghostBtn}>
            <List size={14}/> Ajouter à une liste <ChevronDown size={12}/>
          </button>
        }>
          {AddToListDropdown({ onSelect: handleAddToList })}
        </Dropdown>

        {/* Changer statut */}
        <Dropdown trigger={
          <button style={ghostBtn}>
            <Tag size={14}/> Changer statut <ChevronDown size={12}/>
          </button>
        }>
          {close => (
            <>
              <div style={{ padding:"10px 14px 6px", fontSize:11, fontWeight:700, color:T.textSub, textTransform:"uppercase", letterSpacing:".05em" }}>
                Nouveau statut
              </div>
              {STATUS_OPTIONS.map(s => (
                <button key={s.value}
                  onClick={() => { handleStatus(s.value, s.label); close(); }}
                  style={{ display:"flex", alignItems:"center", gap:9, width:"100%", padding:"9px 14px", background:"none", border:"none", cursor:"pointer", fontSize:13, color:T.text }}
                  onMouseEnter={e => e.currentTarget.style.background="#f8fafc"}
                  onMouseLeave={e => e.currentTarget.style.background="none"}
                >
                  <span style={{ color:s.color }}>{s.icon}</span>
                  <span style={{ fontWeight:500 }}>{s.label}</span>
                </button>
              ))}
            </>
          )}
        </Dropdown>

        {/* Export */}
        <button onClick={onExport} style={ghostBtn}>
          <Download size={14}/> Exporter
        </button>

        <div style={{ width:1, height:24, background:"rgba(255,255,255,.12)", margin:"0 4px" }}/>

        {/* Supprimer */}
        <button onClick={onDelete}
          style={{ ...ghostBtn, color:"#fca5a5", borderColor:"rgba(252,165,165,.25)" }}>
          <Trash2 size={14}/> Supprimer
        </button>

        {/* Annuler */}
        <button onClick={onCancel}
          style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,.4)", display:"flex", alignItems:"center", gap:4, fontSize:13, padding:"4px 6px", borderRadius:6 }}
          onMouseEnter={e => e.currentTarget.style.color="rgba(255,255,255,.8)"}
          onMouseLeave={e => e.currentTarget.style.color="rgba(255,255,255,.4)"}
        >
          <X size={15}/> Annuler
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background: toast.type==="error" ? "#ef4444" : "#1e293b",
          color:"#fff", padding:"10px 20px", borderRadius:10,
          boxShadow:"0 4px 20px rgba(0,0,0,.2)", fontSize:14, fontWeight:500,
          zIndex:9999, display:"flex", alignItems:"center", gap:8,
          animation:"slideUp .2s ease"
        }}>
          {toast.type !== "error" && <CheckCircle size={16} color="#4ade80"/>}
          {toast.msg}
        </div>
      )}
    </>
  );
}

const ghostBtn = {
  display:"flex", alignItems:"center", gap:6,
  background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)",
  color:"rgba(255,255,255,.85)", borderRadius:8, padding:"6px 12px",
  cursor:"pointer", fontSize:13, fontWeight:500, transition:"all .15s",
};