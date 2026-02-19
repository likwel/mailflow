// =====================================================
// src/pages/dashboard/ApiKeys.jsx
// =====================================================
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import { Plus, Copy, Check, Power, Trash2, Key, AlertCircle } from "lucide-react";

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [rawKey, setRawKey] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/dashboard/apikeys");
      setKeys(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors du chargement des clés");
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!name.trim()) {
      setError("Le nom de la clé est requis");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await client.post("/dashboard/apikeys", { name });
      setRawKey(res.data.rawKey);
      setKeys([res.data, ...keys]);
      setName("");
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  }

  async function toggleKey(id, isActive) {
    try {
      await client.patch(`/dashboard/apikeys/${id}`, { isActive: !isActive });
      setKeys(keys.map(k => k.id === id ? { ...k, isActive: !isActive } : k));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la modification");
    }
  }

  async function deleteKey(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette clé ?")) return;
    try {
      await client.delete(`/dashboard/apikeys/${id}`);
      setKeys(keys.filter(k => k.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de la suppression");
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ color: T.text, fontSize: 28, fontWeight: 700, margin: 0 }}>Clés API</h1>
          <p style={{ color: T.textSub, fontSize: 14, margin: "4px 0 0" }}>
            Gérez vos clés d'authentification API
          </p>
        </div>

        <button 
          onClick={() => setShowForm(!showForm)} 
          style={{ 
            ...styles.btn, 
            display: "flex", 
            alignItems: "center", 
            gap: 6 
          }}
        >
          <Plus size={16} />
          Nouvelle clé
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{ background: T.dangerLight, border: `1px solid ${T.danger}`, borderRadius: T.radius, padding: "14px 18px", display: "flex", alignItems: "start", gap: 10 }}>
          <AlertCircle size={18} color={T.danger} style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ color: T.danger, fontSize: 13, fontWeight: 600, margin: 0, flex: 1 }}>{error}</p>
        </div>
      )}

      {/* Alerte: clé générée */}
      {rawKey && (
        <div style={{ background: T.successLight, border: `1px solid ${T.success}`, borderRadius: T.radius, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "start", gap: 10, marginBottom: 12 }}>
            <AlertCircle size={18} color={T.success} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ color: T.success, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>Clé créée avec succès</p>
              <p style={{ color: T.success, fontSize: 12, margin: 0 }}>Copiez cette clé maintenant, elle ne sera plus affichée.</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <code style={{ 
              flex: 1, 
              background: "#fff", 
              border: `1px solid ${T.border}`, 
              padding: "10px 12px", 
              borderRadius: 8, 
              color: T.text, 
              fontSize: 12, 
              fontFamily: "monospace",
              wordBreak: "break-all" 
            }}>
              {rawKey}
            </code>
            <button 
              onClick={() => copyToClipboard(rawKey)} 
              style={{ 
                ...styles.btn, 
                display: "flex", 
                alignItems: "center", 
                gap: 6,
                background: copied ? T.success : T.primary,
                whiteSpace: "nowrap" 
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <button 
            onClick={() => setRawKey(null)} 
            style={{ 
              background: "none", 
              border: "none", 
              color: T.success, 
              fontSize: 12, 
              cursor: "pointer", 
              marginTop: 10, 
              padding: 0,
              fontWeight: 600,
            }}
          >
            Fermer
          </button>
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div style={{ ...styles.card, padding: 20, border: `2px solid ${T.primary}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Key size={20} color={T.primary} />
            <p style={{ color: T.text, fontSize: 15, fontWeight: 700, margin: 0 }}>Créer une nouvelle clé API</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              onKeyDown={(e) => e.key === "Enter" && createKey()} 
              placeholder="Nom de la clé (ex: Production, Staging)" 
              disabled={creating}
              style={{ ...styles.input, flex: 1, opacity: creating ? 0.5 : 1 }} 
            />
            <button 
              onClick={createKey}
              disabled={creating || !name.trim()}
              style={{ 
                ...styles.btn,
                opacity: (creating || !name.trim()) ? 0.5 : 1,
                cursor: (creating || !name.trim()) ? "not-allowed" : "pointer",
              }}
            >
              {creating ? "Création..." : "Créer"}
            </button>
            <button 
              onClick={() => { setShowForm(false); setName(""); }} 
              style={{ ...styles.btnOutline }}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ ...styles.card, padding: 40, textAlign: "center" }}>
          <p style={{ color: T.textSub, fontSize: 14 }}>Chargement des clés...</p>
        </div>
      )}

      {/* Liste des clés */}
      {!loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {keys.length === 0 ? (
            <div style={{ ...styles.card, padding: 40, textAlign: "center" }}>
              <Key size={40} color={T.textMuted} style={{ marginBottom: 12 }} />
              <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>Aucune clé API créée</p>
              <p style={{ color: T.textMuted, fontSize: 12, margin: "4px 0 0" }}>Créez votre première clé pour commencer</p>
            </div>
          ) : (
            keys.map((k) => (
              <div 
                key={k.id} 
                style={{ 
                  ...styles.card, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "16px 20px",
                  opacity: k.isActive ? 1 : 0.6,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ color: 'rgb(30, 41, 59)', fontSize: 15, fontWeight: 700 }}>{k.name}</span>
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      padding: "3px 8px", 
                      borderRadius: 12, 
                      background: k.isActive ? T.successLight : T.bg, 
                      color: k.isActive ? T.success : T.textSub 
                    }}>
                      {k.isActive ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>
                  <code style={{ 
                    color: T.textMuted, 
                    fontSize: 12, 
                    fontFamily: "monospace",
                    display: "block",
                    marginBottom: 4,
                  }}>
                    {k.keyPrefix}
                  </code>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: T.textMuted }}>
                    <span>Créée le {new Date(k.createdAt).toLocaleDateString("fr-FR")}</span>
                    {k.lastUsed && <span>• Dernière utilisation : {new Date(k.lastUsed).toLocaleDateString("fr-FR")}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={() => toggleKey(k.id, k.isActive)} 
                    style={{ 
                      ...styles.btnOutline,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      borderColor: k.isActive ? T.warning : T.success,
                      color: k.isActive ? T.warning : T.success,
                    }}
                  >
                    <Power size={14} />
                    {k.isActive ? "Désactiver" : "Activer"}
                  </button>
                  <button 
                    onClick={() => deleteKey(k.id)} 
                    style={{ 
                      ...styles.btnOutline,
                      borderColor: T.danger,
                      color: T.danger,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}