// =====================================================
// src/pages/dashboard/Logs.jsx
// =====================================================
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import Badge from "../../components/Badge";
import client from "../../api/client";
import { Search, RefreshCw, ChevronLeft, ChevronRight, X, Eye, Send } from "lucide-react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 20 };
      if (filter !== "ALL") params.status = filter;
      
      const res = await client.get("/dashboard/logs", { params });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  }

  async function resendEmail(log) {
    setResending(true);
    setError("");
    try {
      await client.post("/dashboard/send", {
        to: log.to,
        cc: log.cc,
        bcc: log.bcc,
        subject: log.subject,
        html: log.htmlBody,
        text: log.textBody,
      });
      alert(`Email renvoyé avec succès à ${log.to.join(", ")}`);
      setSelectedLog(null);
      fetchLogs();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du renvoi");
    } finally {
      setResending(false);
    }
  }

  const data = logs.filter((l) => 
    l.subject.toLowerCase().includes(q.toLowerCase()) || 
    l.to.some(email => email.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <p style={{ color: T.textSub, fontSize: "1rem", margin: "4px 0 0" }}>
          Historique complet de vos envois · {total} email{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.danger, fontSize: 15, fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", height : "h-full", gap: 3, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
          {["ALL","SENT","FAILED","BOUNCED"].map((st) => (
            <button 
              key={st} 
              onClick={() => { setFilter(st); setPage(1); }}
              style={{
                background: filter === st ? T.primary : "transparent",
                border: "none",
                color: filter === st ? "#fff" : T.textSub,
                padding: "5px 13px", 
                borderRadius: 6, 
                cursor: "pointer", 
                fontSize: ".75rem", 
                fontWeight: 500,
              }}
            >
              {st}
            </button>
          ))}
        </div>
        
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <Search 
            size={16} 
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textMuted }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher..."
            style={{ ...styles.input, paddingLeft: 36 }}
          />
        </div>

        <button 
          onClick={fetchLogs} 
          disabled={loading} 
          style={{ 
            ...styles.btnSm, 
            opacity: loading ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize : ".75rem",
          }}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Table */}
      <div style={{ ...styles.card, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 190px 95px 130px 80px", padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {["Sujet","À","Statut","Date","Actions"].map((h) => (
            <span key={h} style={{ color: T.textSub, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ color: T.textSub, fontSize: 15, textAlign: "center", padding: 32 }}>Chargement...</p>
        )}

        {/* Rows */}
        {!loading && data.map((l) => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 190px 95px 130px 80px", padding: "11px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
            <div>
              <span style={{ color: T.text, fontSize: 15, fontWeight: 500 }}>{l.subject}</span>
              {l.isBulk && <span style={{ background: T.primaryLight, color: T.primary, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10, marginLeft: 6 }}>BULK</span>}
              {l.error && <p style={{ color: T.danger, fontSize: 11, margin: "2px 0 0" }}>{l.error}</p>}
            </div>
            <span style={{ color: T.textSub, fontSize: 12 }}>
              {l.to[0]}
              {l.to.length > 1 && <span style={{ fontSize: 10, color: T.textMuted }}> +{l.to.length - 1}</span>}
            </span>
            <Badge status={l.status} />
            <span style={{ color: T.textMuted, fontSize: 12 }}>
              {new Date(l.sentAt || l.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={() => setSelectedLog(l)}
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "5px 8px",
                cursor: "pointer",
                color: T.primary,
                fontSize: 11,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Eye size={14} />
              Voir
            </button>
          </div>
        ))}

        {/* Vide */}
        {!loading && data.length === 0 && (
          <p style={{ color: T.textMuted, fontSize: 15, textAlign: "center", padding: 32 }}>Aucun résultat trouvé.</p>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              ...styles.btnOutline,
              padding: "7px 10px",
              opacity: page === 1 ? 0.4 : 1,
              cursor: page === 1 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  style={{
                    background: page === pageNum ? T.primary : "transparent",
                    color: page === pageNum ? "#fff" : T.text,
                    border: `1px solid ${page === pageNum ? T.primary : T.border}`,
                    padding: "7px 12px",
                    borderRadius: 8,
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    minWidth: 36,
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              ...styles.btnOutline,
              padding: "7px 10px",
              opacity: page === totalPages ? 0.4 : 1,
              cursor: page === totalPages ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={16} />
          </button>

          <span style={{ marginLeft: 12, fontSize: 15, color: T.textSub }}>
            Page {page} sur {totalPages}
          </span>
        </div>
      )}

      {/* Modal détails */}
      {selectedLog && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20,
        }} onClick={() => setSelectedLog(null)}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            maxWidth: 700,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            boxShadow: T.shadowMd,
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.text }}>Détails de l'email</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: "none", border: "none", cursor: "pointer", color: T.textSub }}>
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: 24 }}>
              {/* Statut */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: T.textSub, fontWeight: 600, margin: "0 0 6px" }}>STATUT</p>
                <Badge status={selectedLog.status} />
                {selectedLog.error && (
                  <div style={{ marginTop: 8, padding: "10px 12px", background: T.dangerLight, borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: 14, color: T.danger, fontWeight: 600 }}>Erreur :</p>
                    <p style={{ margin: "4px 0 0", fontSize: 14, color: T.danger }}>{selectedLog.error}</p>
                  </div>
                )}
              </div>

              {/* Destinataires */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: T.textSub, fontWeight: 600, margin: "0 0 6px" }}>DESTINATAIRES</p>
                <p style={{ margin: 0, fontSize: 15, color: T.text }}>{selectedLog.to.join(", ")}</p>
                {selectedLog.cc?.length > 0 && <p style={{ margin: "4px 0 0", fontSize: 14, color: T.textSub }}>CC : {selectedLog.cc.join(", ")}</p>}
                {selectedLog.bcc?.length > 0 && <p style={{ margin: "4px 0 0", fontSize: 14, color: T.textSub }}>BCC : {selectedLog.bcc.join(", ")}</p>}
              </div>

              {/* Sujet */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: T.textSub, fontWeight: 600, margin: "0 0 6px" }}>SUJET</p>
                <p style={{ margin: 0, fontSize: 15, color: T.text, fontWeight: 500 }}>{selectedLog.subject}</p>
              </div>

              {/* Dates */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: T.textSub, fontWeight: 600, margin: "0 0 6px" }}>DATES</p>
                <p style={{ margin: 0, fontSize: 14, color: T.text }}>Créé : {new Date(selectedLog.createdAt).toLocaleString("fr-FR")}</p>
                {selectedLog.sentAt && <p style={{ margin: "4px 0 0", fontSize: 14, color: T.text }}>Envoyé : {new Date(selectedLog.sentAt).toLocaleString("fr-FR")}</p>}
              </div>

              {/* Contenu */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: T.textSub, fontWeight: 600, margin: "0 0 6px" }}>CONTENU HTML</p>
                <div style={{ 
                  border: `1px solid ${T.border}`, 
                  borderRadius: 8, 
                  padding: 16, 
                  background: T.bg, 
                  maxHeight: 300, 
                  overflow: "auto" 
                }}>
                  <div dangerouslySetInnerHTML={{ __html: selectedLog.htmlBody }} />
                </div>
              </div>

              {/* Actions */}
              {selectedLog.status === "FAILED" && (
                <button
                  onClick={() => resendEmail(selectedLog)}
                  disabled={resending}
                  style={{
                    ...styles.btn,
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    opacity: resending ? 0.6 : 1,
                  }}
                >
                  <Send size={16} />
                  {resending ? "Renvoi en cours..." : "Renvoyer cet email"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}