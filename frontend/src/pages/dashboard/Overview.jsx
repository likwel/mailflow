// =====================================================
// src/pages/dashboard/Overview.jsx
// =====================================================
import { T, styles } from "../../theme";
import StatCard  from "../../components/StatCard";
import QuotaBar  from "../../components/QuotaBar";
import Badge     from "../../components/Badge";
import {
  FiSend,
  FiAlertTriangle,
  FiFileText,
  FiKey
} from "react-icons/fi";

// Mock logs pour l'aperçu rapide
const mockLogs = [
  { id: 1, to: "user1@ex.com", subject: "Bienvenue !",          status: "SENT",   date: new Date(Date.now() - 1e6) },
  { id: 2, to: "user2@ex.com", subject: "Réinitialisation MP",  status: "SENT",   date: new Date(Date.now() - 3e6) },
  { id: 3, to: "user3@ex.com", subject: "Commande confirmée",   status: "FAILED", date: new Date(Date.now() - 6e6) },
  { id: 4, to: "user4@ex.com", subject: "Newsletter Jan",       status: "SENT",   date: new Date(Date.now() - 9e6) },
  { id: 5, to: "user5@ex.com", subject: "Alerte système",       status: "BOUNCED",date: new Date(Date.now() - 12e6) },
  { id: 6, to: "user6@ex.com", subject: "Facture #1042",        status: "SENT",   date: new Date(Date.now() - 15e6) },
  { id: 7, to: "user7@ex.com", subject: "Bienvenue !",          status: "SENT",   date: new Date(Date.now() - 18e6) },
];

export default function Overview() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        {/* <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Dashboard</h1> */}
        <p style={{ color: T.textSub, fontSize: "1rem", margin: "4px 0 0" }}>Bienvenue 👋</p>
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
          value="1 842"
          sub="+12% ce mois"
          icon={FiSend}
          color={T.primary}
        />

        <StatCard
          title="Échoués"
          value="23"
          sub="1.2% du total"
          icon={FiAlertTriangle}
          color={T.danger}
        />

        <StatCard
          title="Templates"
          value="4"
          sub="3 perso · 1 system"
          icon={FiFileText}
          color="#8b5cf6"
        />

        <StatCard
          title="API Keys"
          value="3"
          sub="2 actives"
          icon={FiKey}
          color="#06b6d4"
        />
      </div>


      {/* Quota */}
      <QuotaBar used={1842} total={5000} />

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
