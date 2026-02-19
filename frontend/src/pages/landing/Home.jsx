// =====================================================
// src/pages/landing/Home.jsx
// =====================================================
import { T, styles } from "../../theme";
import {
  FiZap, FiLock, FiBarChart2, FiFileText,
  FiMail, FiBell, FiUsers, FiUpload, FiCode, FiClock
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const CODE = `const res = await fetch("https://api.mailflow.dev/api/v1/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "mfk_live_votre_cle"
  },
  body: JSON.stringify({
    to: ["client@email.com"],
    subject: "Bienvenue {{name}} !",
    templateId: "tmpl_abc123",
    variables: { name: "Jean" }
  })
});
// → { success: true, sent: 1 }`;

const USE_CASES = [
  {
    icon: FiCode,
    badge: "API",
    badgeColor: "#6366f1",
    badgeBg: "#ede9fe",
    title: "Envoi via API",
    desc: "Intégrez l'envoi d'emails directement dans votre application en quelques lignes. Supporte les templates et les variables dynamiques.",
    points: ["Clé API sécurisée", "Variables {{dynamiques}}", "Réponse < 200ms"],
  },
  {
    icon: FiUsers,
    badge: "Manuel",
    badgeColor: "#0891b2",
    badgeBg: "#e0f2fe",
    title: "Envoi manuel",
    desc: "Rédigez et envoyez des emails directement depuis le dashboard, sans une seule ligne de code.",
    points: ["Éditeur HTML intégré", "Templates réutilisables", "Aperçu en temps réel"],
  },
  {
    icon: FiUpload,
    badge: "Bulk",
    badgeColor: "#059669",
    badgeBg: "#d1fae5",
    title: "Envoi en masse",
    desc: "Importez un fichier CSV ou collez une liste d'emails pour envoyer à des milliers de destinataires en un clic.",
    points: ["Import CSV / Excel", "Personnalisation par ligne", "Suivi des envois"],
  },
  {
    icon: FiClock,
    badge: "Automation",
    badgeColor: "#d97706",
    badgeBg: "#fef3c7",
    title: "Automatisation",
    desc: "Créez des séquences d'emails automatiques déclenchées par des événements ou des planifications.",
    points: ["Scénarios déclencheurs", "Délais personnalisés", "Emails de bienvenue"],
  },
];

const FEATURES = [
  { icon: FiFileText,  title: "Templates",   desc: "Créez des templates réutilisables avec variables {{dynamiques}} pour personnaliser chaque email." },
  { icon: FiBarChart2, title: "Analytics",   desc: "Suivez les taux d'ouverture, de clics et les bounces en temps réel depuis le dashboard." },
  { icon: FiLock,      title: "Sécurité",    desc: "API keys hashées SHA-256, rate limiting automatique et HTTPS sur toutes les requêtes." },
  { icon: FiBell,      title: "Webhooks",    desc: "Recevez des notifications en temps réel pour chaque événement (ouverture, clic, bounce)." },
  { icon: FiUsers,     title: "Contacts",    desc: "Gérez vos listes de contacts, segmentez par tags et personnalisez avec des champs custom." },
  { icon: FiZap,       title: "Fiabilité",   desc: "Infrastucture redondante avec 99.9% d'uptime et retry automatique en cas d'échec." },
];

const STATS = [
  ["2.4M+", "Emails envoyés"],
  ["12K+",  "Utilisateurs"],
  ["99.9%", "Uptime"],
  ["<200ms","Latence moy."],
];

const STEPS = [
  { n: "1", title: "Créez un compte", desc: "Inscription gratuite, sans carte bancaire." },
  { n: "2", title: "Obtenez votre clé API", desc: "Générez une clé depuis le dashboard en 1 clic." },
  { n: "3", title: "Envoyez", desc: "Via API, dashboard ou import CSV — à vous de choisir." },
];

export default function Home() {
  const navigate = useNavigate();
  return (
    <div style={{ paddingTop: 64 }}>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 860, margin: "0 auto", textAlign: "center", padding: "100px 24px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.primaryLight, border: `1px solid ${T.border}`, borderRadius: 30, padding: "5px 16px", marginBottom: 28 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }}/>
          <span style={{ color: T.primary, fontSize: 13, fontWeight: 600 }}>v1.0 — Disponible maintenant</span>
        </div>

        <h1 style={{ fontSize: 52, fontWeight: 800, color: T.text, lineHeight: 1.15, margin: "0 0 20px" }}>
          Envoyez des emails<br/>
          <span style={{ color: T.primary }}>comme vous le souhaitez</span>
        </h1>

        <p style={{ color: T.textSub, fontSize: 17, maxWidth: 580, margin: "0 auto 16px", lineHeight: 1.7 }}>
          MailFlow regroupe tout ce dont vous avez besoin : envoi via <strong>API</strong>, interface <strong>manuelle</strong>, campagnes <strong>en masse</strong> et <strong>automatisation</strong> — dans un seul outil.
        </p>

        {/* Badges modes */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 36 }}>
          {[
            { label: "API", color: "#6366f1", bg: "#ede9fe" },
            { label: "Manuel", color: "#0891b2", bg: "#e0f2fe" },
            { label: "Bulk / CSV", color: "#059669", bg: "#d1fae5" },
            { label: "Automation", color: "#d97706", bg: "#fef3c7" },
          ].map(b => (
            <span key={b.label} style={{ background: b.bg, color: b.color, border: `1px solid ${b.color}30`, borderRadius: 99, fontSize: 12, fontWeight: 700, padding: "4px 12px" }}>
              {b.label}
            </span>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => navigate("/dashboard")} style={styles.btn}>Démarrer gratuitement →</button>
          <button style={styles.btnOutline} onClick={() => document.getElementById("use-cases")?.scrollIntoView({ behavior: "smooth" })}>
            Voir comment ça marche
          </button>
        </div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ color: T.text, fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 10px" }}>4 façons d'envoyer vos emails</h2>
        <p style={{ color: T.textSub, textAlign: "center", fontSize: 14, margin: "0 0 40px" }}>Choisissez le mode adapté à votre usage — ou combinez-les.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {USE_CASES.map(uc => (
            <div key={uc.title} style={{ ...styles.card, padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: uc.badgeBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <uc.icon size={20} color={uc.badgeColor}/>
                </div>
                <span style={{ background: uc.badgeBg, color: uc.badgeColor, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 99 }}>
                  {uc.badge}
                </span>
              </div>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>{uc.title}</h3>
              <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{uc.desc}</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                {uc.points.map(p => (
                  <li key={p} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: T.textSub }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: uc.badgeColor, flexShrink: 0 }}/>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Code Demo ── */}
      <section id="code-section" style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ color: T.text, fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 10px" }}>Intégration API en 5 minutes</h2>
        <p style={{ color: T.textSub, textAlign: "center", fontSize: 14, margin: "0 0 28px" }}>Pas de SDK, pas de configuration complexe. Une clé API et voilà.</p>

        <div style={{ ...styles.card, overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 8, padding: "12px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center", background: T.bg }}>
            {["#f87171","#fbbf24","#34d399"].map(c => (
              <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }}/>
            ))}
            <span style={{ color: T.textSub, fontSize: 12, marginLeft: 10 }}>api-example.js</span>
          </div>
          <pre style={{ padding: "22px 24px", margin: 0, color: "#334155", fontSize: 13, lineHeight: 1.9, background: "#fafbfc", overflowX: "auto" }}>
            {CODE}
          </pre>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ color: T.text, fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 40px" }}>Tout ce dont vous avez besoin</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ ...styles.card, padding: 24 }}>
              <div style={{ marginBottom: 10 }}><f.icon size={26} color="#6366f1"/></div>
              <h3 style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{f.title}</h3>
              <p style={{ color: T.textSub, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 90px" }}>
        <h2 style={{ color: T.text, fontSize: 28, fontWeight: 700, textAlign: "center", margin: "0 0 40px" }}>Démarrez en 3 étapes</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ ...styles.card, padding: "18px 24px", display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: T.primaryLight, color: T.primary, fontWeight: 800, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {s.n}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>{s.title}</div>
                <div style={{ fontSize: 13, color: T.textSub, marginTop: 2 }}>{s.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ marginLeft: "auto", color: T.textSub, fontSize: 20 }}>→</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 90px" }}>
        <div style={{ ...styles.card, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, padding: "44px 32px", background: T.primaryLight }}>
          {STATS.map(([v, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ color: T.primary, fontSize: 30, fontWeight: 800 }}>{v}</div>
              <div style={{ color: T.textSub, fontSize: 12, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 100px", textAlign: "center" }}>
        <h2 style={{ color: T.text, fontSize: 30, fontWeight: 800, margin: "0 0 14px" }}>Prêt à envoyer votre premier email ?</h2>
        <p style={{ color: T.textSub, fontSize: 15, margin: "0 0 30px" }}>Gratuit pour démarrer. Aucune carte bancaire requise.</p>
        <button onClick={() => navigate("/login")} style={{ ...styles.btn, padding: "14px 36px", fontSize: 16 }}>
          Créer mon compte gratuitement →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ textAlign: "center", padding: "32px 24px", borderTop: `1px solid ${T.border}` }}>
        <p style={{ color: T.textSub, fontSize: 13, margin: 0 }}>© {new Date().getFullYear()} MailFlow. Tous droits réservés.</p>
      </footer>
    </div>
  );
}