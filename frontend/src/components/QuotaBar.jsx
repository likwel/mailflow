// =====================================================
// src/components/QuotaBar.jsx
// =====================================================
import { T, styles } from "../theme";

export default function QuotaBar({ used, total }) {
  const pct = (used / total) * 100;
  const barColor = pct > 80
    ? "linear-gradient(90deg, #f59e0b, #ef4444)"
    : `linear-gradient(90deg, ${T.primary}, #8b5cf6)`;

  return (
    <div style={{ ...styles.card, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ color: T.text, fontSize: "1rem", fontWeight: 600 }}>Quota mensuel</span>
        <span style={{ color: T.primary, fontSize: 13, fontWeight: 600 }}>{used.toLocaleString()} / {total.toLocaleString()}</span>
      </div>
      <div style={{ height: 8, background: T.bg, borderRadius: 4, overflow: "hidden", border: `1px solid ${T.border}` }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: barColor, transition: "width 0.4s" }} />
      </div>
      <p style={{ color: T.textSub, fontSize: 11, margin: "6px 0 0" }}>
        {(total - used).toLocaleString()} emails restants ce mois
      </p>
    </div>
  );
}
