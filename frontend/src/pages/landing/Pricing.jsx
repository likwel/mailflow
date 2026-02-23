// =====================================================
// src/pages/landing/Pricing.jsx
// =====================================================
import { useState } from "react";
import { T, styles } from "../../theme";

const PLANS = [
  {
    name:        "Free",
    priceMonth:  "0",
    priceYear:   "0",
    saving:      null,
    emails:      "100",
    keys:        "1",
    templates:   "3",
    contacts:    "200",
    lists:       "2",
    workflows:   "0",
    highlight:   false,
    cta:         "Commencer gratuitement",
    features: [
      "Envoi via API",
      "Envoi manuel depuis le dashboard",
      "3 templates HTML",
      "200 contacts · 2 listes",
      "Tracking ouvertures & clics",
      "Logs 7 jours",
      "Support communautaire",
    ],
    limits: [
      "Pas de webhooks",
      "Pas d'envoi en masse",
      "Pas d'automatisation",
    ],
  },
  {
    name:        "Pro",
    priceMonth:  "35 000",
    priceYear:   "28 000",   // ~-20% → économie 84 000 Ar/an
    saving:      "84 000",
    emails:      "10 000",
    keys:        "10",
    templates:   "50",
    contacts:    "10 000",
    lists:       "Illimitées",
    workflows:   "20",
    highlight:   true,
    cta:         "Choisir Pro",
    features: [
      "Tout ce qui est dans Free",
      "Envoi en masse (CSV / Excel)",
      "10 000 contacts · listes illimitées",
      "20 workflows & automations",
      "Webhooks entrants & sortants",
      "Variables dynamiques entre nœuds",
      "Logs 30 jours",
      "Support par email",
    ],
    limits: [],
  },
  {
    name:        "Business",
    priceMonth:  "80 000",
    priceYear:   "64 000",   // ~-20% → économie 192 000 Ar/an
    saving:      "192 000",
    emails:      "100 000",
    keys:        "Illimitées",
    templates:   "Illimités",
    contacts:    "Illimités",
    lists:       "Illimitées",
    workflows:   "Illimités",
    highlight:   false,
    cta:         "Contacter les ventes",
    features: [
      "Tout ce qui est dans Pro",
      "Emails, contacts, workflows illimités",
      "Clés API illimitées",
      "Boucles & conditions avancées",
      "Pièces jointes",
      "Logs 90 jours",
      "SLA garanti 99.9%",
      "Support prioritaire 24/7",
    ],
    limits: [],
  },
];

const FAQ = [
  ["Puis-je changer de plan à tout moment ?",   "Oui, upgrade ou downgrade en temps réel depuis votre dashboard."],
  ["Qu'arrive-t-il si je dépasse mon quota ?",  "Les envois sont bloqués jusqu'au renouvellement mensuel ou un upgrade."],
  ["Y a-t-il une période d'engagement ?",       "Non, tous les plans sont sur facturation mensuelle sans engagement."],
  ["Les automations comptent-elles dans le quota ?", "Oui, chaque email envoyé via un workflow compte dans votre quota mensuel."],
  ["Puis-je importer mes contacts existants ?", "Oui, via import CSV ou Excel depuis le dashboard, disponible dès le plan Pro."],
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <div style={{ paddingTop: 64, minHeight: "100vh", background: T.bg }}>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "72px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ color: T.text, fontSize: 38, fontWeight: 700, margin: "0 0 10px" }}>
            Tarifs simples & transparents
          </h1>
          <p style={{ color: T.textSub, fontSize: 15, margin: 0 }}>
            Commencez gratuitement, passez à un niveau supérieur quand vous êtes prêt.
          </p>
        </div>

        {/* Toggle mensuel / annuel */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 48 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: annual ? T.textMuted : T.text }}>Mensuel</span>
          <div
            onClick={() => setAnnual(a => !a)}
            style={{
              width: 44, height: 24, borderRadius: 99, cursor: "pointer", position: "relative",
              background: annual ? T.primary : T.border, transition: "background .2s",
            }}
          >
            <div style={{
              position: "absolute", top: 3, left: annual ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%", background: "#fff",
              transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
            }}/>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: annual ? T.text : T.textMuted }}>
            Annuel{" "}
            <span style={{ color: T.success, fontSize: 11, fontWeight: 700 }}>−20%</span>
          </span>
        </div>

        {/* Plans Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
          {PLANS.map((p) => {
            const price = annual ? p.priceYear : p.priceMonth;
            return (
              <div key={p.name} style={{
                ...styles.card,
                padding: "32px 26px",
                position: "relative",
                border: p.highlight ? `2px solid ${T.primary}` : `1px solid ${T.border}`,
                transform: p.highlight ? "scale(1.03)" : "none",
                boxShadow: p.highlight ? "0 8px 24px rgba(99,102,241,0.15)" : styles.card.boxShadow,
              }}>
                {p.highlight && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: T.primary, color: "#fff", fontSize: 11, fontWeight: 700,
                    padding: "4px 16px", borderRadius: 20, textTransform: "uppercase",
                    letterSpacing: 0.5, whiteSpace: "nowrap",
                  }}>
                    Le plus populaire
                  </div>
                )}

                <h3 style={{ color: T.text, fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>{p.name}</h3>

                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
                  <span style={{ color: T.text, fontSize: 40, fontWeight: 700 }}>
                    {price === "0" ? "Gratuit" : `${price} Ar`}
                  </span>
                </div>
                {price !== "0" && (
                  <div style={{ color: T.textMuted, fontSize: 12, marginBottom: 20 }}>
                    / mois {annual && <span style={{ color: T.success }}>· facturé annuellement</span>}
                  </div>
                )}
                {price === "0" && <div style={{ marginBottom: 20 }}/>}

                {/* Quotas */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${T.border}` }}>
                  {[
                    ["Emails / mois",  p.emails],
                    ["Clés API",       p.keys],
                    ["Templates HTML", p.templates],
                    ["Contacts",       p.contacts],
                    ["Workflows",      p.workflows],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: T.textSub, fontSize: 13 }}>{label}</span>
                      <span style={{ color: T.text, fontSize: 13, fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Features ✓ */}
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: p.limits.length ? 12 : 28 }}>
                  {p.features.map((f) => (
                    <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ color: T.success, fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                      <span style={{ color: T.text, fontSize: 13 }}>{f}</span>
                    </div>
                  ))}
                </div>

                {/* Limits ✗ */}
                {p.limits.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 28 }}>
                    {p.limits.map((l) => (
                      <div key={l} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ color: T.textMuted, fontSize: 13, marginTop: 1, flexShrink: 0 }}>✗</span>
                        <span style={{ color: T.textMuted, fontSize: 13 }}>{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button style={{
                  ...(p.highlight ? styles.btn : styles.btnOutline),
                  width: "100%", padding: "11px 0",
                  boxShadow: p.highlight ? styles.btn.boxShadow : "none",
                }}>
                  {p.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 640, margin: "72px auto 0" }}>
          <h2 style={{ color: T.text, fontSize: 22, fontWeight: 600, textAlign: "center", margin: "0 0 28px" }}>
            Questions fréquentes
          </h2>
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