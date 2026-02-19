// src/components/ui/CustomBadge.jsx


const STATUS_CONFIG = {
  // ── Actifs ──────────────────────────────────────────
  ACTIVE:       { bg:"#d1fae5", color:"#065f46", dot:"#10b981", label:"Actif" },        // vert émeraude
  SENT:         { bg:"#ecfdf5", color:"#047857", dot:"#34d399", label:"Envoyé" },        // vert menthe

  // ── Inactifs / neutres ───────────────────────────────
  INACTIVE:     { bg:"#f1f5f9", color:"#475569", dot:"#94a3b8", label:"Inactif" },       // gris ardoise
  BLOCKED:      { bg:"#fafafa", color:"#52525b", dot:"#a1a1aa", label:"Bloqué" },        // gris zinc

  // ── Avertissements ───────────────────────────────────
  UNSUBSCRIBED: { bg:"#fef3c7", color:"#92400e", dot:"#f59e0b", label:"Désabonné" },     // ambre
  SYSTEM:       { bg:"#fff7ed", color:"#9a3412", dot:"#fb923c", label:"Par défaut" },    // orange

  // ── Erreurs ──────────────────────────────────────────
  BOUNCED:      { bg:"#fee2e2", color:"#991b1b", dot:"#ef4444", label:"Rebond" },        // rouge vif
  FAILED:       { bg:"#fff1f2", color:"#9f1239", dot:"#fb7185", label:"Échoué" },        // rouge rosé
  COMPLAINED:   { bg:"#fef2f2", color:"#b91c1c", dot:"#f87171", label:"Plainte" },       // rouge doux

  // ── Personnalisés ────────────────────────────────────
  CUSTOM:       { bg:"#ede9fe", color:"#5b21b6", dot:"#8b5cf6", label:"Personnalisé" },  // violet
  PERSONAL:     { bg:"#fdf4ff", color:"#86198f", dot:"#d946ef", label:"Personnalisé" },     // fuchsia
};

export default function CustomBadge({ status }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.BLOCKED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      borderRadius: 99, fontSize: 11, fontWeight: 600,
      padding: "3px 10px 3px 7px",
      border: `1px solid ${s.color}25`,
      whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: s.dot, flexShrink: 0,
      }}/>
      {s.label}
    </span>
  );
}

export { STATUS_CONFIG };