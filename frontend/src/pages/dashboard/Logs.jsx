// =====================================================
// src/pages/dashboard/Logs.jsx
// =====================================================
import { useState } from "react";
import { T, styles } from "../../theme";
import Badge from "../../components/Badge";

const subs = ["Bienvenue !","Réinitialisation MP","Commande confirmée","Newsletter Jan","Alerte système","Facture #1042"];
const sts  = ["SENT","SENT","SENT","FAILED","SENT","SENT","BOUNCED","SENT","SENT","FAILED","SENT","SENT","SENT","FAILED","SENT","SENT","SENT","SENT","SENT","SENT"];
const allLogs = sts.map((st, i) => ({
  id: i,
  to: `user${i+1}@example.com`,
  subject: subs[i % 6],
  status: st,
  bulk: i % 5 === 0,
  err: st === "FAILED" ? "SMTP timeout after 30s" : null,
  date: new Date(Date.now() - i * 5.4e6),
}));

export default function Logs() {
  const [filter, setFilter] = useState("ALL");
  const [q, setQ]           = useState("");

  const data = allLogs
    .filter((l) => filter === "ALL" || l.status === filter)
    .filter((l) => l.subject.toLowerCase().includes(q.toLowerCase()) || l.to.includes(q));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        {/* <h1 style={{ color: T.text, fontSize: 22, fontWeight: 700, margin: 0 }}>Email Logs</h1> */}
        <p style={{ color: T.textSub, fontSize: 20, margin: "4px 0 0" }}>Historique complet de vos envois</p>
      </div>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 3, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: 3 }}>
          {["ALL","SENT","FAILED","BOUNCED"].map((st) => (
            <button key={st} onClick={() => setFilter(st)} style={{
              background: filter === st ? T.primary : "transparent",
              border: "none",
              color: filter === st ? "#fff" : T.textSub,
              padding: "5px 13px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>{st}</button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍  Rechercher..."
          style={{ ...styles.input, flex: 1, minWidth: 180 }}
        />
      </div>

      {/* Table */}
      <div style={{ ...styles.card, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 190px 95px 130px", padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
          {["Sujet","À","Statut","Date"].map((h) => (
            <span key={h} style={{ color: T.textSub, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {/* Rows */}
        {data.map((l) => (
          <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 190px 95px 130px", padding: "11px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
            <div>
              <span style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>{l.subject}</span>
              {l.bulk && <span style={{ background: T.primaryLight, color: T.primary, fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 10, marginLeft: 6 }}>BULK</span>}
              {l.err  && <p style={{ color: T.danger, fontSize: 11, margin: "2px 0 0" }}>{l.err}</p>}
            </div>
            <span style={{ color: T.textSub, fontSize: 12 }}>{l.to}</span>
            <Badge status={l.status} />
            <span style={{ color: T.textMuted, fontSize: 11 }}>
              {l.date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
        {data.length === 0 && <p style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Aucun résultat trouvé.</p>}
      </div>
    </div>
  );
}
