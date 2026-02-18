// src/components/contacts/ImportModal.jsx
import { useState, useRef } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

function parseCsv(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  return lines.slice(1).map(line => {
    const vals = line.split(",");
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] || "").trim().replace(/^"|"$/g, ""); });
    // Normaliser les noms de colonnes courants
    return {
      email:     obj.email || obj.mail || "",
      firstName: obj.firstname || obj.prenom || obj.first || "",
      lastName:  obj.lastname  || obj.nom   || obj.last  || "",
      phone:     obj.phone || obj.telephone || obj.tel || "",
      company:   obj.company || obj.entreprise || obj.societe || "",
      tags:      obj.tags || obj.tag || "",
    };
  }).filter(r => r.email);
}

export default function ImportModal({ onClose, onImport }) {
  const [step, setStep]         = useState("upload"); // upload | preview | result
  const [rows, setRows]         = useState([]);
  const [lists, setLists]       = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const fileRef = useRef();

  // Charger les listes au montage
  useState(() => {
    client.get("/contact-lists").then(r => setLists(r.data.lists || [])).catch(() => {});
  });

  async function handleFile(e) {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv"].includes(ext)) { setError("Seul le format CSV est supporté pour l'instant."); return; }
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length === 0) { setError("Aucun contact valide trouvé dans le fichier."); return; }
    setRows(parsed);
    setStep("preview");
  }

  async function handleImport() {
    setLoading(true); setError("");
    try {
      const res = await client.post("/contacts/import", {
        contacts: rows,
        listId: selectedList || undefined,
      });
      setResult(res.data);
      setStep("result");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'import");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}>
      <div style={{ ...styles.card, width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto", padding:28 }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h2 style={{ margin:0, color: T.text, fontSize:20, fontWeight:700 }}>Importer des contacts</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color: T.textSub }}>
            <X size={20}/>
          </button>
        </div>

        {/* ── Step 1 : Upload ── */}
        {step === "upload" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{ border:`2px dashed ${T.border}`, borderRadius:12, padding:40, textAlign:"center", cursor:"pointer", transition:"border-color .15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.primary}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <Upload size={36} color={T.primary} style={{ marginBottom:12 }}/>
              <p style={{ color: T.text, fontWeight:600, margin:"0 0 6px" }}>Glissez votre fichier CSV ici</p>
              <p style={{ color: T.textSub, fontSize:13, margin:0 }}>ou cliquez pour sélectionner</p>
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} style={{ display:"none" }}/>
            </div>

            {error && <p style={{ color: T.danger, fontSize:13, margin:0 }}>{error}</p>}

            {/* Format attendu */}
            <div style={{ background:"#f8fafc", borderRadius:8, padding:14 }}>
              <p style={{ color: T.text, fontWeight:600, fontSize:13, margin:"0 0 8px" }}>Format CSV attendu :</p>
              <code style={{ fontSize:12, color: T.textSub }}>
                email,firstName,lastName,phone,company,tags<br/>
                jean@exemple.com,Jean,Dupont,+33600000000,Acme,vip;newsletter
              </code>
            </div>
          </div>
        )}

        {/* ── Step 2 : Preview ── */}
        {step === "preview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:"#eff6ff", borderRadius:8 }}>
              <FileText size={20} color={T.primary}/>
              <span style={{ color: T.text, fontWeight:500 }}>{rows.length} contact(s) détecté(s)</span>
            </div>

            {/* Assigner à une liste */}
            <div>
              <label style={{ color: T.textSub, fontSize:13, fontWeight:500 }}>Ajouter à une liste (optionnel)</label>
              <select value={selectedList} onChange={e => setSelectedList(e.target.value)}
                style={{ ...styles.input, marginTop:5 }}>
                <option value="">— Aucune liste —</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l._count?.contacts ?? 0})</option>)}
              </select>
            </div>

            {/* Aperçu des 5 premiers */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8fafc" }}>
                    {["Email","Prénom","Nom","Entreprise","Tags"].map(h => (
                      <th key={h} style={{ padding:"8px 12px", textAlign:"left", color: T.textSub, fontWeight:600, fontSize:12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0,5).map((r,i) => (
                    <tr key={i} style={{ borderTop:`1px solid ${T.border}` }}>
                      <td style={{ padding:"8px 12px", color: T.text }}>{r.email}</td>
                      <td style={{ padding:"8px 12px", color: T.textSub }}>{r.firstName||"—"}</td>
                      <td style={{ padding:"8px 12px", color: T.textSub }}>{r.lastName||"—"}</td>
                      <td style={{ padding:"8px 12px", color: T.textSub }}>{r.company||"—"}</td>
                      <td style={{ padding:"8px 12px", color: T.textSub }}>{r.tags||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p style={{ color: T.textSub, fontSize:12, padding:"8px 12px", margin:0 }}>
                  ... et {rows.length - 5} autres
                </p>
              )}
            </div>

            {error && <p style={{ color: T.danger, fontSize:13, margin:0 }}>{error}</p>}

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setStep("upload")}
                style={{ ...styles.btn, background:"#fff", color: T.text, border:`1px solid ${T.border}` }}>
                Retour
              </button>
              <button onClick={handleImport} disabled={loading} style={styles.btn}>
                {loading ? "Importation..." : `Importer ${rows.length} contacts`}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 : Result ── */}
        {step === "result" && result && (
          <div style={{ display:"flex", flexDirection:"column", gap:16, alignItems:"center", textAlign:"center", padding:"20px 0" }}>
            <CheckCircle size={52} color="#10b981"/>
            <h3 style={{ margin:0, color: T.text, fontSize:18, fontWeight:700 }}>Import terminé !</h3>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, width:"100%" }}>
              {[
                { label:"Total", value: result.total,   color: T.primary },
                { label:"Créés", value: result.created, color:"#10b981" },
                { label:"Ignorés", value: result.skipped, color:"#f59e0b" },
              ].map(s => (
                <div key={s.label} style={{ padding:"16px 12px", borderRadius:10, border:`2px solid ${s.color}20`, background:`${s.color}10` }}>
                  <div style={{ fontSize:28, fontWeight:700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize:13, color: T.textSub }}>{s.label}</div>
                </div>
              ))}
            </div>

            <p style={{ color: T.textSub, fontSize:13, margin:0 }}>
              Les contacts déjà existants ont été ignorés.
            </p>

            <button onClick={onImport} style={styles.btn}>Fermer</button>
          </div>
        )}
      </div>
    </div>
  );
}