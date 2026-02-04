// =====================================================
// src/pages/dashboard/BulkSend.jsx
// =====================================================
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Send, Upload, FileText, X, AlertCircle, Info } from "lucide-react";

const PLAN_LIMITS = {
  FREE: { max: 10, label: "10 emails max par envoi" },
  PRO: { max: 100, label: "100 emails max par envoi" },
  BUSINESS: { max: 1000, label: "1000 emails max par envoi" },
};

export default function BulkSend() {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [quota, setQuota] = useState(null);
  const fileInputRef = useRef(null);

  const emails = recipients
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean)
    .filter(email => email.includes("@")); // Validation basique
  
  const count = emails.length;
  const maxAllowed = PLAN_LIMITS[user?.plan || "FREE"].max;
  const exceedsLimit = count > maxAllowed;

  useEffect(() => {
    fetchQuota();
  }, []);

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

  // Parse CSV/Excel file
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
      
      // Detect if first line is header
      const firstLine = lines[0];
      const hasHeader = firstLine.toLowerCase().includes("email") || firstLine.toLowerCase().includes("mail");
      
      // Extract emails (assume first column contains emails)
      const emailLines = hasHeader ? lines.slice(1) : lines;
      const extractedEmails = emailLines
        .map(line => {
          // Split by comma, semicolon, or tab
          const parts = line.split(/[,;\t]/);
          return parts[0].trim();
        })
        .filter(email => email.includes("@"));

      if (extractedEmails.length > maxAllowed) {
        setError(`Votre plan ${user.plan} limite à ${maxAllowed} destinataires par envoi. ${extractedEmails.length} emails détectés.`);
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
      setError(`Votre plan ${user.plan} limite à ${maxAllowed} destinataires par envoi.`);
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
      fetchQuota(); // Rafraîchir le quota
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>
            Envoyer des emails à plusieurs destinataires
          </p>
        </div>
        
        {/* Info plan */}
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
            {PLAN_LIMITS[user?.plan || "FREE"].label}
          </span>
        </div>
      </div>

      {/* Quota restant */}
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

      {/* Confirmation */}
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

      {/* Erreur */}
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

      {/* Avertissement limite dépassée */}
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
              Vous avez {count} destinataires mais votre plan {user.plan} limite à {maxAllowed} par envoi. 
              Passez au plan supérieur ou réduisez le nombre de destinataires.
            </p>
          </div>
        </div>
      )}

      {/* Formulaire */}
      <div style={{ ...styles.card, padding: 24 }}>
        <h3 style={{ color: T.text, fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>
          Nouvel envoi en lot
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Upload fichier */}
          <div>
            <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
              Importer des destinataires
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
                alignItems: "center", 
                justifyContent: "center", 
                gap: 10,
                padding: "20px", 
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
                <Upload size={24} color={T.textSub} />
                <div>
                  <p style={{ margin: 0, fontSize: 13, color: T.text, fontWeight: 600 }}>
                    Cliquez pour importer un fichier
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: T.textMuted }}>
                    CSV ou Excel (.xlsx, .xls)
                  </p>
                </div>
              </label>
            )}
            <p style={{ margin: "8px 0 0", fontSize: 11, color: T.textMuted }}>
              📄 Format attendu : une adresse email par ligne (première colonne)
            </p>
          </div>

          {/* OU séparateur */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 700 }}>OU</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {/* Destinataires manuels */}
          <div>
            <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
              Saisie manuelle (un email par ligne)
            </label>
            <textarea 
              value={recipients} 
              onChange={(e) => setRecipients(e.target.value)} 
              placeholder={"contact@example.com\ninfo@example.com\nsupport@example.com"}
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
              {exceedsLimit && (
                <span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>
                  Limite dépassée
                </span>
              )}
            </div>
          </div>

          {/* Sujet */}
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

          {/* Corps HTML */}
          <div>
            <label style={{ color: T.textSub, fontSize: 14, display: "block", marginBottom: 8, fontWeight: 600 }}>
              Corps de l'email (HTML)
            </label>
            <textarea 
              value={html} 
              onChange={(e) => setHtml(e.target.value)} 
              placeholder={"<h1>Bonjour !</h1>\n<p>Voici notre newsletter du mois...</p>\n<p>Cordialement,<br>L'équipe</p>"}
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

          {/* Submit */}
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
      </div>
    </div>
  );
}