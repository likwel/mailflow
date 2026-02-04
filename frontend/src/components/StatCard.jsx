// =====================================================
// src/components/StatCard.jsx
// =====================================================
import { T, styles } from "../theme";

export default function StatCard({ title, value, sub, icon : Icon, color }) {
  return (
    <div style={{ ...styles.card, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: T.textMuted, fontSize: '0.75rem', textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 6px", fontWeight: 600 }}>
            {title}
          </p>
          <p style={{ color: T.text, fontSize: 26, fontWeight: 700, margin: 0 }}>{value}</p>
          {sub && <p style={{ color: T.textSub, fontSize: 11, margin: "3px 0 0" }}>{sub}</p>}
        </div>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 9,
          background: (color || T.primary) + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
        }}>
          <Icon size={25} color={color}/>
        </div>
      </div>
    </div>
  );
}
