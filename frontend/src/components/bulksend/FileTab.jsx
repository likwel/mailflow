// src/components/bulksend/FileTab.jsx
import { useState, useRef } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
  Send, FileText, Code, Eye, EyeOff, Upload, X,
  Check, ChevronDown, ChevronUp, Zap, AlertCircle,
  UserPlus, Users, Info
} from "lucide-react";
import VariablesPanel from "./VariablesPanel";
import PreviewModal from "./PreviewModal";

// ─── Parsers ──────────────────────────────────────────
function parseCsv(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["]/g, ""));
  const hasHeader = headers.some(h => ["email","mail","prénom","prenom","nom","name","firstname","lastname"].includes(h));

  if (hasHeader) {
    return lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return {
        email:     obj.email || obj.mail || "",
        firstName: obj.firstname || obj.prenom || obj.prénom || obj.first || "",
        lastName:  obj.lastname  || obj.nom    || obj.last   || "",
        phone:     obj.phone     || obj.telephone || obj.tel || "",
        company:   obj.company   || obj.entreprise || obj.societe || "",
        tags:      obj.tags      || obj.tag || "",
        _raw: obj,
      };
    }).filter(r => r.email && r.email.includes("@"));
  } else {
    // Pas d'entête : chaque ligne = un email
    return lines
      .map(l => l.split(/[,;\t]/)[0].trim())
      .filter(e => e.includes("@"))
      .map(email => ({ email, firstName:"", lastName:"", phone:"", company:"", tags:"" }));
  }
}

function parseTxt(text) {
  return text.split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(e => e.includes("@"))
    .map(email => ({ email, firstName:"", lastName:"", phone:"", company:"", tags:"" }));
}

// ─── Détection variables ──────────────────────────────
function detectVariables(text) {
  const m = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(m)];
}
function resolveVars(text, vals) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] || `{{${k}}}`);
}

// ─── Preview iframe ───────────────────────────────────
function HtmlPreview({ html, varValues }) {
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      <div style={{ padding:"8px 14px", background:"#f8fafc", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:6 }}>
        {["#ef4444","#f59e0b","#10b981"].map(c=><div key={c} style={{ width:11,height:11,borderRadius:"50%",background:c }}/>)}
        <span style={{ marginLeft:8, fontSize:13, color:T.textSub }}>Aperçu email</span>
      </div>
      <iframe srcDoc={resolveVars(html||"", varValues)||"<p style='color:#94a3b8;padding:24px;font-family:sans-serif'>Aucun contenu</p>"}
        style={{ width:"100%", minHeight:260, border:"none", display:"block" }}
        sandbox="allow-same-origin" title="preview"/>
    </div>
  );
}

// ─── Variables panel ──────────────────────────────────
function VariablesPanel1({ variables, values, onChange }) {
  if (!variables.length) return (
    <div style={{ padding:"14px 18px", background:"#f8fafc", borderRadius:10, border:`1px dashed ${T.border}`, textAlign:"center" }}>
      <p style={{ color:T.textSub, fontSize:14, margin:0 }}>
        Aucune variable — utilisez <code style={{ background:"#e2e8f0", padding:"1px 7px", borderRadius:4, fontSize:13 }}>{"{{variable}}"}</code> dans le sujet ou le corps
      </p>
    </div>
  );
  return (
    <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
      <div style={{ padding:"11px 16px", background:"#f8fafc", borderBottom:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:8 }}>
        <Zap size={15} color={T.primary}/>
        <span style={{ fontWeight:600, fontSize:14, color:T.text }}>Variables détectées ({variables.length})</span>
        <span style={{ marginLeft:"auto", fontSize:12, color:T.textSub }}>Valeur par défaut si champ absent</span>
      </div>
      <div style={{ padding:"14px 16px", display:"flex", flexDirection:"column", gap:10 }}>
        {variables.map(varKey => {
          const name = varKey.replace(/\{\{|\}\}/g,"");
          return (
            <div key={varKey} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <code style={{ minWidth:130, background:"#eff6ff", color:T.primary, padding:"4px 10px", borderRadius:6, fontSize:13, fontWeight:600 }}>{varKey}</code>
              <div style={{ flex:1, position:"relative" }}>
                <input value={values[name]||""} onChange={e=>onChange(name,e.target.value)}
                  placeholder={`Valeur par défaut pour ${name}…`}
                  style={{ ...styles.input, fontSize:14, paddingRight:values[name]?32:14 }}/>
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
    </div>
  );
}

// ─── Modal : enregistrer les contacts ? ──────────────
function SaveContactsModal({ rows, onConfirm, onSkip, onClose }) {
  const [lists, setLists]           = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [saving, setSaving]         = useState(false);
  const [result, setResult]         = useState(null);

  useState(() => {
    client.get("/contact-lists").then(r => setLists(r.data.lists||[])).catch(()=>{});
  });

  async function handleSave() {
    setSaving(true);
    try {
      const res = await client.post("/contacts/import", {
        contacts: rows,
        listId: selectedList || undefined,
      });
      setResult(res.data);
    } catch (e) {
      console.error(e);
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ ...styles.card, width:"100%", maxWidth:480, padding:28, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", color:T.textSub }}><X size={20}/></button>

        {!result ? (
          <>
            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ width:48, height:48, borderRadius:12, background:"#eff6ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <UserPlus size={22} color={T.primary}/>
              </div>
              <div>
                <h2 style={{ margin:0, color:T.text, fontSize:19, fontWeight:700 }}>Enregistrer les contacts ?</h2>
                <p style={{ margin:"3px 0 0", color:T.textSub, fontSize:13 }}>
                  {rows.length} contact{rows.length>1?"s":""} détecté{rows.length>1?"s":""} dans le fichier
                </p>
              </div>
            </div>

            {/* Infos */}
            <div style={{ padding:"12px 14px", background:"#f8fafc", borderRadius:8, marginBottom:18, display:"flex", gap:10 }}>
              <Info size={16} color={T.primary} style={{ flexShrink:0, marginTop:1 }}/>
              <p style={{ color:T.textSub, fontSize:13, margin:0, lineHeight:1.6 }}>
                Vous pouvez enregistrer ces contacts dans votre base pour les réutiliser plus tard, ou simplement envoyer l'email sans les sauvegarder.
              </p>
            </div>

            {/* Liste optionnelle */}
            <div style={{ marginBottom:20 }}>
              <label style={{ color:T.text, fontSize:14, fontWeight:600, display:"block", marginBottom:8 }}>
                Ajouter à une liste <span style={{ color:T.textSub, fontWeight:400 }}>(optionnel)</span>
              </label>
              <select value={selectedList} onChange={e=>setSelectedList(e.target.value)}
                style={{ ...styles.input, fontSize:14 }}>
                <option value="">— Aucune liste —</option>
                {lists.map(l=><option key={l.id} value={l.id}>{l.name} ({l._count?.contacts??0})</option>)}
              </select>
            </div>

            {/* Aperçu des 4 premiers */}
            <div style={{ border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", marginBottom:20 }}>
              {rows.slice(0,4).map((r,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 14px", borderTop:i>0?`1px solid ${T.border}`:"none", background:i%2===0?"#fff":"#fafafa" }}>
                  <Users size={13} color={T.textSub}/>
                  <span style={{ fontSize:13, color:T.text, fontWeight:500 }}>{r.email}</span>
                  {(r.firstName||r.lastName) && (
                    <span style={{ fontSize:12, color:T.textSub }}>— {[r.firstName,r.lastName].filter(Boolean).join(" ")}</span>
                  )}
                </div>
              ))}
              {rows.length>4 && (
                <div style={{ padding:"8px 14px", background:"#f8fafc", borderTop:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:12, color:T.textSub }}>... et {rows.length-4} autres</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onSkip}
                style={{ ...styles.btn, flex:1, background:"#fff", color:T.text, border:`1px solid ${T.border}`, fontSize:14 }}>
                Non, envoyer seulement
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ ...styles.btn, flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontSize:14 }}>
                <UserPlus size={15}/>
                {saving ? "Enregistrement..." : "Oui, enregistrer"}
              </button>
            </div>
          </>
        ) : (
          /* Résultat import */
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center", padding:"10px 0" }}>
            <div style={{ width:56, height:56, borderRadius:"50%", background:"#d1fae5", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Check size={26} color="#10b981"/>
            </div>
            <h3 style={{ margin:0, color:T.text, fontSize:18, fontWeight:700 }}>Contacts enregistrés !</h3>
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
            <button onClick={onConfirm} style={{ ...styles.btn, minWidth:160, fontSize:14 }}>
              Continuer l'envoi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── FileTab principal ────────────────────────────────
export default function FileTab({ maxAllowed, loading, onSubmit }) {
  const [rows, setRows]             = useState([]);   // contacts parsés
  const [uploadedFile, setFile]     = useState(null);
  const [subject, setSubject]       = useState("");
  const [html, setHtml]             = useState("");
  const [contentMode, setContentMode] = useState("html");
  const [templates, setTemplates]   = useState([]);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [tplOpen, setTplOpen]       = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [varValues, setVarValues]   = useState({});
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [parseError, setParseError] = useState("");
  const fileRef = useRef();
  const subjectRef = useRef();
  const htmlRef    = useRef();

  const [loadedTemplates, setLoadedTemplates] = useState(false);
  if (!loadedTemplates) {
    client.get("/dashboard/templates").then(r=>{ setTemplates(r.data||[]); setLoadedTemplates(true); }).catch(()=>{});
  }

  const detectedVars = detectVariables((subject||"")+" "+(html||""));
  const emails = rows.map(r=>r.email);
  const count = emails.length;
  const exceedsLimit = count > maxAllowed;

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    setParseError(""); setRows([]); setFile(null);
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv","txt"].includes(ext)) {
      setParseError("Format non supporté. Utilisez CSV (.csv) ou texte (.txt)");
      return;
    }
    const text = await file.text();
    const parsed = ext==="txt" ? parseTxt(text) : parseCsv(text);
    if (!parsed.length) { setParseError("Aucun email valide trouvé dans le fichier."); return; }
    setRows(parsed);
    setFile(file);
    e.target.value="";
  }

  function removeFile() { setRows([]); setFile(null); setParseError(""); }

  // Champs custom détectés dans le fichier importé
  const contactFields = rows.length > 0
    ? Object.keys(rows[0]._raw || {}).filter(k => !["email","mail","firstname","prenom","lastname","nom","phone","telephone","tel","company","entreprise","societe","tags","tag"].includes(k))
    : [];

  function handleVarChange(name, value) {
    if (name === "__insert__") {
      insertAt(htmlRef, html, setHtml, value); return;
    }
    setVarValues(p => ({ ...p, [name]: value }));
  }

  function applyTemplate(tpl) {
    setSelectedTpl(tpl); setSubject(tpl.subject||""); setHtml(tpl.htmlBody||""); setTplOpen(false);
  }
  function clearTemplate() { setSelectedTpl(null); setSubject(""); setHtml(""); setContentMode("html"); }

  function insertAt(ref, value, setValue, key) {
    const el=ref.current;
    if (!el) { setValue(value+key); return; }
    const s=el.selectionStart??value.length, e2=el.selectionEnd??value.length;
    setValue(value.slice(0,s)+key+value.slice(e2));
    setTimeout(()=>{ el.focus(); el.setSelectionRange(s+key.length,s+key.length); },0);
  }

  // Clic "Envoyer" → ouvrir modal si des données contact existent
  function handleSendClick() {
    const hasContactData = rows.some(r=>r.firstName||r.lastName||r.phone||r.company);
    if (hasContactData) { setShowSaveModal(true); }
    else { doSend(); }
  }

  function doSend() {
    onSubmit({ to: emails, subject, html, varValues });
    setShowSaveModal(false);
  }

  const canSend = count>0 && subject.trim() && html.trim() && !exceedsLimit && !loading;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:22 }}>

      {/* ── Zone d'upload ── */}
      <section>
        <label style={lbl}>Fichier de destinataires</label>
        <div style={{ marginTop:8 }}>
          {uploadedFile ? (
            <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background:"#eff6ff", border:`1px solid ${T.primary}40`, borderRadius:10 }}>
              <div style={{ width:40, height:40, borderRadius:9, background:T.primary, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <FileText size={20} color="#fff"/>
              </div>
              <div style={{ flex:1 }}>
                <p style={{ margin:0, fontSize:15, fontWeight:600, color:T.text }}>{uploadedFile.name}</p>
                <p style={{ margin:"3px 0 0", fontSize:13, color:T.textSub }}>
                  {count} email{count>1?"s":""} trouvé{count>1?"s":""}
                  {rows.some(r=>r.firstName) && ` · avec données contact`}
                </p>
              </div>
              <button onClick={removeFile}
                style={{ background:"none", border:"none", color:T.danger, cursor:"pointer", padding:4, display:"flex" }}>
                <X size={18}/>
              </button>
            </div>
          ) : (
            <label
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.primary; e.currentTarget.style.background="#eff6ff30"; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.background="transparent"; }}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:"44px 20px", border:`2px dashed ${T.border}`, borderRadius:12, cursor:"pointer", transition:"all .2s" }}>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display:"none" }}/>
              <div style={{ width:56, height:56, borderRadius:14, background:"#f1f5f9", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Upload size={26} color={T.textSub}/>
              </div>
              <div style={{ textAlign:"center" }}>
                <p style={{ margin:0, fontSize:15, color:T.text, fontWeight:600 }}>Cliquez pour importer un fichier</p>
                <p style={{ margin:"6px 0 0", fontSize:13, color:T.textSub }}>CSV ou texte (.csv, .txt)</p>
              </div>
              <div style={{ display:"flex", gap:16, fontSize:12, color:T.textSub }}>
                <span>📄 CSV avec entête : email, firstName, lastName…</span>
                <span>📝 TXT : un email par ligne</span>
              </div>
            </label>
          )}
        </div>

        {parseError && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, color:T.danger, fontSize:14 }}>
            <AlertCircle size={15}/> {parseError}
          </div>
        )}

        {count>0 && exceedsLimit && (
          <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8, color:T.danger, fontSize:14, fontWeight:600 }}>
            <AlertCircle size={15}/> Limite dépassée ({count}/{maxAllowed})
          </div>
        )}
      </section>

      {/* ── Aperçu des contacts importés ── */}
      {rows.length > 0 && (
        <section>
          <label style={{ ...lbl, marginBottom:10 }}>Aperçu des contacts importés</label>
          <div style={{ border:`1px solid ${T.border}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["Email","Prénom","Nom","Entreprise"].map(h=>(
                      <th key={h} style={{ padding:"9px 14px", textAlign:"left", color:T.textSub, fontWeight:600, fontSize:12, whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0,5).map((r,i)=>(
                    <tr key={i} style={{ borderTop:`1px solid ${T.border}`, background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={{ padding:"9px 14px", color:T.text, fontWeight:500 }}>{r.email}</td>
                      <td style={{ padding:"9px 14px", color:T.textSub }}>{r.firstName||"—"}</td>
                      <td style={{ padding:"9px 14px", color:T.textSub }}>{r.lastName||"—"}</td>
                      <td style={{ padding:"9px 14px", color:T.textSub }}>{r.company||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length>5 && (
              <div style={{ padding:"8px 14px", background:"#f8fafc", borderTop:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12, color:T.textSub }}>... et {rows.length-5} autres</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Champs email (visibles après import) ── */}
      {count > 0 && (
        <>
          {/* Sujet */}
          <section>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <label style={lbl}>Sujet de l'email</label>
              <div style={{ display:"flex", gap:6 }}>
                {detectedVars.slice(0,3).map(v=>(
                  <button key={v} onClick={()=>insertAt(subjectRef,subject,setSubject,v)} style={varChip}>{v}</button>
                ))}
              </div>
            </div>
            <input ref={subjectRef} value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="Ex : Bonjour {{firstName}}, voici notre newsletter"
              disabled={loading} style={{ ...styles.input, fontSize:15 }}/>
          </section>

          {/* Corps */}
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
                              <div style={{ width:38,height:38,borderRadius:8,background:tpl.type==="SYSTEM"?"#f0fdf4":"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <FileText size={17} color={tpl.type==="SYSTEM"?"#10b981":T.primary}/>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontWeight:600,fontSize:14,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tpl.name}</div>
                                <div style={{ fontSize:13,color:T.textSub,marginTop:2 }}>{tpl.subject}</div>
                              </div>
                              {tpl.type==="SYSTEM" && <span style={{ fontSize:11,fontWeight:700,background:"#d1fae5",color:"#065f46",padding:"2px 8px",borderRadius:99 }}>SYSTÈME</span>}
                            </button>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
                {selectedTpl && (
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginTop:8,padding:"9px 14px",background:"#eff6ff",borderRadius:8 }}>
                    <Check size={14} color={T.primary}/>
                    <span style={{ fontSize:13,color:T.primary,fontWeight:500 }}>Template appliqué — modifiable ci-dessous</span>
                    <button onClick={clearTemplate} style={{ marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:T.textSub,fontSize:13 }}>Effacer</button>
                  </div>
                )}
              </div>
            )}

            <textarea ref={htmlRef} value={html} onChange={e=>setHtml(e.target.value)}
              placeholder={"<h1>Bonjour {{firstName}} !</h1>\n<p>Message pour {{company}}...</p>"}
              rows={10} disabled={loading}
              style={{ ...styles.input, resize:"vertical", fontFamily:"monospace", fontSize:13, lineHeight:1.6, padding:14, opacity:loading?.5:1 }}/>
          </section>

          {/* Variables */}
          <section>
            <label style={{ ...lbl, marginBottom:10 }}>Variables de personnalisation</label>
            <VariablesPanel
              variables={detectedVars}
              values={varValues}
              onChange={handleVarChange}
              contactFields={contactFields}
            />
          </section>

          {/* Aperçu */}
          {showPreview && (
            <PreviewModal
                html={html}
                subject={subject}
                varValues={varValues}
                onClose={() => setShowPreview(false)}
            />
          )}

          {/* Bouton envoi */}
          <button onClick={handleSendClick} disabled={!canSend}
            style={{ ...styles.btn, display:"flex", alignItems:"center", justifyContent:"center", gap:8, alignSelf:"flex-start", minWidth:240, padding:"12px 24px", fontSize:15, opacity:canSend?1:.5, cursor:canSend?"pointer":"not-allowed" }}>
            <Send size={16}/>
            {loading?"Envoi en cours...":`Envoyer à ${count} destinataire${count>1?"s":""}`}
          </button>
        </>
      )}

      {/* Modal enregistrement contacts */}
      {showSaveModal && (
        <SaveContactsModal
          rows={rows}
          onConfirm={doSend}
          onSkip={doSend}
          onClose={()=>setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

const lbl = { color:T.text, fontSize:15, fontWeight:600, display:"block" };
const varChip = { background:"#eff6ff", color:T.primary, border:"1px solid #bfdbfe", borderRadius:6, padding:"3px 10px", fontSize:13, cursor:"pointer", fontWeight:500 };