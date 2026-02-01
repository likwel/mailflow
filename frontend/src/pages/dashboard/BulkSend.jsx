import { useState } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";

export default function BulkSend() {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const emails = recipients.split("\n").map(x => x.trim()).filter(Boolean);
  const count = emails.length;

  async function submit() {
    if (!count || !subject || !html) {
      setError("Remplissez tous les champs.");
      return;
    }
    setError("");
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
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>Envoyer des emails à plusieurs destinataires en une opération</p>
      </div>

      {/* Confirmation */}
      {sent && (
        <div style={{ background: T.successLight, border: "1px solid #bbf7d0", borderRadius: T.radius, padding: "14px 18px" }}>
          <p style={{ color: T.success, fontSize: 13, fontWeight: 600, margin: 0 }}>✅ {sent.count} email(s) envoyé(s) avec succès à {sent.time}</p>
          <button onClick={() => setSent(null)} style={{ background: "none", border: "none", color: T.textSub, fontSize: 11, cursor: "pointer", marginTop: 4, padding: 0 }}>Fermer</button>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.danger, fontSize: 13, fontWeight: 600, margin: 0 }}>❌ {error}</p>
        </div>
      )}

      {/* Formulaire */}
      <div style={{ ...styles.card, padding: 20 }}>
        <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Nouvel envoi en lot</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Destinataires */}
          <div>
            <label style={{ color: T.textSub, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 600 }}>Destinataires (un email par ligne)</label>
            <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder={"user1@email.com\nuser2@email.com\nuser3@email.com"} rows={5} style={{ ...styles.input, resize: "vertical", fontFamily: "monospace", fontSize: 12, padding: "10px 13px" }} />
            <p style={{ color: T.textMuted, fontSize: 11, margin: "4px 0 0" }}>{count} destinataire(s) détecté(s)</p>
          </div>
          {/* Sujet */}
          <div>
            <label style={{ color: T.textSub, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 600 }}>Sujet</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet de l'email" style={styles.input} />
          </div>
          {/* Corps HTML */}
          <div>
            <label style={{ color: T.textSub, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 600 }}>Corps HTML</label>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} placeholder={"<h1>Titre</h1>\n<p>Contenu de votre email...</p>"} rows={4} style={{ ...styles.input, resize: "vertical", fontFamily: "monospace", fontSize: 12, padding: "10px 13px" }} />
          </div>
          {/* Submit */}
          <button
            onClick={submit}
            disabled={loading}
            style={{
              ...styles.btnSm,
              alignSelf: "flex-start",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "⏳ Envoi en cours..." : `📬 Envoyer en lot (${count})`}
          </button>
        </div>
      </div>
    </div>
  );
}