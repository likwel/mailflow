// =====================================================
// src/pages/dashboard/Overview.jsx
// =====================================================
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { T, styles } from "../../theme";
import StatCard  from "../../components/StatCard";
import QuotaBar  from "../../components/QuotaBar";
import Badge     from "../../components/Badge";
import client from "../../api/client";
import {
  FiSend,
  FiAlertTriangle,
  FiFileText,
  FiKey
} from "react-icons/fi";

// Mock logs pour l'aperçu rapide
const mockLogs_old = [
  { id: 1, to: "user1@ex.com", subject: "Bienvenue !",          status: "SENT",   date: new Date(Date.now() - 1e6) },
  { id: 2, to: "user2@ex.com", subject: "Réinitialisation MP",  status: "SENT",   date: new Date(Date.now() - 3e6) },
  { id: 3, to: "user3@ex.com", subject: "Commande confirmée",   status: "FAILED", date: new Date(Date.now() - 6e6) },
  { id: 4, to: "user4@ex.com", subject: "Newsletter Jan",       status: "SENT",   date: new Date(Date.now() - 9e6) },
  { id: 5, to: "user5@ex.com", subject: "Alerte système",       status: "BOUNCED",date: new Date(Date.now() - 12e6) },
  { id: 6, to: "user6@ex.com", subject: "Facture #1042",        status: "SENT",   date: new Date(Date.now() - 15e6) },
  { id: 7, to: "user7@ex.com", subject: "Bienvenue !",          status: "SENT",   date: new Date(Date.now() - 18e6) },
];

export default function Overview() {

  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [pageActivity, setPageActivity] = useState(1);

  useEffect(() => {
    fetchStats();
    fetchLogs();
  }, [pageActivity, filter]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await client.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = { pageActivity, limit: 10 };
      if (filter !== "ALL") params.status = filter;
      const res = await client.get("/dashboard/logs", { params });

      setLogs(res.data.logs);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }

  const formatMailLogs = (logs) => {
    return logs.map((log, index) => ({
      id: index + 1, // ou log.id si tu veux garder l'id réel
      to: log.to?.[0] ?? "—",
      subject: log.subject,
      status: log.status,
      date: new Date(log.sentAt || log.createdAt),
      error: log.error ?? null,
    }));
  };


  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: T.textSub, fontSize: 14 }}>Chargement des statistiques...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: T.danger, fontSize: 14 }}>Erreur lors du chargement</p>
      </div>
    );
  }

  const failedPercent = stats.sent > 0 ? ((stats.failed / (stats.sent + stats.failed)) * 100).toFixed(1) : 0;

  const mockLogs = formatMailLogs(logs);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        {/* <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Dashboard</h1> */}
        <p style={{ color: T.textSub, fontSize: "1rem", margin: "4px 0 0" }}>Bienvenue, {user?.name || "utilisateur"}👋</p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))",
          gap: 14
        }}
      >
        <StatCard
          title="Envoyés"
          value={stats.sent.toLocaleString()}
          sub={stats.sentThisMonth > 0 ? `${stats.sentThisMonth} ce mois` : "Aucun ce mois"}
          icon={FiSend}
          color={T.primary}
        />

        <StatCard
          title="Échoués"
          value={stats.failed.toLocaleString()}
          sub={`${failedPercent}% du total`}
          icon={FiAlertTriangle}
          color={T.danger}
        />

        <StatCard
          title="Templates"
          value={stats.templates.toLocaleString()}
          sub={`${stats.templatesPersonal} perso · ${stats.templatesSystem} system`}
          icon={FiFileText}
          color="#8b5cf6"
        />

        <StatCard
          title="API Keys"
          value={stats.apiKeys.toLocaleString()}
          sub={`${stats.apiKeysActive} active${stats.apiKeysActive > 1 ? "s" : ""}`}
          icon={FiKey}
          color="#06b6d4"
        />
      </div>


      {/* Quota */}
      {/* <QuotaBar used={1842} total={5000} /> */}
      <QuotaBar used={user.emailsUsed} total={stats.quota} />

      {/* Activité récente */}
      <div style={{ ...styles.card, padding: 20 }}>
        <p style={{ color: T.text, fontSize: "1rem", fontWeight: 600, margin: "0 0 14px" }}>Activité récente</p>
        {mockLogs.map((l) => (
          <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{minWidth:80}}>
                <Badge status={l.status} />
              </div>
              <div>
                <p style={{ color: T.text, fontSize: 13, margin: 0, fontWeight: 500 }}>{l.subject}</p>
                <p style={{ color: T.textMuted, fontSize: 12, margin: "2px 0 0" }}>{l.to}</p>
              </div>
            </div>
            <span style={{ color: T.textMuted, fontSize: 12 }}>
              {l.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
