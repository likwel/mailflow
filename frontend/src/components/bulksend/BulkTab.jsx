// src/components/bulksend/BulkTab.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
  Send, FileText, Code, Eye, EyeOff, Search,
  ChevronDown, ChevronUp, Zap, X, Check,
  Users, List, Plus, Trash2, Upload, AlertCircle
} from "lucide-react";
import VariablesPanel from "./VariablesPanel";
import PreviewModal from "./PreviewModal";

// ─── Réutilisation depuis ManualTab ──────────────────
function detectVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches)];
}
function resolveVars(text, values) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => values[k] || `{{${k}}}`);
}

// ─── Preview iframe ───────────────────────────────────
function HtmlPreview({ html, varValues }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      <div style={{ padding:"8px 14px", background:"#f8fafc", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
        {["#ef4444","#f59e0b","#10b981"].map(c=><div key={c} style={{ width:11, height:11, borderRadius:"50%", background:c }}/>)}
        <span style={{ marginLeft:8, fontSize:13, color:T.textSub }}>Aperçu email</span>
      </div>
      <iframe srcDoc={resolveVars(html||"", varValues)||"<p style='color:#94a3b8;padding:24px;font-family:sans-serif'>Aucun contenu</p>"}
        style={{ width:"100%", minHeight:260, border:"none", display:"block" }}
        sandbox="allow-same-origin" title="preview"/>
    </div>
  );
}

// ─── Variables panel (identique ManualTab) ────────────
function VariablesPanel1({ variables, values, onChange, onImport }) {
  const fileRef = useRef();
  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const lines = (await file.text()).split("\n").map(l=>l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/["]/g,""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
      const obj = {}; headers.forEach((h,i)=>{ obj[h]=vals[i]||""; }); return obj;
    });
    onImport(rows); e.target.value="";
  }
  if (!variables.length) return (
    <div style={{ padding:"16px 18px", background:"#f8fafc", borderRadius:10, border:`1px dashed ${T.border}`, textAlign:"center" }}>
      <p style={{ color:T.textSub, fontSize:14, margin:0 }}>
        Aucune variable — écrivez <code style={{ background:"#e2e8f0", padding:"1px 7px", borderRadius:4, fontSize:13 }}>{"{{nomVariable}}"}</code> dans le sujet ou le corps
      </p>
    </div>
  );
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#f8fafc", borderBottom:`1px solid ${T.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <Zap size={16} color={T.primary}/>
          <span style={{ fontWeight:600, fontSize:14, color:T.text }}>Variables utilisées ({variables.length})</span>
        </div>
        <button onClick={()=>fileRef.current?.click()}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", background:"#fff", border:`1px solid ${T.border}`, borderRadius:8, cursor:"pointer", fontSize:13, color:T.text, fontWeight:500 }}>
          <Upload size={14}/> Importer CSV
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display:"none" }}/>
      </div>
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        <p style={{ color:T.textSub, fontSize:13, margin:"0 0 4px" }}>Valeur par défaut si le contact ne possède pas ce champ :</p>
        {variables.map(varKey => {
          const name = varKey.replace(/\{\{|\}\}/g,"");
          return (
            <div key={varKey} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <code style={{ minWidth:130, background:"#eff6ff", color:T.primary, padding:"4px 10px", borderRadius:6, fontSize:13, fontWeight:600 }}>{varKey}</code>
              <div style={{ flex:1, position:"relative" }}>
                <input value={values[name]||""} onChange={e=>onChange(name, e.target.value)}
                  placeholder={`Valeur par défaut…`}
                  style={{ ...styles.input, fontSize:14, paddingRight: values[name]?32:14 }}/>
                {values[name] && (
                  <button onClick={()=>onChange(name,"")}
                    style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:T.textSub, display:"flex" }}>
                    <X size={14}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding:"10px 16px", background:"#fffbeb", borderTop:"1px solid #fef3c7" }}>
        <p style={{ color:"#92400e", fontSize:12, margin:0 }}>
          💡 Format CSV : <code style={{ background:"#fef3c7", padding:"1px 6px", borderRadius:4 }}>
            {variables.map(v=>v.replace(/\{\{|\}\}/g,"")).join(",")}
          </code>
        </p>
      </div>
    </div>
  );
}

// ─── Sélecteur contacts / listes ─────────────────────
function RecipientPicker({ selectedEmails, onChange }) {
  const [mode, setMode]           = useState("contacts"); // "contacts" | "lists"
  const [contacts, setContacts]   = useState([]);
  const [lists, setLists]         = useState([]);
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(false);
  const [checkedC, setCheckedC]   = useState([]); // contact ids
  const [checkedL, setCheckedL]   = useState([]); // list ids
  const [expanded, setExpanded]   = useState(true);

  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const r = await client.get("/contacts", { params:{ search, status:"ACTIVE", limit:100 } });
      setContacts(r.data.contacts||[]);
    } finally { setLoading(false); }
  }, [search]);

  // Fetch lists
  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const r = await client.get("/contact-lists");
      setLists(r.data.lists||[]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (mode==="contacts") fetchContacts(); else fetchLists(); }, [mode, fetchContacts, fetchLists]);
  useEffect(() => { if (mode==="contacts") fetchContacts(); }, [search]);

  // Résoudre les emails sélectionnés et remonter
  async function resolve(cIds, lIds) {
    let emails = new Set();
    // Contacts directs
    contacts.filter(c=>cIds.includes(c.id)).forEach(c=>emails.add(c.email));
    // Listes → charger les membres
    for (const lid of lIds) {
      try {
        const r = await client.get(`/contact-lists/${lid}`);
        (r.data.contacts||[]).forEach(m => { if (m.contact?.email) emails.add(m.contact.email); });
      } catch {}
    }
    onChange([...emails]);
  }

  function toggleC(id) {
    const next = checkedC.includes(id) ? checkedC.filter(x=>x!==id) : [...checkedC, id];
    setCheckedC(next); resolve(next, checkedL);
  }
  function toggleL(id) {
    const next = checkedL.includes(id) ? checkedL.filter(x=>x!==id) : [...checkedL, id];
    setCheckedL(next); resolve(checkedC, next);
  }
  function toggleAllC() {
    const all = contacts.map(c=>c.id);
    const next = checkedC.length===contacts.length ? [] : all;
    setCheckedC(next); resolve(next, checkedL);
  }
  function toggleAllL() {
    const all = lists.map(l=>l.id);
    const next = checkedL.length===lists.length ? [] : all;
    setCheckedL(next); resolve(checkedC, next);
  }

  const totalSelected = selectedEmails.length;
  const allC = contacts.length>0 && checkedC.length===contacts.length;
  const allL = lists.length>0 && checkedL.length===lists.length;

  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", background:"#f8fafc", borderBottom: expanded?`1px solid ${T.border}`:"none", cursor:"pointer" }}
        onClick={()=>setExpanded(o=>!o)}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Users size={17} color={T.primary}/>
          <span style={{ fontWeight:600, fontSize:15, color:T.text }}>Sélection des destinataires</span>
          {totalSelected>0 && (
            <span style={{ background:T.primary, color:"#fff", borderRadius:99, fontSize:12, fontWeight:700, padding:"2px 10px" }}>
              {totalSelected} email{totalSelected>1?"s":""}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} color={T.textSub}/> : <ChevronDown size={16} color={T.textSub}/>}
      </div>

      {expanded && (
        <div style={{ padding:16, display:"flex", flexDirection:"column", gap:12 }}>

          {/* Mode tabs */}
          <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3, gap:2, alignSelf:"flex-start" }}>
            {[
              { id:"contacts", icon:<Users size={14}/>,  label:"Contacts" },
              { id:"lists",    icon:<List size={14}/>,   label:"Listes" },
            ].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 16px", borderRadius:6, border:"none", cursor:"pointer", fontSize:13, fontWeight:500,
                  background: mode===m.id?"#fff":"transparent",
                  color:      mode===m.id?T.primary:T.textSub,
                  boxShadow:  mode===m.id?"0 1px 4px rgba(0,0,0,.08)":"none",
                  transition:"all .15s" }}>
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Search (contacts seulement) */}
          {mode==="contacts" && (
            <div style={{ position:"relative" }}>
              <Search size={15} color={T.textSub} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }}/>
              <input placeholder="Rechercher un contact..." value={search}
                onChange={e=>setSearch(e.target.value)}
                style={{ ...styles.input, paddingLeft:36, fontSize:14 }}/>
            </div>
          )}

          {/* Liste scrollable */}
          <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", maxHeight:280, overflowY:"auto" }}>

            {/* Select all bar */}
            <div onClick={mode==="contacts"?toggleAllC:toggleAllL}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f8fafc", borderBottom:`1px solid ${T.border}`, cursor:"pointer" }}>
              <Checkbox checked={mode==="contacts"?allC:allL} primary={T.primary}/>
              <span style={{ fontSize:13, color:T.textSub, fontWeight:500 }}>
                Tout sélectionner ({mode==="contacts"?contacts.length:lists.length})
              </span>
            </div>

            {loading ? (
              <div style={{ padding:24, textAlign:"center", color:T.textSub, fontSize:14 }}>Chargement...</div>
            ) : mode==="contacts" ? (
              contacts.length===0 ? (
                <div style={{ padding:24, textAlign:"center", color:T.textSub, fontSize:14 }}>
                  {search?"Aucun résultat":"Aucun contact actif"}
                </div>
              ) : contacts.map((c,i)=>(
                <div key={c.id} onClick={()=>toggleC(c.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer",
                    borderTop: i>0?`1px solid ${T.border}`:"none",
                    background: checkedC.includes(c.id)?"#eff6ff":"#fff",
                    transition:"background .1s" }}>
                  <Checkbox checked={checkedC.includes(c.id)} primary={T.primary}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:500, fontSize:14, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.email}</div>
                    {(c.firstName||c.lastName||c.company) && (
                      <div style={{ fontSize:12, color:T.textSub }}>
                        {[c.firstName, c.lastName].filter(Boolean).join(" ")}
                        {c.company && ` · ${c.company}`}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              lists.length===0 ? (
                <div style={{ padding:24, textAlign:"center", color:T.textSub, fontSize:14 }}>Aucune liste disponible</div>
              ) : lists.map((l,i)=>(
                <div key={l.id} onClick={()=>toggleL(l.id)}
                  style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", cursor:"pointer",
                    borderTop: i>0?`1px solid ${T.border}`:"none",
                    background: checkedL.includes(l.id)?"#eff6ff":"#fff",
                    transition:"background .1s" }}>
                  <Checkbox checked={checkedL.includes(l.id)} primary={T.primary}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:14, color:T.text }}>{l.name}</div>
                    {l.description && <div style={{ fontSize:12, color:T.textSub }}>{l.description}</div>}
                  </div>
                  <span style={{ fontSize:12, color:T.textSub, background:"#f1f5f9", padding:"2px 8px", borderRadius:99, flexShrink:0 }}>
                    {l._count?.contacts??0} contacts
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Résumé emails résolus */}
          {totalSelected>0 && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8 }}>
              <Check size={15} color="#10b981" style={{ marginTop:2, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <span style={{ fontSize:14, color:"#065f46", fontWeight:600 }}>
                  {totalSelected} destinataire{totalSelected>1?"s":""} sélectionné{totalSelected>1?"s":""}
                </span>
                <div style={{ fontSize:12, color:"#047857", marginTop:3, lineHeight:1.5, wordBreak:"break-all" }}>
                  {selectedEmails.slice(0,5).join(", ")}{selectedEmails.length>5 && ` ... +${selectedEmails.length-5} autres`}
                </div>
              </div>
              <button onClick={()=>{ setCheckedC([]); setCheckedL([]); onChange([]); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#065f46", display:"flex", flexShrink:0 }}>
                <X size={14}/>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Checkbox helper ──────────────────────────────────
function Checkbox({ checked, primary }) {
  return checked
    ? <div style={{ width:17, height:17, borderRadius:4, background:primary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Check size={11} color="#fff"/></div>
    : <div style={{ width:17, height:17, borderRadius:4, border:`2px solid #cbd5e1`, flexShrink:0 }}/>;
}

// ─── BulkTab principal ────────────────────────────────
export default function BulkTab({ maxAllowed, loading, onSubmit }) {
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [subject, setSubject]   = useState("");
  const [html, setHtml]         = useState("");
  const [contentMode, setContentMode] = useState("html");
  const [templates, setTemplates]     = useState([]);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [tplOpen, setTplOpen]         = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [varValues, setVarValues]     = useState({});
  const [importedRows, setImportedRows] = useState([]);
  const subjectRef = useRef(null);
  const htmlRef    = useRef(null);

  useEffect(() => {
    client.get("/dashboard/templates").then(r=>setTemplates(r.data||[])).catch(()=>{});
  }, []);

  const detectedVars = detectVariables((subject||"")+" "+(html||""));
  const count = selectedEmails.length;
  const exceedsLimit = count > maxAllowed;

  // Champs détectés dans les contacts sélectionnés
  const [contactFields, setContactFields] = useState([]);

  // Quand les emails changent, charger les contacts pour extraire les champs custom
  useEffect(() => {
    if (!selectedEmails.length) return;
    client.get("/contacts", { params: { limit: 5 } })
      .then(r => {
        const contacts = r.data.contacts || [];
        const customKeys = new Set();
        contacts.forEach(c => {
          if (c.customFields && typeof c.customFields === "object") {
            Object.keys(c.customFields).forEach(k => customKeys.add(k));
          }
        });
        setContactFields([...customKeys]);
      }).catch(() => {});
  }, [selectedEmails.length]);

  function handleVarChange(name, value) {
    if (name === "__insert__") {
      insertAt(htmlRef, html, setHtml, value); return;
    }
    setVarValues(p => ({ ...p, [name]: value }));
  }

  function handleImportCSV(rows) {
    setImportedRows(rows);
    if (rows.length>0) {
      const newVals = {};
      detectedVars.forEach(v=>{ const n=v.replace(/\{\{|\}\}/g,""); if(rows[0][n]) newVals[n]=rows[0][n]; });
      setVarValues(p=>({...p,...newVals}));
    }
  }

  function applyTemplate(tpl) {
    setSelectedTpl(tpl); setSubject(tpl.subject||""); setHtml(tpl.htmlBody||""); setTplOpen(false);
  }
  function clearTemplate() { setSelectedTpl(null); setSubject(""); setHtml(""); setContentMode("html"); }

  function insertAt(ref, value, setValue, key) {
    const el = ref.current;
    if (!el) { setValue(value+key); return; }
    const s=el.selectionStart??value.length, e=el.selectionEnd??value.length;
    setValue(value.slice(0,s)+key+value.slice(e));
    setTimeout(()=>{ el.focus(); el.setSelectionRange(s+key.length,s+key.length); },0);
  }

  const canSend = count>0 && subject.trim() && html.trim() && !exceedsLimit && !loading;

  function handleSubmit() {
    onSubmit({ to: selectedEmails, subject, html, varValues });
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* ── Sélecteur destinataires ── */}
      <section>
        <label style={lbl}>Destinataires</label>
        <div style={{ marginTop:8 }}>
          <RecipientPicker selectedEmails={selectedEmails} onChange={setSelectedEmails}/>
        </div>
        {exceedsLimit && (
          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:8, color:T.danger, fontSize:14, fontWeight:600 }}>
            <AlertCircle size={15}/> Limite dépassée ({count}/{maxAllowed})
          </div>
        )}
      </section>

      {/* ── Sujet ── */}
      <section>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <label style={lbl}>Sujet de l'email</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {detectedVars.slice(0,3).map(v=>(
              <button key={v} onClick={()=>insertAt(subjectRef,subject,setSubject,v)}
                style={varChip}>{v}</button>
            ))}
          </div>
        </div>
        <input ref={subjectRef} value={subject} onChange={e=>setSubject(e.target.value)}
          placeholder="Ex : Bonjour {{firstName}}, voici notre newsletter"
          disabled={loading} style={{ ...styles.input, fontSize:15 }}/>
      </section>

      {/* ── Corps ── */}
      <section>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <label style={lbl}>Corps de l'email</label>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ display:"flex", background:"#f1f5f9", borderRadius:8, padding:3 }}>
              {[{id:"html",icon:<Code size={14}/>,label:"HTML libre"},{id:"template",icon:<FileText size={14}/>,label:"Template"}].map(m=>(
                <button key={m.id} onClick={()=>{ setContentMode(m.id); if(m.id==="html"&&selectedTpl) clearTemplate(); }}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:6, border:"none", cursor:"pointer", fontSize:"1rem", fontWeight:500,
                    background:contentMode===m.id?"#fff":"transparent", color:contentMode===m.id?T.primary:T.textSub,
                    boxShadow:contentMode===m.id?"0 1px 4px rgba(0,0,0,.08)":"none", transition:"all .15s" }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            <button onClick={()=>setShowPreview(o=>!o)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", background:showPreview?"#eff6ff":"#fff", border:`1px solid ${showPreview?T.primary:T.border}`, borderRadius:8, cursor:"pointer", fontSize:"1rem", color:showPreview?T.primary:T.text, fontWeight:500 }}>
              {showPreview?<EyeOff size={14}/>:<Eye size={14}/>}
              {showPreview?"Masquer":"Aperçu"}
            </button>
          </div>
        </div>

        {/* Template dropdown */}
        {contentMode==="template" && (
          <div style={{ marginBottom:14 }}>
            <div style={{ position:"relative" }}>
              <button onClick={()=>setTplOpen(o=>!o)}
                style={{ ...styles.input, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", background:selectedTpl?"#eff6ff":"#fff", fontSize:15 }}>
                <span style={{ display:"flex", alignItems:"center", gap:8, color:selectedTpl?T.primary:T.textSub }}>
                  <FileText size={16}/>{selectedTpl?selectedTpl.name:"— Choisir un template —"}
                </span>
                {tplOpen?<ChevronUp size={15} color={T.textSub}/>:<ChevronDown size={15} color={T.textSub}/>}
              </button>
              {tplOpen && (
                <>
                  <div onClick={()=>setTplOpen(false)} style={{ position:"fixed", inset:0, zIndex:90 }}/>
                  <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:100, background:"#fff", border:`1px solid ${T.border}`, borderRadius:10, boxShadow:"0 6px 20px rgba(0,0,0,.1)", maxHeight:260, overflowY:"auto" }}>
                    {templates.length===0
                      ? <div style={{ padding:20, textAlign:"center", color:T.textSub, fontSize:14 }}>Aucun template</div>
                      : templates.map(tpl=>(
                        <button key={tpl.id} onClick={()=>applyTemplate(tpl)}
                          style={{ display:"flex", alignItems:"center", gap:12, width:"100%", padding:"12px 16px", background:selectedTpl?.id===tpl.id?"#eff6ff":"none", border:"none", cursor:"pointer", textAlign:"left" }}
                          onMouseEnter={e=>{ if(selectedTpl?.id!==tpl.id) e.currentTarget.style.background="#f8fafc"; }}
                          onMouseLeave={e=>{ if(selectedTpl?.id!==tpl.id) e.currentTarget.style.background="none"; }}>
                          <div style={{ width:38, height:38, borderRadius:8, background:tpl.type==="SYSTEM"?"#f0fdf4":"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                            <FileText size={17} color={tpl.type==="SYSTEM"?"#10b981":T.primary}/>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:600, fontSize:14, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tpl.name}</div>
                            <div style={{ fontSize:13, color:T.textSub, marginTop:2 }}>{tpl.subject}</div>
                          </div>
                          {tpl.type==="SYSTEM" && <span style={{ fontSize:11, fontWeight:700, background:"#d1fae5", color:"#065f46", padding:"2px 8px", borderRadius:99 }}>SYSTÈME</span>}
                        </button>
                      ))
                    }
                  </div>
                </>
              )}
            </div>
            {selectedTpl && (
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, padding:"9px 14px", background:"#eff6ff", borderRadius:8 }}>
                <Check size={14} color={T.primary}/>
                <span style={{ fontSize:13, color:T.primary, fontWeight:500 }}>Template appliqué — modifiable ci-dessous</span>
                <button onClick={clearTemplate} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:T.textSub, fontSize:13 }}>Effacer</button>
              </div>
            )}
          </div>
        )}

        <textarea ref={htmlRef} value={html} onChange={e=>setHtml(e.target.value)}
          placeholder={"<h1>Bonjour {{firstName}} !</h1>\n<p>Message pour {{company}}...</p>"}
          rows={10} disabled={loading}
          style={{ ...styles.input, resize:"vertical", fontFamily:"monospace", fontSize:13, lineHeight:1.6, padding:14, opacity:loading?.5:1 }}/>
      </section>

      {/* ── Variables ── */}
      <section>
        <label style={{ ...lbl, marginBottom:10 }}>Variables de personnalisation</label>
        <VariablesPanel variables={detectedVars} values={varValues} onChange={handleVarChange} onImport={handleImportCSV}/>
        {importedRows.length>0 && (
          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:8 }}>
            <Check size={15} color="#10b981"/>
            <span style={{ fontSize:14, color:"#065f46", fontWeight:500 }}>{importedRows.length} ligne{importedRows.length>1?"s":""} importée{importedRows.length>1?"s":""}</span>
            <button onClick={()=>setImportedRows([])} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"#065f46" }}><X size={14}/></button>
          </div>
        )}
      </section>

      {/* ── Aperçu ── */}
      {showPreview && (
        <PreviewModal
            html={html}
            subject={subject}
            varValues={varValues}
            onClose={() => setShowPreview(false)}
        />
      )}

      {/* ── Envoi ── */}
      <button onClick={handleSubmit} disabled={!canSend}
        style={{ ...styles.btnGray, display:"flex", alignItems:"center", justifyContent:"center", gap:8, alignSelf:"flex-start", minWidth:240, padding:"12px 24px", fontSize:15, opacity:canSend?1:.5, cursor:canSend?"pointer":"not-allowed" }}>
        <Send size={16}/>
        {loading?"Envoi en cours...":`Envoyer à ${count} destinataire${count>1?"s":""}`}
      </button>
    </div>
  );
}

const lbl = { color:T.text, fontSize:15, fontWeight:600, display:"block" };
const varChip = { background:"#eff6ff", color:T.primary, border:"1px solid #bfdbfe", borderRadius:6, padding:"3px 10px", fontSize:13, cursor:"pointer", fontWeight:500 };