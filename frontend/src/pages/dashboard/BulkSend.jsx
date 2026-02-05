// =====================================================
// src/pages/dashboard/BulkSend.jsx
// =====================================================
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Send, Upload, FileText, X, AlertCircle, Info, Mail, Users, FileSpreadsheet } from "lucide-react";

export default function BulkSend() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("manual"); // manual, bulk, template
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quota, setQuota] = useState(null);
  const [plan, setPlan] = useState(null);
  const fileInputRef = useRef(null);

  const emails = recipients
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean)
    .filter(email => email.includes("@"));
  
  const count = emails.length;
  
  useEffect(() => {
    fetchQuota();
    getMyPlan();
  }, []);

  const PLAN_LIMITS = plan;
  const maxAllowed = PLAN_LIMITS?.maxBulkSend ?? 10;
  const exceedsLimit = count > maxAllowed;

  async function fetchQuota() {
    try {
      const res = await client.get("/dashboard/stats");
      setQuota({
        used: user.emailsUsed,
        total: res.data.quota,
        remaining: res.data.quota - user.emailsUsed,
      });
    } catch (err) {
      console.error("Erreur quota:", err);
    }
  }

  async function getMyPlan() {
    try {
      const res = await client.get("/plans/me");
      setPlan(res.data);
    } catch (err) {
      console.error("Erreur plan:", err);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      setError("Format non supporté. Utilisez CSV ou Excel (.xlsx, .xls)");
      return;
    }

    setUploadedFile(file);
    setError("");

    try {
      const text = await file.text();
      const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
      
      const firstLine = lines[0];
      const hasHeader = firstLine.toLowerCase().includes("email") || firstLine.toLowerCase().includes("mail");
      
      const emailLines = hasHeader ? lines.slice(1) : lines;
      const extractedEmails = emailLines
        .map(line => {
          const parts = line.split(/[,;\t]/);
          return parts[0].trim();
        })
        .filter(email => email.includes("@"));

      if (extractedEmails.length > maxAllowed) {
        setError(`Votre plan ${PLAN_LIMITS.name} limite à ${maxAllowed} destinataires par envoi. ${extractedEmails.length} emails détectés.`);
      }

      setRecipients(extractedEmails.join("\n"));
    } catch (err) {
      setError("Erreur lors de la lecture du fichier");
    }
  }

  function removeFile() {
    setUploadedFile(null);
    setRecipients("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit() {
    if (!count || !subject || !html) {
      setError("Remplissez tous les champs.");
      return;
    }

    if (exceedsLimit) {
      setError(`Votre plan ${PLAN_LIMITS.name} limite à ${maxAllowed} destinataires par envoi.`);
      return;
    }

    if (quota && count > quota.remaining) {
      setError(`Quota insuffisant. Il vous reste ${quota.remaining} emails ce mois.`);
      return;
    }

    setError("");
    setSent(null);
    setLoading(true);
    
    try {
      const res = await client.post("/dashboard/send", {
        to: emails,
        subject,
        html,
      });
      setSent({ count: res.data.sent, time: new Date().toLocaleTimeString() });
      setRecipients("");
      setSubject("");
      setHtml("");
      removeFile();
      fetchQuota();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "manual", label: "Saisie manuelle", icon: Mail },
    { id: "bulk", label: "Envoi en lot", icon: Users },
    { id: "file", label: "Import fichier", icon: FileSpreadsheet },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>
            Envoyer des emails à plusieurs destinataires
          </p>
        </div>
        
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          background: T.primaryLight, 
          padding: "6px 12px", 
          borderRadius: 8 
        }}>
          <Info size={14} color={T.primary} />
          <span style={{ fontSize: 12, color: T.primary, fontWeight: 600 }}>
            {PLAN_LIMITS ? PLAN_LIMITS.maxBulkSend : '10'} emails max par envoi
          </span>
        </div>
      </div>

      {/* Quota */}
      {quota && (
        <div style={{ 
          ...styles.card, 
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{ color: T.textSub, fontSize: 12, margin: 0 }}>Quota mensuel</p>
            <p style={{ color: T.text, fontSize: 16, fontWeight: 700, margin: "2px 0 0" }}>
              {quota.remaining.toLocaleString()} emails restants
            </p>
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>
            {quota.used} / {quota.total} utilisés
          </div>
        </div>
      )}

      {/* Messages de confirmation/erreur */}
      {sent && (
        <div style={{ 
          background: T.successLight, 
          border: `1px solid ${T.success}`, 
          borderRadius: T.radius, 
          padding: "14px 18px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between" 
        }}>
          <p style={{ color: T.success, fontSize: 13, fontWeight: 600, margin: 0 }}>
            ✓ {sent.count} email{sent.count > 1 ? "s" : ""} envoyé{sent.count > 1 ? "s" : ""} avec succès à {sent.time}
          </p>
          <button onClick={() => setSent(null)} style={{ background: "none", border: "none", color: T.success, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ 
          background: T.dangerLight, 
          border: `1px solid ${T.danger}`, 
          borderRadius: T.radius, 
          padding: "14px 18px", 
          display: "flex", 
          alignItems: "start", 
          gap: 10 
        }}>
          <AlertCircle size={18} color={T.danger} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: T.danger, fontSize: 13, fontWeight: 600, margin: 0, flex: 1 }}>{error}</p>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: T.danger, cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {exceedsLimit && (
        <div style={{ 
          background: T.warningLight, 
          border: `1px solid ${T.warning}`, 
          borderRadius: T.radius, 
          padding: "14px 18px",
          display: "flex",
          alignItems: "start",
          gap: 10,
        }}>
          <AlertCircle size={18} color={T.warning} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ color: T.warning, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>
              Limite de plan atteinte
            </p>
            <p style={{ color: T.warning, fontSize: 12, margin: 0 }}>
              Vous avez {count} destinataires mais votre plan {PLAN_LIMITS?.name} limite à {maxAllowed} par envoi.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
        <div style={{ 
          display: "flex", 
          borderBottom: `2px solid ${T.border}`,
          background: T.bg,
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "16px 20px",
                  background: isActive ? T.card : "transparent",
                  border: "none",
                  borderBottom: isActive ? `3px solid ${T.primary}` : "3px solid transparent",
                  color: isActive ? T.primary : T.textSub,
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = T.primaryLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div style={{ padding: 24 }}>
          
          {/* Tab 1: Saisie manuelle */}
          {activeTab === "manual" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                  Saisie manuelle des destinataires
                </h3>
                <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>
                  Entrez une adresse email par ligne
                </p>
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Destinataires (un email par ligne)
                </label>
                <textarea 
                  value={recipients} 
                  onChange={(e) => setRecipients(e.target.value)} 
                  placeholder={"contact@example.com\ninfo@example.com\nsupport@example.com"}
                  rows={8}
                  disabled={loading}
                  style={{ 
                    ...styles.input, 
                    resize: "vertical", 
                    fontFamily: "monospace", 
                    fontSize: 13, 
                    padding: "12px 14px",
                    opacity: loading ? 0.5 : 1,
                    borderColor: exceedsLimit ? T.danger : T.border,
                  }} 
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <p style={{ 
                    color: exceedsLimit ? T.danger : T.textMuted, 
                    fontSize: 11, 
                    margin: 0,
                    fontWeight: exceedsLimit ? 600 : 400,
                  }}>
                    {count} / {maxAllowed} destinataire{count !== 1 ? "s" : ""}
                  </p>
                  {exceedsLimit && (
                    <span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>
                      Limite dépassée
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Sujet de l'email
                </label>
                <input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="Ex: Newsletter de janvier 2026"
                  disabled={loading}
                  style={{ ...styles.input, opacity: loading ? 0.5 : 1 }} 
                />
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Corps de l'email (HTML)
                </label>
                <textarea 
                  value={html} 
                  onChange={(e) => setHtml(e.target.value)} 
                  placeholder={"<h1>Bonjour !</h1>\n<p>Voici notre newsletter du mois...</p>"}
                  rows={8}
                  disabled={loading}
                  style={{ 
                    ...styles.input, 
                    resize: "vertical", 
                    fontFamily: "monospace", 
                    fontSize: 13, 
                    padding: "12px 14px",
                    opacity: loading ? 0.5 : 1,
                  }} 
                />
                <p style={{ color: T.textMuted, fontSize: 11, margin: "6px 0 0" }}>
                  💡 Utilisez du HTML pour formater votre message
                </p>
              </div>

              <button
                onClick={submit}
                disabled={loading || !count || !subject || !html || exceedsLimit}
                style={{
                  ...styles.btn,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  alignSelf: "flex-start",
                  minWidth: 200,
                  opacity: (loading || !count || !subject || !html || exceedsLimit) ? 0.5 : 1,
                  cursor: (loading || !count || !subject || !html || exceedsLimit) ? "not-allowed" : "pointer",
                }}
              >
                <Send size={16} />
                {loading ? `Envoi en cours...` : `Envoyer à ${count} destinataire${count > 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {/* Tab 2: Envoi en lot (copier-coller) */}
          {activeTab === "bulk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                  Envoi en lot rapide
                </h3>
                <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>
                  Collez une liste d'emails séparés par des virgules, espaces ou retours à la ligne
                </p>
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Liste d'emails
                </label>
                <textarea 
                  value={recipients} 
                  onChange={(e) => setRecipients(e.target.value)} 
                  placeholder={"contact@example.com, info@example.com, support@example.com\nou\ncontact@example.com\ninfo@example.com"}
                  rows={6}
                  disabled={loading}
                  style={{ 
                    ...styles.input, 
                    resize: "vertical", 
                    fontFamily: "monospace", 
                    fontSize: 13, 
                    padding: "12px 14px",
                    opacity: loading ? 0.5 : 1,
                    borderColor: exceedsLimit ? T.danger : T.border,
                  }} 
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <p style={{ 
                    color: exceedsLimit ? T.danger : T.textMuted, 
                    fontSize: 11, 
                    margin: 0,
                    fontWeight: exceedsLimit ? 600 : 400,
                  }}>
                    {count} / {maxAllowed} destinataire{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Sujet
                </label>
                <input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="Ex: Newsletter de janvier 2026"
                  disabled={loading}
                  style={{ ...styles.input, opacity: loading ? 0.5 : 1 }} 
                />
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Message (HTML)
                </label>
                <textarea 
                  value={html} 
                  onChange={(e) => setHtml(e.target.value)} 
                  placeholder={"<h1>Bonjour !</h1>\n<p>Votre message ici...</p>"}
                  rows={8}
                  disabled={loading}
                  style={{ 
                    ...styles.input, 
                    resize: "vertical", 
                    fontFamily: "monospace", 
                    fontSize: 13, 
                    padding: "12px 14px",
                    opacity: loading ? 0.5 : 1,
                  }} 
                />
              </div>

              <button
                onClick={submit}
                disabled={loading || !count || !subject || !html || exceedsLimit}
                style={{
                  ...styles.btn,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  alignSelf: "flex-start",
                  minWidth: 200,
                  opacity: (loading || !count || !subject || !html || exceedsLimit) ? 0.5 : 1,
                  cursor: (loading || !count || !subject || !html || exceedsLimit) ? "not-allowed" : "pointer",
                }}
              >
                <Send size={16} />
                {loading ? `Envoi en cours...` : `Envoyer à ${count} destinataire${count > 1 ? "s" : ""}`}
              </button>
            </div>
          )}

          {/* Tab 3: Import fichier */}
          {activeTab === "file" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
                  Import depuis un fichier
                </h3>
                <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>
                  Importez vos destinataires depuis un fichier CSV ou Excel
                </p>
              </div>

              <div>
                <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Fichier de destinataires
                </label>
                
                {uploadedFile ? (
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 10, 
                    padding: "12px 16px", 
                    background: T.primaryLight, 
                    border: `1px solid ${T.primary}`, 
                    borderRadius: 8 
                  }}>
                    <FileText size={20} color={T.primary} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{uploadedFile.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 12, color: T.textSub }}>
                        {count} destinataire{count > 1 ? "s" : ""} importé{count > 1 ? "s" : ""}
                      </p>
                    </div>
                    <button 
                      onClick={removeFile} 
                      style={{ background: "none", border: "none", color: T.danger, cursor: "pointer", padding: 4 }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <label style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: 12,
                    padding: "40px 20px", 
                    border: `2px dashed ${T.border}`, 
                    borderRadius: 8, 
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: T.bg,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = T.primary;
                    e.currentTarget.style.background = T.primaryLight;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.background = T.bg;
                  }}
                  >
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".csv,.xlsx,.xls" 
                      onChange={handleFileUpload}
                      style={{ display: "none" }}
                    />
                    <Upload size={40} color={T.textSub} />
                    <div style={{ textAlign: "center" }}>
                      <p style={{ margin: 0, fontSize: 14, color: T.text, fontWeight: 600 }}>
                        Cliquez pour importer un fichier
                      </p>
                      <p style={{ margin: "6px 0 0", fontSize: 12, color: T.textMuted }}>
                        CSV ou Excel (.xlsx, .xls)
                      </p>
                    </div>
                  </label>
                )}
                <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
                  📄 Format attendu : une adresse email par ligne (première colonne)
                </p>
              </div>

              {count > 0 && (
                <>
                  <div>
                    <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Sujet de l'email
                    </label>
                    <input 
                      value={subject} 
                      onChange={(e) => setSubject(e.target.value)} 
                      placeholder="Ex: Newsletter de janvier 2026"
                      disabled={loading}
                      style={{ ...styles.input, opacity: loading ? 0.5 : 1 }} 
                    />
                  </div>

                  <div>
                    <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Corps de l'email (HTML)
                    </label>
                    <textarea 
                      value={html} 
                      onChange={(e) => setHtml(e.target.value)} 
                      placeholder={"<h1>Bonjour !</h1>\n<p>Votre message...</p>"}
                      rows={8}
                      disabled={loading}
                      style={{ 
                        ...styles.input, 
                        resize: "vertical", 
                        fontFamily: "monospace", 
                        fontSize: 13, 
                        padding: "12px 14px",
                        opacity: loading ? 0.5 : 1,
                      }} 
                    />
                  </div>

                  <button
                    onClick={submit}
                    disabled={loading || !count || !subject || !html || exceedsLimit}
                    style={{
                      ...styles.btn,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      alignSelf: "flex-start",
                      minWidth: 200,
                      opacity: (loading || !count || !subject || !html || exceedsLimit) ? 0.5 : 1,
                      cursor: (loading || !count || !subject || !html || exceedsLimit) ? "not-allowed" : "pointer",
                    }}
                  >
                    <Send size={16} />
                    {loading ? `Envoi en cours...` : `Envoyer à ${count} destinataire${count > 1 ? "s" : ""}`}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}