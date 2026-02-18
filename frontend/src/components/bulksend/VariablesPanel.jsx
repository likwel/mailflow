// src/components/bulksend/VariablesPanel.jsx
// Composant partagé entre ManualTab, BulkTab et FileTab
import { useState, useRef } from "react";
import { T, styles } from "../../theme";
import { Zap, Upload, X, ChevronDown, ChevronUp, Info } from "lucide-react";

// ─── Champs contacts connus ───────────────────────────
export const CONTACT_FIELDS = [
  { key: "firstName",   label: "Prénom",      example: "Jean" },
  { key: "lastName",    label: "Nom",          example: "Dupont" },
  { key: "email",       label: "Email",        example: "jean@exemple.com" },
  { key: "phone",       label: "Téléphone",    example: "+33 6 00 00 00 00" },
  { key: "company",     label: "Entreprise",   example: "Acme Corp" },
  { key: "unsubscribeUrl", label: "Lien désabo", example: "https://..." },
];

const FIELD_MAP = Object.fromEntries(CONTACT_FIELDS.map(f => [f.key, f]));

export default function VariablesPanel({ variables, values, onChange, onImport, contactFields = [] }) {
  // contactFields = champs supplémentaires détectés depuis les contacts importés/sélectionnés
  const [showSuggestions, setShowSuggestions] = useState(true);
  const fileRef = useRef();

  // Variables suggérées = champs contact non encore utilisés dans le template
  const usedKeys = variables.map(v => v.replace(/\{\{|\}\}/g, ""));
  const suggestions = CONTACT_FIELDS.filter(f => !usedKeys.includes(f.key));

  async function handleFile(e) {
    const file = e.target.files[0]; if (!file) return;
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
    if (onImport) onImport(rows);
    e.target.value = "";
  }

  if (!variables.length && !suggestions.length) return (
    <div style={{ padding: "16px 18px", background: "#f8fafc", borderRadius: 10, border: `1px dashed ${T.border}`, textAlign: "center" }}>
      <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
        Aucune variable détectée — écrivez{" "}
        <code style={{ background: "#e2e8f0", padding: "1px 7px", borderRadius: 4, fontSize: 13 }}>{"{{variable}}"}</code>{" "}
        dans le sujet ou le corps
      </p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Suggestions de champs contact ── */}
      {suggestions.length > 0 && (
        <div style={{ border: `1px solid #bfdbfe`, borderRadius: 10, overflow: "hidden" }}>
          <div
            onClick={() => setShowSuggestions(o => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "#eff6ff", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Info size={15} color={T.primary} />
              <span style={{ fontWeight: 600, fontSize: 14, color: T.primary }}>
                Champs contacts disponibles
              </span>
              <span style={{ fontSize: 12, color: T.primary, opacity: 0.7 }}>
                — cliquez pour insérer dans le corps
              </span>
            </div>
            {showSuggestions
              ? <ChevronUp size={14} color={T.primary} />
              : <ChevronDown size={14} color={T.primary} />}
          </div>

          {showSuggestions && (
            <div style={{ padding: "12px 16px", background: "#f8fbff" }}>
              <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 10px" }}>
                Ces variables seront remplacées par les données réelles de chaque contact lors de l'envoi :
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {suggestions.map(f => (
                  <SuggestionChip key={f.key} field={f} onInsert={onChange} />
                ))}
              </div>
              {/* Champs custom des contacts si disponibles */}
              {contactFields.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid #bfdbfe` }}>
                  <p style={{ color: T.textSub, fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>
                    Champs détectés dans vos contacts :
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {contactFields.map(f => (
                      <SuggestionChip key={f} field={{ key: f, label: f, example: "..." }} onInsert={onChange} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Variables utilisées dans le template ── */}
      {variables.length > 0 && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: "#f8fafc", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={15} color={T.primary} />
              <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>
                Variables dans le template ({variables.length})
              </span>
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

          {/* Champs */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 4px" }}>
              Valeur par défaut utilisée si le contact ne possède pas ce champ :
            </p>
            {variables.map(varKey => {
              const name = varKey.replace(/\{\{|\}\}/g, "");
              const known = FIELD_MAP[name];
              return (
                <div key={varKey} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {/* Badge variable */}
                  <div style={{ minWidth: 150 }}>
                    <code style={{ background: "#eff6ff", color: T.primary, padding: "4px 10px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                      {varKey}
                    </code>
                    {known && (
                      <div style={{ fontSize: 11, color: T.textSub, marginTop: 3, paddingLeft: 2 }}>
                        → {known.label}
                      </div>
                    )}
                  </div>

                  {/* Input valeur par défaut */}
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      value={values[name] || ""}
                      onChange={e => onChange(name, e.target.value)}
                      placeholder={known ? `Ex : ${known.example}` : `Valeur par défaut…`}
                      style={{ ...styles.input, fontSize: 14, paddingRight: values[name] ? 32 : 14 }}
                    />
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

          {/* Format CSV hint */}
          {onImport && variables.length > 0 && (
            <div style={{ padding: "10px 16px", background: "#fffbeb", borderTop: "1px solid #fef3c7" }}>
              <p style={{ color: "#92400e", fontSize: 12, margin: 0 }}>
                💡 Format CSV attendu :{" "}
                <code style={{ background: "#fef3c7", padding: "1px 6px", borderRadius: 4 }}>
                  {variables.map(v => v.replace(/\{\{|\}\}/g, "")).join(",")}
                </code>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Chip suggestion cliquable ────────────────────────
function SuggestionChip({ field, onInsert }) {
  const [clicked, setClicked] = useState(false);

  function handle() {
    // onInsert ici sert à notifier le parent qu'on veut insérer cette variable
    // Le parent doit écouter "insert:key" — on passe un objet spécial
    onInsert("__insert__", `{{${field.key}}}`);
    setClicked(true);
    setTimeout(() => setClicked(false), 1200);
  }

  return (
    <button onClick={handle}
      title={`Exemple : ${field.example}`}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        background: clicked ? "#d1fae5" : "#fff",
        color:      clicked ? "#065f46" : T.text,
        border:     `1px solid ${clicked ? "#6ee7b7" : T.border}`,
        borderRadius: 8, padding: "5px 12px", fontSize: 13,
        cursor: "pointer", fontWeight: 500, transition: "all .15s"
      }}>
      <code style={{ fontSize: 12, color: clicked ? "#065f46" : T.primary, fontWeight: 700 }}>{`{{${field.key}}}`}</code>
      <span style={{ color: T.textSub, fontSize: 12 }}>{field.label}</span>
    </button>
  );
}