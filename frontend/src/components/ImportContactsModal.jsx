// src/components/ImportContactsModal.jsx
import { useState, useRef, useEffect } from "react";
import { T, styles } from "../theme";
import client from "../api/client";
import { X, Upload, FileText, AlertCircle, CheckCircle, List } from "lucide-react";
import Papa from "papaparse";

export default function ImportContactsModal({ onClose, onImport }) {
  const [step, setStep] = useState(1); // 1: upload, 2: preview, 3: results
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState("");
  const [preview, setPreview] = useState([]);
  const [selectedList, setSelectedList] = useState("");
  const [lists, setLists] = useState([]);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchLists();
  }, []);

  async function fetchLists() {
    try {
      const res = await client.get("/lists");
      setLists(res.data.lists || []);
    } catch (err) {
      console.error("Error fetching lists:", err);
    }
  }

  function handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop().toLowerCase();
    if (!["csv", "txt"].includes(ext)) {
      alert("Format non supporté. Utilisez un fichier CSV.");
      return;
    }

    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCsvData(text);
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  }

  function parseCSV(text) {
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    const previewData = parsed.data.slice(0, 5).map(row => ({
      email: row.email || row.mail || row["e-mail"] || "",
      firstName: row.firstname || row.first_name || row["first name"] || row.prenom || "",
      lastName: row.lastname || row.last_name || row["last name"] || row.nom || "",
      phone: row.phone || row.telephone || row.tel || "",
      company: row.company || row.entreprise || row.societe || "",
    }));

    setPreview(previewData);
    setStep(2);
  }

  async function handleImport() {
    setLoading(true);

    try {
      const res = await client.post("/contacts/import", {
        csvData,
        listId: selectedList || null,
        updateExisting
      });

      setResults(res.data);
      setStep(3);
    } catch (err) {
      alert(err.response?.data?.error || "Erreur lors de l'import");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (results && (results.imported > 0 || results.updated > 0)) {
      onImport();
    } else {
      onClose();
    }
  }

  return (
    <div style={styles.modalOverlay} onClick={handleClose}>
      <div 
        style={{ ...styles.modal, maxWidth: 700, maxHeight: "90vh", overflowY: "auto" }} 
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
            Importer des contacts
          </h2>
          <button onClick={handleClose} style={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map(num => (
            <div 
              key={num}
              style={{ 
                flex: 1, 
                height: 4, 
                background: step >= num ? T.primary : T.border,
                borderRadius: 2,
                transition: "background 0.3s"
              }} 
            />
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div>
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <Upload size={48} color={T.textSub} style={{ marginBottom: 16 }} />
              <h3 style={{ color: T.text, fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
                Sélectionnez un fichier CSV
              </h3>
              <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 24px" }}>
                Format attendu : email, firstName, lastName, phone, company
              </p>
              
              <input 
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ ...styles.btn, minWidth: 200 }}
              >
                Choisir un fichier
              </button>

              {/* Example */}
              <div style={{ 
                marginTop: 32,
                padding: 16,
                background: T.bg,
                borderRadius: 8,
                textAlign: "left"
              }}>
                <p style={{ color: T.textSub, fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>
                  Exemple de format CSV :
                </p>
                <pre style={{ 
                  fontSize: 12, 
                  color: T.text,
                  margin: 0,
                  fontFamily: "monospace",
                  overflow: "auto"
                }}>
{`email,firstName,lastName,phone,company
john@example.com,John,Doe,0612345678,Acme Inc
jane@example.com,Jane,Smith,0698765432,Tech Corp`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Options */}
        {step === 2 && (
          <div>
            {/* File Info */}
            {file && (
              <div style={{ 
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: T.primaryLight,
                borderRadius: 8,
                marginBottom: 20
              }}>
                <FileText size={24} color={T.primary} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>
                    {file.name}
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: T.textSub }}>
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            )}

            {/* Preview */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>
                Aperçu des données ({preview.length} premières lignes)
              </h4>
              <div style={{ 
                overflowX: "auto",
                border: `1px solid ${T.border}`,
                borderRadius: 8
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      <th style={{ ...styles.tableHeader, fontSize: 12 }}>Email</th>
                      <th style={{ ...styles.tableHeader, fontSize: 12 }}>Prénom</th>
                      <th style={{ ...styles.tableHeader, fontSize: 12 }}>Nom</th>
                      <th style={{ ...styles.tableHeader, fontSize: 12 }}>Téléphone</th>
                      <th style={{ ...styles.tableHeader, fontSize: 12 }}>Entreprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ ...styles.tableCell, fontSize: 13 }}>{row.email || "-"}</td>
                        <td style={{ ...styles.tableCell, fontSize: 13 }}>{row.firstName || "-"}</td>
                        <td style={{ ...styles.tableCell, fontSize: 13 }}>{row.lastName || "-"}</td>
                        <td style={{ ...styles.tableCell, fontSize: 13 }}>{row.phone || "-"}</td>
                        <td style={{ ...styles.tableCell, fontSize: 13 }}>{row.company || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Options */}
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>
                Options d'import
              </h4>

              {/* List Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={styles.label}>
                  <List size={16} style={{ marginRight: 6 }} />
                  Ajouter à une liste (optionnel)
                </label>
                <select 
                  value={selectedList}
                  onChange={(e) => setSelectedList(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Aucune liste</option>
                  {lists.map(list => (
                    <option key={list.id} value={list.id}>
                      {list.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Update Existing */}
              <label style={{ 
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                padding: 12,
                background: T.bg,
                borderRadius: 8
              }}>
                <input 
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  style={{ cursor: "pointer" }}
                />
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: T.text }}>
                    Mettre à jour les contacts existants
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub }}>
                    Si un contact existe déjà, ses informations seront mises à jour
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12 }}>
              <button 
                onClick={() => setStep(1)}
                style={{ 
                  ...styles.btn, 
                  flex: 1,
                  background: "#fff",
                  color: T.text,
                  border: `1px solid ${T.border}`
                }}
              >
                Retour
              </button>
              <button 
                onClick={handleImport}
                disabled={loading}
                style={{ 
                  ...styles.btn, 
                  flex: 1,
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? "Import en cours..." : "Importer"}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && results && (
          <div>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <CheckCircle size={64} color={T.success} style={{ marginBottom: 16 }} />
              <h3 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
                Import terminé !
              </h3>
            </div>

            {/* Stats */}
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 20
            }}>
              <div style={{ ...styles.card, padding: 16, textAlign: "center" }}>
                <p style={{ color: T.success, fontSize: 28, fontWeight: 700, margin: 0 }}>
                  {results.imported}
                </p>
                <p style={{ color: T.textSub, fontSize: 13, margin: "4px 0 0" }}>
                  Importés
                </p>
              </div>
              <div style={{ ...styles.card, padding: 16, textAlign: "center" }}>
                <p style={{ color: T.primary, fontSize: 28, fontWeight: 700, margin: 0 }}>
                  {results.updated}
                </p>
                <p style={{ color: T.textSub, fontSize: 13, margin: "4px 0 0" }}>
                  Mis à jour
                </p>
              </div>
              <div style={{ ...styles.card, padding: 16, textAlign: "center" }}>
                <p style={{ color: T.danger, fontSize: 28, fontWeight: 700, margin: 0 }}>
                  {results.failed}
                </p>
                <p style={{ color: T.textSub, fontSize: 13, margin: "4px 0 0" }}>
                  Échoués
                </p>
              </div>
            </div>

            {/* Errors */}
            {results.errors && results.errors.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 12
                }}>
                  <AlertCircle size={20} color={T.danger} />
                  <h4 style={{ color: T.text, fontSize: 16, fontWeight: 600, margin: 0 }}>
                    Erreurs d'import ({results.errors.length})
                  </h4>
                </div>
                <div style={{ 
                  maxHeight: 200,
                  overflowY: "auto",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 12,
                  background: T.bg
                }}>
                  {results.errors.slice(0, 10).map((error, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        padding: "8px 0",
                        borderBottom: idx < results.errors.length - 1 ? `1px solid ${T.border}` : "none"
                      }}
                    >
                      <p style={{ margin: 0, fontSize: 13, color: T.text }}>
                        <strong>{error.email}</strong>
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: T.danger }}>
                        {error.error}
                      </p>
                    </div>
                  ))}
                  {results.errors.length > 10 && (
                    <p style={{ margin: "8px 0 0", fontSize: 12, color: T.textSub, textAlign: "center" }}>
                      ... et {results.errors.length - 10} autres erreurs
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button 
              onClick={handleClose}
              style={{ ...styles.btn, width: "100%" }}
            >
              Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}