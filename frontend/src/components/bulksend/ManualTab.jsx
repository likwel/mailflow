// src/components/bulksend/ManualTab.jsx
import { useState, useEffect, useRef } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
  Send, FileText, Code, Eye, EyeOff,
  ChevronDown, ChevronUp, Plus,
  Upload, X, AlertCircle, Check, Zap
} from "lucide-react";
import PreviewModal from "./PreviewModal";

// ─── SimpleVariablesPanel (sans suggestions contacts) ─
function SimpleVariablesPanel({ variables, values, onChange, onImport }) {
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["]/g, ""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {}; headers.forEach((h, i) => { obj[h] = vals[i] || ""; }); return obj;
    });
    if (onImport) onImport(rows);
    e.target.value = "";
  }

  if (!variables.length) return (
    <div style={{ padding: "16px 18px", background: "#f8fafc", borderRadius: 10, border: `1px dashed ${T.border}`, textAlign: "center" }}>
      <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
        Aucune variable — écrivez <code style={{ background: "#e2e8f0", padding: "1px 7px", borderRadius: 4, fontSize: 13 }}>{"{{variable}}"}</code> dans le sujet ou le corps
      </p>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "#f8fafc", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={15} color={T.primary} />
          <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>Variables détectées ({variables.length})</span>
        </div>
        {onImport && (
          <>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13, color: T.text, fontWeight: 500 }}>
              <Upload size={14} /> Importer CSV
            </button>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }} />
          </>
        )}
      </div>
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 4px" }}>Valeur par défaut si le contact ne possède pas ce champ :</p>
        {variables.map(varKey => {
          const name = varKey.replace(/\{\{|\}\}/g, "");
          return (
            <div key={varKey} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <code style={{ minWidth: 140, background: "#eff6ff", color: T.primary, padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>{varKey}</code>
              <div style={{ flex: 1, position: "relative" }}>
                <input value={values[name] || ""} onChange={e => onChange(name, e.target.value)}
                  placeholder={`Valeur par défaut…`}
                  style={{ ...styles.input, fontSize: 14, paddingRight: values[name] ? 32 : 14 }} />
                {values[name] && (
                  <button onClick={() => onChange(name, "")}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textSub, display: "flex" }}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {onImport && variables.length > 0 && (
        <div style={{ padding: "10px 16px", background: "#fffbeb", borderTop: "1px solid #fef3c7" }}>
          <p style={{ color: "#92400e", fontSize: 12, margin: 0 }}>
            💡 Format CSV : <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>{variables.map(v => v.replace(/\{\{|\}\}/g, "")).join(",")}</code>
          </p>
        </div>
      )}
    </div>
  );
}
function detectVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches)]; // unique
}

// ─── Aperçu HTML avec variables remplacées ────────────
function resolveVars(text, values) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => values[key] || match);
}

function HtmlPreview({ html, varValues }) {
  const resolved = resolveVars(html, varValues);
  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      <div style={{ padding: "8px 14px", background: "#f8fafc", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ef4444" }}/>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#f59e0b" }}/>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#10b981" }}/>
        <span style={{ marginLeft: 8, fontSize: 13, color: T.textSub }}>Aperçu email</span>
      </div>
      <iframe
        srcDoc={resolved || "<p style='color:#94a3b8;padding:24px;font-family:sans-serif;font-size:15px'>Aucun contenu à prévisualiser</p>"}
        style={{ width: "100%", minHeight: 280, border: "none", display: "block" }}
        sandbox="allow-same-origin"
        title="preview"
      />
    </div>
  );
}

// ─── Panneau variables dynamiques ────────────────────
function VariablesPanel({ variables, values, onChange, onImport }) {
  const fileRef = useRef();

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["]/g, ""));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return obj;
    });
    onImport(rows);
    e.target.value = "";
  }

  if (variables.length === 0) return (
    <div style={{ padding: "16px 18px", background: "#f8fafc", borderRadius: 10, border: `1px dashed ${T.border}`, textAlign: "center" }}>
      <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
        Aucune variable détectée — écrivez <code style={{ background: "#e2e8f0", padding: "1px 7px", borderRadius: 4, fontSize: 13 }}>{"{{nomVariable}}"}</code> dans le sujet ou le corps
      </p>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f8fafc", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={16} color={T.primary}/>
          <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>
            Variables détectées ({variables.length})
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fileRef.current?.click()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13, color: T.text, fontWeight: 500 }}>
            <Upload size={14}/> Importer CSV
          </button>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display: "none" }}/>
        </div>
      </div>

      {/* Variable rows */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 4px" }}>
          Valeur par défaut utilisée si un contact ne possède pas ce champ :
        </p>
        {variables.map(varKey => {
          const name = varKey.replace(/\{\{|\}\}/g, "");
          return (
            <div key={varKey} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 140, display: "flex", alignItems: "center", gap: 7 }}>
                <code style={{ background: "#eff6ff", color: T.primary, padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  {varKey}
                </code>
              </div>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  value={values[name] || ""}
                  onChange={e => onChange(name, e.target.value)}
                  placeholder={`Valeur par défaut pour ${name}…`}
                  style={{ ...styles.input, fontSize: 14, paddingRight: values[name] ? 32 : 14 }}
                />
                {values[name] && (
                  <button onClick={() => onChange(name, "")}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: T.textSub, display: "flex" }}>
                    <X size={14}/>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Format CSV hint */}
      <div style={{ padding: "10px 16px", background: "#fffbeb", borderTop: `1px solid #fef3c7` }}>
        <p style={{ color: "#92400e", fontSize: 12, margin: 0 }}>
          💡 Format CSV attendu : <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>
            {variables.map(v => v.replace(/\{\{|\}\}/g, "")).join(",")}
          </code>
        </p>
      </div>
    </div>
  );
}

// ─── ManualTab principal ──────────────────────────────
export default function ManualTab({
  recipients, setRecipients,
  subject, setSubject,
  html, setHtml,
  count, maxAllowed, exceedsLimit, loading, onSubmit
}) {
  const [contentMode, setContentMode] = useState("html");
  const [templates, setTemplates]     = useState([]);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [tplOpen, setTplOpen]         = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [varValues, setVarValues]     = useState({});
  const [importedRows, setImportedRows] = useState([]); // rows CSV pour envoi personnalisé
  const subjectRef = useRef(null);
  const htmlRef    = useRef(null);

  useEffect(() => {
    client.get("/dashboard/templates").then(r => setTemplates(r.data || [])).catch(() => {});
  }, []);

  // Détecter toutes les variables dans sujet + corps
  const detectedVars = detectVariables((subject || "") + " " + (html || ""));

  function setVar(name, value) {
    setVarValues(p => ({ ...p, [name]: value }));
  }

  function handleImportCSV(rows) {
    setImportedRows(rows);
    // Pré-remplir les valeurs par défaut depuis la 1ère ligne
    if (rows.length > 0) {
      const first = rows[0];
      const newVals = {};
      detectedVars.forEach(varKey => {
        const name = varKey.replace(/\{\{|\}\}/g, "");
        if (first[name]) newVals[name] = first[name];
      });
      setVarValues(p => ({ ...p, ...newVals }));
    }
  }

  function applyTemplate(tpl) {
    setSelectedTpl(tpl);
    setSubject(tpl.subject || "");
    setHtml(tpl.htmlBody || "");
    setTplOpen(false);
  }

  function clearTemplate() {
    setSelectedTpl(null);
    setSubject("");
    setHtml("");
    setContentMode("html");
  }

  // Insérer variable à la position du curseur
  function insertAt(ref, value, setValue, key) {
    const el = ref.current;
    if (!el) { setValue(value + key); return; }
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd   ?? value.length;
    setValue(value.slice(0, s) + key + value.slice(e));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + key.length, s + key.length); }, 0);
  }

  const canSend = count > 0 && subject.trim() && html.trim() && !exceedsLimit && !loading;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── Destinataires ── */}
      <section>
        <label style={lbl}>Destinataires <span style={{ color: T.textSub, fontWeight: 400 }}>(un email par ligne)</span></label>
        <textarea
          value={recipients}
          onChange={e => setRecipients(e.target.value)}
          placeholder={"contact@example.com\ninfo@example.com"}
          rows={5} disabled={loading}
          style={{ ...styles.input, resize: "vertical", fontFamily: "monospace", fontSize: 14, padding: "12px 14px", marginTop: 8, borderColor: exceedsLimit ? T.danger : T.border }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 13, color: exceedsLimit ? T.danger : T.textSub, fontWeight: exceedsLimit ? 600 : 400 }}>
            {count} / {maxAllowed} destinataire{count !== 1 ? "s" : ""}
          </span>
          {exceedsLimit && (
            <span style={{ fontSize: 13, color: T.danger, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <AlertCircle size={14}/> Limite dépassée
            </span>
          )}
        </div>
      </section>

      {/* ── Sujet ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <label style={lbl}>Sujet de l'email</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {detectedVars.slice(0, 4).map(v => (
              <button key={v} onClick={() => insertAt(subjectRef, subject, setSubject, v)}
                style={{ ...varChipStyle }}>{v}</button>
            ))}
          </div>
        </div>
        <input
          ref={subjectRef}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Ex : Bonjour {{firstName}}, voici notre newsletter"
          disabled={loading}
          style={{ ...styles.input, fontSize: 15, opacity: loading ? 0.5 : 1 }}
        />
      </section>

      {/* ── Mode contenu ── */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <label style={lbl}>Corps de l'email</label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {/* Toggle */}
            <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3 }}>
              {[
                { id: "html",     icon: <Code size={14}/>,     label: "HTML libre" },
                { id: "template", icon: <FileText size={14}/>, label: "Template" },
              ].map(m => (
                <button key={m.id}
                  onClick={() => { setContentMode(m.id); if (m.id === "html" && selectedTpl) clearTemplate(); }}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 500, background: contentMode === m.id ? "#fff" : "transparent", color: contentMode === m.id ? T.primary : T.textSub, boxShadow: contentMode === m.id ? "0 1px 4px rgba(0,0,0,.08)" : "none", transition: "all .15s" }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            {/* Aperçu */}
            <button onClick={() => setShowPreview(o => !o)}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: showPreview ? "#eff6ff" : "#fff", border: `1px solid ${showPreview ? T.primary : T.border}`, borderRadius: 8, cursor: "pointer", fontSize: "1rem", color: showPreview ? T.primary : T.text, fontWeight: 500 }}>
              {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>}
              {showPreview ? "Masquer" : "Aperçu"}
            </button>
          </div>
        </div>

        {/* Template dropdown */}
        {contentMode === "template" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ position: "relative" }}>
              <button onClick={() => setTplOpen(o => !o)}
                style={{ ...styles.input, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", background: selectedTpl ? "#eff6ff" : "#fff", fontSize: 15 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: selectedTpl ? T.primary : T.textSub }}>
                  <FileText size={16}/>
                  {selectedTpl ? selectedTpl.name : "— Choisir un template —"}
                </span>
                {tplOpen ? <ChevronUp size={15} color={T.textSub}/> : <ChevronDown size={15} color={T.textSub}/>}
              </button>
              {tplOpen && (
                <>
                  <div onClick={() => setTplOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }}/>
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: "0 6px 20px rgba(0,0,0,.1)", maxHeight: 280, overflowY: "auto" }}>
                    {templates.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", color: T.textSub, fontSize: 14 }}>Aucun template disponible</div>
                    ) : templates.map(tpl => (
                      <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", background: selectedTpl?.id === tpl.id ? "#eff6ff" : "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={e => { if (selectedTpl?.id !== tpl.id) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={e => { if (selectedTpl?.id !== tpl.id) e.currentTarget.style.background = "none"; }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: tpl.type === "SYSTEM" ? "#f0fdf4" : "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={17} color={tpl.type === "SYSTEM" ? "#10b981" : T.primary}/>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</div>
                          <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{tpl.subject}</div>
                        </div>
                        {tpl.type === "SYSTEM" && (
                          <span style={{ fontSize: 11, fontWeight: 700, background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: 99 }}>SYSTÈME</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {selectedTpl && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "9px 14px", background: "#eff6ff", borderRadius: 8 }}>
                <Check size={14} color={T.primary}/>
                <span style={{ fontSize: 13, color: T.primary, fontWeight: 500 }}>Template appliqué — modifiez librement le contenu ci-dessous</span>
                <button onClick={clearTemplate} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: T.textSub, fontSize: 13 }}>Effacer</button>
              </div>
            )}
          </div>
        )}

        {/* Éditeur HTML */}
        <textarea
          ref={htmlRef}
          value={html}
          onChange={e => setHtml(e.target.value)}
          placeholder={"<h1>Bonjour {{firstName}} !</h1>\n<p>Voici notre message pour {{company}}...</p>\n<p><a href='{{unsubscribeUrl}}'>Se désabonner</a></p>"}
          rows={11} disabled={loading}
          style={{ ...styles.input, resize: "vertical", fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, padding: "14px", opacity: loading ? 0.5 : 1 }}
        />
      </section>

      {/* ── Variables dynamiques ── */}
      <section>
        <label style={{ ...lbl, marginBottom: 10 }}>Variables de personnalisation</label>
        <SimpleVariablesPanel
          variables={detectedVars}
          values={varValues}
          onChange={setVar}
          onImport={handleImportCSV}
        />

        {/* Résumé des lignes importées */}
        {importedRows.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8 }}>
            <Check size={15} color="#10b981"/>
            <span style={{ fontSize: 14, color: "#065f46", fontWeight: 500 }}>
              {importedRows.length} ligne{importedRows.length > 1 ? "s" : ""} importée{importedRows.length > 1 ? "s" : ""} depuis le CSV
            </span>
            <button onClick={() => setImportedRows([])}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#065f46", fontSize: 13 }}>
              <X size={14}/>
            </button>
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

      {/* ── Bouton envoi ── */}
      <button
        onClick={onSubmit}
        disabled={!canSend}
        style={{ ...styles.btn, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "flex-start", minWidth: 240, padding: "12px 24px", fontSize: 15, opacity: canSend ? 1 : 0.5, cursor: canSend ? "pointer" : "not-allowed" }}>
        <Send size={16}/>
        {loading ? "Envoi en cours..." : `Envoyer à ${count} destinataire${count > 1 ? "s" : ""}`}
      </button>
    </div>
  );
}

// ─── Styles constants ─────────────────────────────────
const lbl = { color: T.text, fontSize: 15, fontWeight: 600, display: "block" };
const varChipStyle = {
  background: "#eff6ff", color: T.primary, border: "1px solid #bfdbfe",
  borderRadius: 6, padding: "3px 10px", fontSize: 13, cursor: "pointer", fontWeight: 500
};