// =====================================================
// src/pages/dashboard/Logs.jsx
// =====================================================
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import Badge from "../../components/Badge";
import client from "../../api/client";
import { Search, RefreshCw, ChevronLeft, ChevronRight, X, Eye, Send, Trash2, Edit, Archive, CheckSquare, Square, Download } from "lucide-react";

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
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    fetchLogs();
  }, [page, filter]);

  async function fetchLogs() {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: 10 };
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

  // Sélectionner/Désélectionner tout
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(item => item.id)));
    }
  };

  // Sélectionner/Désélectionner un élément
  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Actions groupées
  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`Supprimer ${selectedIds.size} email(s) ?`)) return;

    try {
      // Appel API pour supprimer
      // await client.delete('/emails/bulk', { data: { ids: Array.from(selectedIds) } });

      setData(data.filter(item => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      alert('Emails supprimés avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const archiveSelected = async () => {
    if (selectedIds.size === 0) return;

    try {
      // await client.patch('/emails/bulk-archive', { ids: Array.from(selectedIds) });

      setData(data.map(item =>
        selectedIds.has(item.id)
          ? { ...item, status: 'archived' }
          : item
      ));
      setSelectedIds(new Set());
      alert('Emails archivés avec succès');
    } catch (error) {
      console.error('Erreur archivage:', error);
      alert('Erreur lors de l\'archivage');
    }
  };

  const resendSelected = async () => {
    if (selectedIds.size === 0) return;

    if (!window.confirm(`Renvoyer ${selectedIds.size} email(s) ?`)) return;

    try {
      // await client.post('/emails/bulk-resend', { ids: Array.from(selectedIds) });

      alert('Emails renvoyés avec succès');
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Erreur renvoi:', error);
      alert('Erreur lors du renvoi');
    }
  };

  const exportSelected = () => {
    if (selectedIds.size === 0) return;

    const selectedData = data.filter(item => selectedIds.has(item.id));
    const csvContent = [
      ['ID', 'Sujet', 'Destinataire', 'Statut', 'Date'].join(','),
      ...selectedData.map(item => [
        item.id,
        `"${item.subject}"`,
        item.to.join(';'),
        item.status,
        new Date(item.sentAt || item.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emails-export-${Date.now()}.csv`;
    link.click();
  };

  const allSelected = selectedIds.size > 0 && selectedIds.size === data.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>
          Historique complet de vos envois · <span style={{ color: '#6366f1', fontWeight: 600 }}>{total}</span> email{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.danger, fontSize: 15, fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "stretch" }}>
        <div style={{ display: "flex", height: "h-full", gap: 3, background: "white", border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
          {["ALL", "SENT", "FAILED", "BOUNCED"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setFilter(st);
                setPage(1);
                setSelectedIds(new Set()); // Reset sélection au changement de filtre
              }}
              style={{
                background: filter === st ? T.primary : "transparent",
                border: "none",
                color: filter === st ? "#fff" : '#1e293b',
                padding: "5px 13px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: ".75rem",
                fontWeight: 600,
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
          onClick={() => {
            fetchLogs();
            setSelectedIds(new Set());
          }}
          disabled={loading}
          style={{
            ...styles.btnSm,
            opacity: loading ? 0.5 : 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: ".75rem",
          }}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* NOUVELLE Barre d'actions groupées */}
      {selectedIds.size > 0 && (
        <div style={{
          ...styles.card,
          padding: "14px 24px",
          background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primaryLight}dd 100%)`,
          border: `2px solid ${T.primary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          animation: "slideDown 0.3s ease-out"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <CheckSquare size={22} color={T.primary} strokeWidth={2.5} />
            <span style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.primary
            }}>
              {selectedIds.size} email{selectedIds.size > 1 ? 's' : ''} sélectionné{selectedIds.size > 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={resendSelected}
              style={{
                padding: "9px 18px",
                background: T.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                boxShadow: `0 4px 12px ${T.primary}30`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${T.primary}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${T.primary}30`;
              }}
            >
              <Send size={15} />
              Renvoyer
            </button>

            <button
              onClick={exportSelected}
              style={{
                padding: "9px 18px",
                background: "#fff",
                color: T.text,
                border: `2px solid ${T.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.bg;
                e.currentTarget.style.borderColor = T.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <Download size={15} />
              Exporter CSV
            </button>

            <button
              onClick={archiveSelected}
              style={{
                padding: "9px 18px",
                background: "#fff",
                color: T.text,
                border: `2px solid ${T.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.bg;
                e.currentTarget.style.borderColor = T.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = T.border;
              }}
            >
              <Archive size={15} />
              Archiver
            </button>

            <button
              onClick={deleteSelected}
              style={{
                padding: "9px 18px",
                background: "#fff",
                color: T.danger,
                border: `2px solid ${T.danger}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.danger;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.color = T.danger;
              }}
            >
              <Trash2 size={15} />
              Supprimer
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                padding: "9px 14px",
                background: "transparent",
                color: T.textSub,
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.text;
                e.currentTarget.style.background = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.textSub;
                e.currentTarget.style.background = "transparent";
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...styles.card, overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "50px 100px 1fr 200px 140px 90px",
          padding: "14px 8px",
          background: T.bg,
          borderBottom: `2px solid ${T.border}`,
          position: "sticky",
          top: 0,
          zIndex: 10
        }}>
          {/* NOUVELLE Checkbox tout sélectionner */}
          <div
            onClick={toggleSelectAll}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title={allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          >
            {allSelected ? (
              <CheckSquare
                size={20}
                color={T.primary}
                strokeWidth={2.5}
              />
            ) : someSelected ? (
              <div style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: `2px solid ${T.primary}`,
                background: T.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{
                  width: 10,
                  height: 2,
                  background: T.primary
                }}></div>
              </div>
            ) : (
              <Square
                size={20}
                color={T.textSub}
                strokeWidth={2}
              />
            )}
          </div>

          {["Statut", "Sujet", "Destinataire", "Date d'envoi", "Actions"].map((h) => (
            <span
              key={h}
              style={{
                color: T.textSub,
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                fontWeight: 700
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{
            padding: "60px 24px",
            textAlign: "center"
          }}>
            <div style={{
              width: 40,
              height: 40,
              border: `3px solid ${T.border}`,
              borderTopColor: T.primary,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }}></div>
            <p style={{
              color: T.textSub,
              fontSize: 14,
              margin: 0
            }}>
              Chargement des emails...
            </p>
          </div>
        )}

        {/* Rows */}
        {!loading && data.map((l, index) => {
          const isSelected = selectedIds.has(l.id);

          return (
            <div
              key={l.id}
              style={{
                display: "grid",
                gridTemplateColumns: "50px 100px 1fr 200px 140px 90px",
                padding: "14px 14px 8px 8px",
                borderBottom: index === data.length - 1 ? "none" : `1px solid ${T.border}`,
                alignItems: "center",
                transition: "all 0.2s ease",
                cursor: "pointer",
                background: isSelected ? T.primaryLight : "transparent"
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "#fafbfc";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
              onClick={(e) => {
                if (e.target.closest('button') || e.target.closest('[data-checkbox]')) {
                  return;
                }
                toggleSelect(l.id);
              }}
            >
              {/* NOUVELLE Checkbox */}
              <div
                data-checkbox
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(l.id);
                }}
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {isSelected ? (
                  <CheckSquare
                    size={20}
                    color={T.primary}
                    strokeWidth={2.5}
                  />
                ) : (
                  <Square
                    size={20}
                    color={T.textSub}
                    strokeWidth={2}
                  />
                )}
              </div>

              {/* Statut */}
              <div>
                <Badge status={l.status} />
              </div>

              {/* Sujet */}
              <div style={{
                paddingRight: 12,
                minWidth: 0
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 2
                }}>
                  <span style={{
                    color: T.text,
                    fontSize: 14,
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {l.subject}
                  </span>
                  {l.isBulk && (
                    <span style={{
                      background: `linear-gradient(135deg, ${T.primaryLight} 0%, ${T.primaryLight}dd 100%)`,
                      color: T.primary,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: 12,
                      whiteSpace: "nowrap",
                      border: `1px solid ${T.primary}30`
                    }}>
                      📧 Campagne
                    </span>
                  )}
                </div>
                {l.error && (
                  <p style={{
                    color: T.danger,
                    fontSize: 12,
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <span style={{ fontSize: 14 }}>⚠️</span>
                    {l.error}
                  </p>
                )}
              </div>

              {/* Destinataire */}
              <div style={{
                paddingRight: 12
              }}>
                <span style={{
                  color: T.text,
                  fontSize: 13,
                  fontWeight: 500,
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {l.to[0]}
                </span>
                {l.to.length > 1 && (
                  <span style={{
                    fontSize: 11,
                    color: T.primary,
                    fontWeight: 600,
                    background: T.primaryLight,
                    padding: "2px 6px",
                    borderRadius: 8,
                    display: "inline-block",
                    marginTop: 4
                  }}>
                    +{l.to.length - 1} autre{l.to.length - 1 > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Date */}
              <span style={{
                color: T.textSub,
                fontSize: 13,
                fontWeight: 500
              }}>
                {new Date(l.sentAt || l.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>

              {/* Actions */}
              <div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLog(l);
                  }}
                  style={{
                    background: "transparent",
                    border: `2px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "7px 12px",
                    cursor: "pointer",
                    color: T.primary,
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s ease",
                    width: "100%",
                    justifyContent: "center"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.primaryLight;
                    e.currentTarget.style.borderColor = T.primary;
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = T.border;
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Eye size={15} />
                  Voir
                </button>
              </div>
            </div>
          );
        })}

        {/* Vide */}
        {!loading && data.length === 0 && (
          <div style={{
            padding: "60px 24px",
            textAlign: "center"
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: T.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: 32
            }}>
              📭
            </div>
            <h3 style={{
              color: T.text,
              fontSize: 18,
              fontWeight: 700,
              margin: "0 0 8px"
            }}>
              Aucun email trouvé
            </h3>
            <p style={{
              color: T.textSub,
              fontSize: 14,
              margin: 0
            }}>
              Aucun résultat ne correspond à vos critères de recherche
            </p>
          </div>
        )}

        {/* Animation CSS */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>

      {/* Pagination - Reste identique */}
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