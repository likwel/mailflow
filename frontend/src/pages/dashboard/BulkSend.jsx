// =====================================================
// src/pages/dashboard/BulkSend.jsx
// =====================================================
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Send, Upload, FileText, X, AlertCircle, Info, Mail, Users, FileSpreadsheet } from "lucide-react";
import ManualTab     from "../../components/bulksend/ManualTab";
import BulkTab from "../../components/bulksend/BulkTab";
import FileTab from "../../components/bulksend/FileTab";

export default function BulkSend() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("manual"); // manual, bulk, template
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [varValues, setVarValues] = useState({});
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

  async function submit(varValues) {
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
        varValues
      });
      setSent({ count: res.data.sent, time: new Date().toLocaleTimeString() });
      setRecipients("");
      setSubject("");
      setHtml("");
      setVarValues({})
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
          <h1 style={{ color: T.text, fontSize: 28, fontWeight: 700, margin: 0 }}>Envoyer des emails</h1>
          <p style={{ color: T.textSub, fontSize: 14, margin: "4px 0 0" }}>
            Gérez vos envoyer des emails à un ou plusieurs destinataires
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
            {PLAN_LIMITS ? PLAN_LIMITS.maxBulkSend : '10'} emails max par envoi — Passez en Pro pour envoyer davantage 🚀
          </span>
        </div>
      </div>

      {/* Quota */}
      {quota && (
        <div style={{ 
          ...styles.card, 
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div>
            <p style={{ color: '#1e293b', fontSize: '1rem', fontWeight: 600, margin: 0, marginBottom : 10 }}>Quota mensuel</p>
            <p style={{ color: T.textSub, fontSize: 12, fontWeight: 500, margin: "2px 0 0" }}>
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
        <div style={{ display:"flex", background:"#fff" , padding:5, borderBottom:'2px solid #f1f5f9' }}>
          <div style={{ display:"flex", background:"#f1f5f9", padding :3 , borderRadius : 6}}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                  padding:"10px 14px", borderRadius:6, border:"none", cursor:"pointer",
                  fontSize:".9rem", fontWeight:700,
                  background: isActive ? "#fff" : "transparent",
                  color: isActive ? T.primary : T.textSub,
                  boxShadow: isActive ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                  transition:"all .15s",
                  borderBottom : 'none'
                }}>
                <Icon size={15}/>
                {tab.label}
              </button>
            );
          })}
          </div>
          <></>
        </div>

        {/* Tab Content */}
        <div style={{ padding: 24 }}>
          
          
        {/* Tab 1: Saisie manuelle */}
        {activeTab === "manual" && (
          <ManualTab
            recipients={recipients} setRecipients={setRecipients}
            subject={subject} setSubject={setSubject}
            html={html} setHtml={setHtml}
            count={count} maxAllowed={maxAllowed}
            exceedsLimit={exceedsLimit} loading={loading}
            // onSubmit={submit}
            onSubmit={(varValues) => submit(varValues)}
          />
        )}

          {/* Tab 2: Envoi en lot (copier-coller) */}
          {activeTab === "bulk" && (
            <BulkTab
              maxAllowed={maxAllowed}
              loading={loading}
              onSubmit={({ to, subject, html, varValues }) => {
                setRecipients(to.join("\n"));
                setSubject(subject);
                setHtml(html);
                setVarValues(varValues)
                submit(varValues); // ta fonction d'envoi existante
              }}
            />
          )}

          {/* Tab 3: Import fichier */}
          {activeTab === "file" && (
            <FileTab
              maxAllowed={maxAllowed}
              loading={loading}
              onSubmit={({ to, subject, html, varValues }) => {
                setRecipients(to.join("\n"));
                setSubject(subject);
                setHtml(html);
                setVarValues(varValues)
                submit(varValues);
              }}
            />
          )}
          
        </div>
      </div>
    </div>
  );
}