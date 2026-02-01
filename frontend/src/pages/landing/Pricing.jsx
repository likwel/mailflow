// =====================================================
// src/pages/landing/Pricing.jsx
// =====================================================
import { T, styles } from "../../theme";

const PLANS = [
  { name: "Free",     price: "0",  emails: "100",    keys: "2",  templates: "5",   features: ["API publique incluse", "Logs 7 derniers jours", "Support communautaire"],                                          highlight: false, cta: "Commencer gratuitement" },
  { name: "Pro",      price: "19", emails: "5 000",  keys: "10", templates: "50",  features: ["Tout ce qui est dans Free", "Envoi en lots illimité", "Logs sur 30 jours", "Support par email"],                   highlight: true,  cta: "Choisir Pro" },
  { name: "Business", price: "79", emails: "50 000", keys: "50", templates: "500", features: ["Tout ce qui est dans Pro", "Webhooks", "SLA garanti 99.9%", "Support prioritaire 24/7"],                            highlight: false, cta: "Contacter les ventes" },
];

const FAQ = [
  ["Puis-je changer de plan à tout moment ?",  "Oui, upgrade ou downgrade en temps réel depuis votre dashboard."],
  ["Qu'arrive-t-il si je dépasse mon quota ?", "Les envois sont bloqués jusqu'au renouvellement mensuel ou un upgrade."],
  ["Y a-t-il une période d'engagement ?",      "Non, tous les plans sont sur facturation mensuelle sans engagement."],
];

export default function Pricing() {
  return (
    <div style={{ paddingTop: 64, minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "72px 24px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h1 style={{ color: T.text, fontSize: 38, fontWeight: 700, margin: "0 0 10px" }}>Pricing simple & transparent</h1>
          <p style={{ color: T.textSub, fontSize: 15, margin: 0 }}>Commencez gratuitement, passez à un niveau supérieur quand vous êtes prêt.</p>
        </div>

        {/* Plans Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
          {PLANS.map((p) => (
            <div key={p.name} style={{
              ...styles.card,
              padding: "32px 26px",
              position: "relative",
              border: p.highlight ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
              transform: p.highlight ? "scale(1.03)" : "none",
              boxShadow: p.highlight ? "0 8px 24px rgba(99,102,241,0.15)" : styles.card.boxShadow,
            }}>
              {/* Badge Popular */}
              {p.highlight && (
                <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: T.primary, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 16px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
                  Most Popular
                </div>
              )}

              <h3 style={{ color: T.text, fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>{p.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
                <span style={{ color: T.text, fontSize: 42, fontWeight: 700 }}>${p.price}</span>
                <span style={{ color: T.textMuted, fontSize: 14 }}>/mois</span>
              </div>

              {/* Détails */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
                {[["Emails/mois", p.emails], ["API Keys", p.keys], ["Templates", p.templates]].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: T.textSub, fontSize: 13 }}>{label}</span>
                    <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {p.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: T.success, fontSize: 13, marginTop: 1 }}>✓</span>
                    <span style={{ color: T.text, fontSize: 13 }}>{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button style={{ ...(p.highlight ? styles.btn : styles.btnOutline), width: "100%", padding: "11px 0", boxShadow: p.highlight ? styles.btn.boxShadow : "none" }}>
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: "72px auto 0" }}>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 600, textAlign: "center", margin: "0 0 28px" }}>Questions fréquentes</h2>
          {FAQ.map(([q, a]) => (
            <div key={q} style={{ borderBottom: `1px solid ${T.border}`, padding: "18px 0" }}>
              <p style={{ color: T.text, fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>{q}</p>
              <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}