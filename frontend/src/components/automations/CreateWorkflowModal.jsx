// src/components/automations/CreateWorkflowModal.jsx
import { useState } from "react";
import { Workflow, X, ArrowRight } from "lucide-react";
import { T, styles } from "../../theme";

const TEMPLATES = [
  { id: "blank",    label: "Vide",              icon: "⚡", desc: "Partir de zéro" },
  { id: "welcome",  label: "Bienvenue",          icon: "🎉", desc: "Email de bienvenue automatique" },
  { id: "reengagement", label: "Réengagement",  icon: "🔥", desc: "Réactiver les contacts inactifs" },
  { id: "abandoned", label: "Panier abandonné", icon: "🛒", desc: "Rappel après inactivité" },
];

export default function CreateWorkflowModal({ onClose, onCreate }) {
  const [step, setStep]         = useState(1); // 1 = infos, 2 = template
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [template, setTemplate] = useState("blank");
  const [error, setError]       = useState("");

  function handleNext() {
    if (!name.trim()) { setError("Le nom est requis"); return; }
    setError("");
    setStep(2);
  }

  function handleCreate() {
    onCreate({
      name: name.trim(),
      description: description.trim(),
      status: "inactive",
      template,
      nodes: [],
      edges: [],
    });
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1100,
        background: "rgba(15,23,42,.55)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480,
          background: "#fff", borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "16px 20px", borderBottom: `1px solid ${T.border}`,
          background: "#f8fafc",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Workflow size={18} color="#6366f1"/>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>
              Nouveau workflow
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: T.textSub }}>
              Étape {step} sur 2 — {step === 1 ? "Informations" : "Choisir un modèle"}
            </p>
          </div>

          {/* Indicateur étapes */}
          <div style={{ display: "flex", gap: 5 }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: s === step ? 20 : 8, height: 8, borderRadius: 99,
                background: s <= step ? "#6366f1" : "#e2e8f0",
                transition: "all .3s",
              }}/>
            ))}
          </div>

          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#f1f5f9", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", color: T.textSub,
          }}>
            <X size={15}/>
          </button>
        </div>

        {/* ── Étape 1 : Nom + Description ── */}
        {step === 1 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                Nom du workflow <span style={{ color: T.danger }}>*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleNext()}
                placeholder="Ex : Séquence de bienvenue"
                style={{
                  ...styles.input,
                  borderColor: error ? T.danger : T.border,
                  fontSize: 14,
                }}
              />
              {error && <p style={{ margin: 0, fontSize: 12, color: T.danger }}>{error}</p>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                Description <span style={{ color: T.textSub, fontWeight: 400 }}>(optionnel)</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDesc(e.target.value)}
                placeholder="Décrivez l'objectif de ce workflow..."
                rows={3}
                style={{ ...styles.input, resize: "none", fontSize: 14 }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={onClose} style={{ ...styles.btn, background: "#fff", color: T.text, border: `1px solid ${T.border}` }}>
                Annuler
              </button>
              <button onClick={handleNext} style={{ ...styles.btn, display: "flex", alignItems: "center", gap: 6 }}>
                Suivant <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Choix template ── */}
        {step === 2 && (
          <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: T.textSub }}>
              Choisissez un point de départ pour <strong style={{ color: T.text }}>{name}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEMPLATES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "12px 16px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${template === t.id ? "#6366f1" : T.border}`,
                    background: template === t.id ? "#ede9fe" : "#fff",
                    transition: "all .15s",
                  }}>
                  <span style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: T.textSub }}>{t.desc}</div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                    border: `2px solid ${template === t.id ? "#6366f1" : "#cbd5e1"}`,
                    background: template === t.id ? "#6366f1" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {template === t.id && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }}/>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button onClick={() => setStep(1)} style={{ ...styles.btn, background: "#fff", color: T.text, border: `1px solid ${T.border}` }}>
                Retour
              </button>
              <button onClick={handleCreate} style={{ ...styles.btn, display: "flex", alignItems: "center", gap: 6 }}>
                Créer le workflow <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}