// =====================================================
// src/pages/dashboard/Settings.jsx
// =====================================================
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { User, Mail, Bell, AlertTriangle, Save } from "lucide-react";

export default function Settings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [plan, setPlan] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [smtp, setSmtp] = useState({
    host: "",
    port: "",
    user: "",
    pass: "",
  });

  const [notifs, setNotifs] = useState({
    failed: true,
    bounced: true,
    weekly: false,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
      });
    }
    fetchSettings();
    getMyPlan();
  }, [user]);

  async function fetchSettings() {
    try {
      const res = await client.get("/dashboard/settings");
      if (res.data.smtp) setSmtp(res.data.smtp);
      if (res.data.notifications) setNotifs(res.data.notifications);
    } catch (err) {
      console.error("Erreur chargement settings:", err);
    }
  }

  async function getMyPlan() {
    try {
      const res = await client.get("/plans/me");
      setPlan(res.data);
    } catch (err) {
      // setError(err.response?.data?.error || "Erreur lors du chargement des logs");
    } finally {
      // setLoading(false);
    }
  }


  async function saveProfile() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await client.put("/dashboard/profile", profile);
      setSuccess("Profil mis à jour avec succès");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  async function saveSmtp() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await client.put("/dashboard/smtp", smtp);
      setSuccess("Configuration SMTP sauvegardée");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  async function saveNotifications() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await client.put("/dashboard/notifications", notifs);
      setSuccess("Préférences de notifications sauvegardées");
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la sauvegarde");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    const confirm1 = prompt('Tapez "SUPPRIMER" pour confirmer la suppression de votre compte');
    if (confirm1 !== "SUPPRIMER") return;

    try {
      await client.delete("/dashboard/account");
      alert("Votre compte a été supprimé");
      logout();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ color: T.text, fontSize: 28, fontWeight: 700, margin: 0 }}>Parmètres</h1>
        <p style={{ color: T.textSub, fontSize: 14, margin: "4px 0 0" }}>
          Gérez et configurer votre compte
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.danger, fontSize: 13, fontWeight: 600, margin: 0 }}>{error}</p>
        </div>
      )}
      {success && (
        <div style={{ background: T.successLight, border: `1px solid ${T.success}`, borderRadius: T.radius, padding: "12px 16px" }}>
          <p style={{ color: T.success, fontSize: 13, fontWeight: 600, margin: 0 }}>✓ {success}</p>
        </div>
      )}

      {/* Profil */}
      <div style={{ ...styles.card, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <User size={18} color={T.primary} />
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Profil</p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{ width: 50, height: 50, borderRadius: "50%", border: `2px solid ${T.border}` }} />
          ) : (
            <div style={{ 
              width: 50, 
              height: 50, 
              borderRadius: "50%", 
              background: T.primaryLight, 
              border: `2px solid ${T.primary}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.primary,
              fontWeight: 700,
              fontSize: 18,
            }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div>
            <p style={{ color: T.text, fontSize: 15, fontWeight: 600, margin: 0 }}>{user?.name}</p>
            <p style={{ color: T.textSub, fontSize: 12, margin: "2px 0 0" }}>{user?.email}</p>
            <span style={{ 
              display: "inline-block", 
              marginTop: 4, 
              background: T.primaryLight, 
              color: T.primary, 
              fontSize: 11, 
              fontWeight: 600, 
              padding: "2px 10px", 
              borderRadius: 12 
            }}>
              Plan {plan?.name || "FREE"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
              Nom complet
            </label>
            <input 
              value={profile.name} 
              onChange={(e) => setProfile({ ...profile, name: e.target.value })} 
              placeholder="Jean Dupont"
              style={styles.input} 
            />
          </div>
          
          <div>
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
              Email (lecture seule)
            </label>
            <input 
              value={profile.email} 
              disabled
              style={{ ...styles.input, opacity: 0.6, cursor: "not-allowed" }} 
            />
          </div>

          <button 
            onClick={saveProfile}
            disabled={loading}
            style={{ 
              ...styles.btn, 
              alignSelf: "flex-start",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            {loading ? "Sauvegarde..." : "Sauvegarder le profil"}
          </button>
        </div>
      </div>

      {/* SMTP */}
      <div style={{ ...styles.card, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Mail size={18} color={T.primary} />
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Configuration SMTP</p>
        </div>
        <p style={{ color: T.textMuted, fontSize: 12, margin: "0 0 16px" }}>
          Ces paramètres sont utilisés pour l'envoi des emails (optionnel si vous utilisez les fournisseurs gratuits)
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
              Host SMTP
            </label>
            <input 
              value={smtp.host} 
              onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} 
              placeholder="smtp.gmail.com"
              style={styles.input} 
            />
          </div>
          
          <div>
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
              Port
            </label>
            <input 
              value={smtp.port} 
              onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} 
              placeholder="587"
              style={styles.input} 
            />
          </div>
          
          <div>
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
              Utilisateur
            </label>
            <input 
              value={smtp.user} 
              onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} 
              placeholder="votre@email.com"
              style={styles.input} 
            />
          </div>
          
          <div>
            <label style={{ color: T.textSub, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>
              Mot de passe
            </label>
            <input 
              type="password"
              value={smtp.pass} 
              onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} 
              placeholder="••••••••"
              style={styles.input} 
            />
          </div>
        </div>
        
        <button 
          onClick={saveSmtp}
          disabled={loading}
          style={{ 
            ...styles.btn, 
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Save size={16} />
          {loading ? "Sauvegarde..." : "Sauvegarder SMTP"}
        </button>
      </div>

      {/* Notifications */}
      <div style={{ ...styles.card, padding: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Bell size={18} color={T.primary} />
          <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Notifications</p>
        </div>
        
        {[
          ["failed", "Alertes sur échecs d'envoi"],
          ["bounced", "Alertes sur bounces"],
          ["weekly", "Rapport hebdomadaire"]
        ].map(([key, label]) => (
          <div 
            key={key} 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "12px 0", 
              borderBottom: `1px solid ${T.border}` 
            }}
          >
            <span style={{ color: T.text, fontSize: 13 }}>{label}</span>
            <div
              onClick={() => {
                setNotifs({ ...notifs, [key]: !notifs[key] });
                saveNotifications();
              }}
              style={{ 
                width: 44, 
                height: 24, 
                borderRadius: 12, 
                background: notifs[key] ? T.primary : T.border, 
                cursor: "pointer", 
                position: "relative", 
                transition: "background 0.2s" 
              }}
            >
              <div style={{ 
                width: 20, 
                height: 20, 
                borderRadius: "50%", 
                background: "#fff", 
                position: "absolute", 
                top: 2, 
                left: notifs[key] ? 22 : 2, 
                transition: "left 0.2s", 
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)" 
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div style={{ ...styles.card, padding: 20, border: `1px solid ${T.danger}`, background: T.dangerLight }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <AlertTriangle size={18} color={T.danger} />
          <p style={{ color: T.danger, fontSize: 15, fontWeight: 700, margin: 0 }}>Zone dangereuse</p>
        </div>
        <p style={{ color: T.textSub, fontSize: 13, margin: "0 0 14px" }}>
          Cette action supprimera définitivement votre compte et toutes vos données (emails, templates, API keys). Cette action est irréversible.
        </p>
        <button 
          onClick={deleteAccount}
          style={{ 
            ...styles.btnOutline, 
            borderColor: T.danger,
            color: T.danger,
            fontWeight: 600,
          }}
        >
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}