// =====================================================
// src/pages/landing/Home.jsx
// =====================================================
import { T, styles } from "../../theme";

const CODE = `const res = await fetch("https://api.mailflow.dev/api/v1/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "sk_live_votre_cle"
  },
  body: JSON.stringify({
    to: ["client@email.com"],
    subject: "Bienvenue {{name}} !",
    html: "<h1>Bonjour {{name}}</h1><p>Bienvenue !</p>",
    variables: { name: "Jean" }
  })
});
// → { success: true, sent: 1 }`;

const FEATURES = [
  { icon: "⚡", title: "API rapide",   desc: "Latence < 200ms. Envoyer depuis n'importe quel client sans backend." },
  { icon: "🔒", title: "Sécurité",     desc: "API keys hashées SHA-256, rate limiting automatique, HTTPS." },
  { icon: "📊", title: "Dashboard",    desc: "Suivez vos envois en temps réel avec des logs détaillés." },
  { icon: "📝", title: "Templates",    desc: "Créez des templates réutilisables avec des variables {{variable}}." },
  { icon: "📬", title: "Bulk Send",    desc: "Envoyer à des milliers de destinataires d'un coup." },
  { icon: "🔔", title: "Webhooks",     desc: "Recevez des notifications en temps réel (Pro)." },
];

const STATS = [
  ["2.4M+", "Emails envoyés"],
  ["12K+",  "Développeurs"],
  ["99.9%", "Uptime"],
  ["<200ms","Latence moy."],
];

export default function Home() {
  return (
    <div style={{ paddingTop: 64 }}>
      {/* ── Hero ── */}
      <section style={{ maxWidth: 820, margin: "0 auto", textAlign: "center", padding: "100px 24px 70px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 30, padding: "5px 16px", marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.success, display: "inline-block" }} />
          <span style={{ color: T.primary, fontSize: 13, fontWeight: 600 }}>v1.0 — Disponible maintenant</span>
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 700, color: T.text, lineHeight: 1.15, margin: "0 0 20px" }}>
          Envoyer des emails<br />
          <span style={{ color: T.primary }}>sans backend</span>
        </h1>

        <p style={{ color: T.textSub, fontSize: 17, maxWidth: 540, margin: "0 auto 36px", lineHeight: 1.6 }}>
          Une API simple pour envoyer des emails transactionnels, des newsletters et des envois en lot — depuis n'importe quel client.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={styles.btn}>Démarrer gratuitement →</button>
          <button style={styles.btnOutline} onClick={() => document.getElementById("code-section")?.scrollIntoView({ behavior: "smooth" })}>
            Voir l'exemple
          </button>
        </div>
      </section>

      {/* ── Code Demo ── */}
      <section id="code-section" style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 80px" }}>
        <h2 style={{ color: T.text, fontSize: 26, fontWeight: 600, textAlign: "center", margin: "0 0 10px" }}>En quelques lignes de code</h2>
        <p style={{ color: T.textSub, textAlign: "center", fontSize: 14, margin: "0 0 28px" }}>Pas de configuration complexe. Une clé API et voilà.</p>

        <div style={{ ...styles.card, overflow: "hidden" }}>
          {/* Barre titre fichier */}
          <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center", background: T.bg }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f87171" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#fbbf24" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#34d399" }} />
            <span style={{ color: T.textMuted, fontSize: 12, marginLeft: 10 }}>api-example.js</span>
          </div>
          <pre style={{ padding: "22px 24px", margin: 0, color: "#334155", fontSize: 13, lineHeight: 1.9, background: "#fafbfc", overflowX: "auto" }}>
            {CODE}
          </pre>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px 100px" }}>
        <h2 style={{ color: T.text, fontSize: 26, fontWeight: 600, textAlign: "center", margin: "0 0 40px" }}>Tout ce dont vous avez besoin</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ ...styles.card, padding: 26 }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 100px" }}>
        <div style={{ ...styles.card, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, padding: "44px 32px", background: T.primaryLight }}>
          {STATS.map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ color: T.primary, fontSize: 30, fontWeight: 700 }}>{v}</div>
              <div style={{ color: T.textSub, fontSize: 12, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "32px 24px", borderTop: `1px solid ${T.border}` }}>
        <p style={{ color: T.textMuted, fontSize: 13, margin: 0 }}>© 2025 MailFlow. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
