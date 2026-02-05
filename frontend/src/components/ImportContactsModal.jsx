// src/components/ImportContactsModal.jsx
import { useState, useRef, useEffect } from "react";
import { T, styles } from "../theme";
import client from "../api/client";
import { X, Upload, FileText, AlertCircle, CheckCircle, List, ArrowRight, ArrowLeft } from "lucide-react";
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
      setLists(res.data || []);
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

  const modalStyles = {
    overlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 99999,
      padding: 20,
      animation: "fadeIn 0.3s ease-out"
    },
    modal: {
      backgroundColor: "#fff",
      borderRadius: 16,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
      width: "100%",
      maxWidth: 800,
      maxHeight: "90vh",
      display: "flex",
      flexDirection: "column",
      animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
    },
    header: {
      padding: "24px 28px",
      borderBottom: `2px solid ${T.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16
    },
    content: {
      padding: 28,
      overflowY: "auto",
      flex: 1
    },
    footer: {
      padding: "20px 28px",
      borderTop: `2px solid ${T.border}`,
      display: "flex",
      gap: 12,
      backgroundColor: "#fafafa",
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16
    },
    stepIndicator: {
      display: "flex",
      gap: 8,
      marginBottom: 28
    },
    stepBar: (isActive) => ({
      flex: 1,
      height: 6,
      background: isActive ? `linear-gradient(90deg, ${T.primary} 0%, #5558e3 100%)` : T.border,
      borderRadius: 3,
      transition: "all 0.3s",
      boxShadow: isActive ? "0 2px 8px rgba(99, 102, 241, 0.3)" : "none"
    }),
    uploadZone: {
      border: `3px dashed ${T.border}`,
      borderRadius: 16,
      padding: "60px 40px",
      textAlign: "center",
      cursor: "pointer",
      transition: "all 0.3s",
      background: "#fafafa"
    },
    uploadZoneHover: {
      borderColor: T.primary,
      background: T.primaryLight
    },
    fileInfo: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: 16,
      background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primaryLight}dd 100%)`,
      borderRadius: 12,
      marginBottom: 24,
      border: `2px solid ${T.primary}30`
    },
    statsCard: {
      padding: 20,
      textAlign: "center",
      background: "#fff",
      borderRadius: 12,
      border: `2px solid ${T.border}`,
      transition: "all 0.2s"
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      border: `2px solid ${T.border}`,
      borderRadius: 12,
      overflow: "hidden"
    },
    tableHeader: {
      padding: "14px 16px",
      background: T.bg,
      textAlign: "left",
      fontSize: 13,
      fontWeight: 700,
      color: T.text,
      textTransform: "uppercase",
      letterSpacing: "0.05em"
    },
    tableCell: {
      padding: "12px 16px",
      fontSize: 14,
      color: T.text,
      borderBottom: `1px solid ${T.border}`
    }
  };

  return (
    <div style={modalStyles.overlay} onClick={handleClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={modalStyles.header}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.text }}>
            📥 Importer des contacts
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 10,
              borderRadius: 8,
              display: "flex",
              color: T.textSub,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#f3f4f6";
              e.target.style.color = T.text;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "transparent";
              e.target.style.color = T.textSub;
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={modalStyles.content}>
          
          {/* Step Indicator */}
          <div style={modalStyles.stepIndicator}>
            {[1, 2, 3].map(num => (
              <div key={num} style={modalStyles.stepBar(step >= num)} />
            ))}
          </div>

          {/* Step 1: Upload */}
          {step === 1 && (
            <div>
              <input 
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              
              <div
                style={modalStyles.uploadZone}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, modalStyles.uploadZoneHover)}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.background = "#fafafa";
                }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: T.primaryLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px"
                }}>
                  <Upload size={40} color={T.primary} />
                </div>
                <h3 style={{ color: T.text, fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
                  Sélectionnez votre fichier CSV
                </h3>
                <p style={{ color: T.textSub, fontSize: 15, margin: "0 0 24px" }}>
                  Cliquez ou glissez-déposez votre fichier ici
                </p>
                <button 
                  style={{
                    padding: "14px 32px",
                    background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                >
                  Choisir un fichier
                </button>
              </div>

              {/* Format Info */}
              <div style={{ 
                marginTop: 28,
                padding: 20,
                background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primaryLight}80 100%)`,
                borderRadius: 12,
                border: `2px solid ${T.primary}30`
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <AlertCircle size={20} color={T.primary} />
                  <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>
                    Format CSV attendu
                  </p>
                </div>
                <p style={{ color: T.textSub, fontSize: 14, margin: "0 0 12px" }}>
                  Votre fichier doit contenir les colonnes suivantes :
                </p>
                <pre style={{ 
                  fontSize: 13, 
                  color: T.text,
                  margin: 0,
                  fontFamily: "monospace",
                  overflow: "auto",
                  background: "#fff",
                  padding: 16,
                  borderRadius: 8,
                  border: `1px solid ${T.border}`
                }}>
{`email,firstName,lastName,phone,company
john@example.com,John,Doe,0612345678,Acme Inc
jane@example.com,Jane,Smith,0698765432,Tech Corp`}
                </pre>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Options */}
          {step === 2 && (
            <div>
              {/* File Info */}
              {file && (
                <div style={modalStyles.fileInfo}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: T.primary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <FileText size={24} color="#fff" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>
                      {file.name}
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textSub }}>
                      {(file.size / 1024).toFixed(2)} KB • {preview.length}+ contacts détectés
                    </p>
                  </div>
                  <CheckCircle size={24} color={T.success} />
                </div>
              )}

              {/* Preview Table */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ 
                  color: T.text, 
                  fontSize: 16, 
                  fontWeight: 700, 
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  👀 Aperçu des données
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 500, 
                    color: T.textSub,
                    background: T.bg,
                    padding: "4px 10px",
                    borderRadius: 12
                  }}>
                    {preview.length} premières lignes
                  </span>
                </h4>
                <div style={{ overflowX: "auto" }}>
                  <table style={modalStyles.table}>
                    <thead>
                      <tr>
                        <th style={modalStyles.tableHeader}>Email</th>
                        <th style={modalStyles.tableHeader}>Prénom</th>
                        <th style={modalStyles.tableHeader}>Nom</th>
                        <th style={modalStyles.tableHeader}>Téléphone</th>
                        <th style={modalStyles.tableHeader}>Entreprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, idx) => (
                        <tr key={idx}>
                          <td style={modalStyles.tableCell}>{row.email || "-"}</td>
                          <td style={modalStyles.tableCell}>{row.firstName || "-"}</td>
                          <td style={modalStyles.tableCell}>{row.lastName || "-"}</td>
                          <td style={modalStyles.tableCell}>{row.phone || "-"}</td>
                          <td style={modalStyles.tableCell}>{row.company || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Options */}
              <div style={{
                padding: 20,
                background: T.bg,
                borderRadius: 12,
                border: `2px solid ${T.border}`,
                marginBottom: 24
              }}>
                <h4 style={{ 
                  color: T.text, 
                  fontSize: 16, 
                  fontWeight: 700, 
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}>
                  ⚙️ Options d'import
                </h4>

                {/* List Selection */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ 
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: T.text
                  }}>
                    <List size={16} />
                    Ajouter à une liste
                  </label>
                  <select 
                    value={selectedList}
                    onChange={(e) => setSelectedList(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: `2px solid ${T.border}`,
                      borderRadius: 10,
                      fontSize: 15,
                      boxSizing: "border-box",
                      background: "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Aucune liste (optionnel)</option>
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
                  alignItems: "flex-start",
                  gap: 12,
                  cursor: "pointer",
                  padding: 16,
                  background: "#fff",
                  borderRadius: 10,
                  border: `2px solid ${updateExisting ? T.primary : T.border}`,
                  transition: "all 0.2s"
                }}>
                  <input 
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    style={{ 
                      width: 20, 
                      height: 20, 
                      cursor: "pointer",
                      accentColor: T.primary,
                      marginTop: 2
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: T.text }}>
                      Mettre à jour les contacts existants
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: T.textSub }}>
                      Si un contact existe déjà (même email), ses informations seront remplacées par celles du CSV
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && results && (
            <div>
              <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${T.success}20 0%, ${T.success}40 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px"
                }}>
                  <CheckCircle size={60} color={T.success} strokeWidth={2.5} />
                </div>
                <h3 style={{ color: T.text, fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>
                  Import terminé avec succès !
                </h3>
                <p style={{ color: T.textSub, fontSize: 15, margin: 0 }}>
                  Vos contacts ont été importés dans votre base
                </p>
              </div>

              {/* Stats Cards */}
              <div style={{ 
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                marginBottom: 28
              }}>
                <div 
                  style={{
                    ...modalStyles.statsCard,
                    borderColor: T.success
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(16, 185, 129, 0.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <p style={{ color: T.success, fontSize: 36, fontWeight: 700, margin: 0 }}>
                    {results.imported}
                  </p>
                  <p style={{ color: T.textSub, fontSize: 14, fontWeight: 600, margin: "8px 0 0" }}>
                    ✅ Importés
                  </p>
                </div>
                <div 
                  style={{
                    ...modalStyles.statsCard,
                    borderColor: T.primary
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(99, 102, 241, 0.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <p style={{ color: T.primary, fontSize: 36, fontWeight: 700, margin: 0 }}>
                    {results.updated}
                  </p>
                  <p style={{ color: T.textSub, fontSize: 14, fontWeight: 600, margin: "8px 0 0" }}>
                    🔄 Mis à jour
                  </p>
                </div>
                <div 
                  style={{
                    ...modalStyles.statsCard,
                    borderColor: T.danger
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  <p style={{ color: T.danger, fontSize: 36, fontWeight: 700, margin: 0 }}>
                    {results.failed}
                  </p>
                  <p style={{ color: T.textSub, fontSize: 14, fontWeight: 600, margin: "8px 0 0" }}>
                    ❌ Échoués
                  </p>
                </div>
              </div>

              {/* Errors List */}
              {results.errors && results.errors.length > 0 && (
                <div style={{
                  padding: 20,
                  background: `${T.danger}10`,
                  borderRadius: 12,
                  border: `2px solid ${T.danger}30`,
                  marginBottom: 24
                }}>
                  <div style={{ 
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 16
                  }}>
                    <AlertCircle size={22} color={T.danger} />
                    <h4 style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: 0 }}>
                      Erreurs d'import ({results.errors.length})
                    </h4>
                  </div>
                  <div style={{ 
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "#fff",
                    borderRadius: 8,
                    padding: 12
                  }}>
                    {results.errors.slice(0, 10).map((error, idx) => (
                      <div 
                        key={idx}
                        style={{ 
                          padding: "10px 0",
                          borderBottom: idx < Math.min(results.errors.length, 10) - 1 ? `1px solid ${T.border}` : "none"
                        }}
                      >
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.text }}>
                          {error.email || "Email inconnu"}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: 13, color: T.danger }}>
                          ⚠️ {error.error}
                        </p>
                      </div>
                    ))}
                    {results.errors.length > 10 && (
                      <p style={{ margin: "12px 0 0", fontSize: 13, color: T.textSub, textAlign: "center", fontStyle: "italic" }}>
                        ... et {results.errors.length - 10} autre{results.errors.length - 10 > 1 ? "s" : ""} erreur{results.errors.length - 10 > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={modalStyles.footer}>
          {step === 2 && (
            <>
              <button 
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: "12px 28px",
                  background: "#fff",
                  color: T.text,
                  border: `2px solid ${T.border}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
                onMouseEnter={(e) => e.target.style.background = "#f9fafb"}
                onMouseLeave={(e) => e.target.style.background = "#fff"}
              >
                <ArrowLeft size={18} />
                Retour
              </button>
              <button 
                onClick={handleImport}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px 28px",
                  background: loading ? T.textSub : `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 15,
                  fontWeight: 600,
                  transition: "all 0.2s",
                  boxShadow: loading ? "none" : "0 4px 12px rgba(99, 102, 241, 0.3)",
                  opacity: loading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8
                }}
                onMouseEnter={(e) => !loading && (e.target.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
              >
                {loading ? "⏳ Import en cours..." : (
                  <>
                    Importer
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </>
          )}
          {step === 3 && (
            <button 
              onClick={handleClose}
              style={{
                width: "100%",
                padding: "12px 28px",
                background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 15,
                fontWeight: 600,
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
              }}
              onMouseEnter={(e) => e.target.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
            >
              ✅ Terminer
            </button>
          )}
        </div>

      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}