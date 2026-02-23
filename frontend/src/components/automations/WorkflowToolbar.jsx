// src/components/automations/WorkflowToolbar.jsx
import { Save, Play, Pause, Trash2, RotateCcw, X, Loader } from "lucide-react";
import { T } from "../../theme";

export default function WorkflowToolbar({ workflow, saving, onSave, onToggle, onDelete, onClose, onReset, onRun, running, execBadge }) {
  const isActive = workflow?.status === "active";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "15px 16px",
      background: "#fff", borderBottom: "1px solid #e2e8f0",
      flexShrink: 0, zIndex: 10,
      boxShadow :"rgba(0, 0, 0, 0.08) 0px 1px 3px",
    }}>
      {/* Fermer */}
      <button onClick={onClose} style={{ ...toolBtn, color: "#64748b" }} title="Fermer">
        <X size={16}/>
      </button>

      <div style={{ width: 1, height: 24, background: "#e2e8f0" }}/>

      {/* Nom + statut */}
      <div style={{ flex: 1 }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
          {workflow?.name || "Nouveau workflow"}
        </span>
        <span style={{
          marginLeft: 10, padding: "2px 9px", borderRadius: 99,
          fontSize: 11, fontWeight: 700,
          background: isActive ? "#d1fae5" : "#f1f5f9",
          color:      isActive ? "#065f46" : "#64748b",
        }}>
          {isActive ? "● Actif" : "○ Inactif"}
        </span>
      </div>

      {/* Actions */}
      {/* <button onClick={onReset}   style={{ ...toolBtn, color: "#64748b" }}  title="Réinitialiser"><RotateCcw size={15}/></button> */}
      <button onClick={onDelete}  style={{ ...toolBtn, color: "#ef4444" }}  title="Supprimer"><Trash2 size={15}/></button>
      <button onClick={onToggle}  style={{ ...toolBtnFill, background: isActive ? "#fef3c7" : "#d1fae5",  boxShadow :"rgba(99, 102, 241, 0.3) 0px 2px 6px", color: isActive ? "#92400e" : "#065f46", border : isActive ? "1px solid #eed2c1" : "1px solid #9af2d9"}}>
        {isActive ? <><Pause size={14}/> Désactiver</> : <><Play size={14}/> Activer</>}
      </button>
      <button onClick={onSave} disabled={saving} style={{ ...toolBtnFill, background: "rgb(238, 240, 255)", color: "#6366f1", border :"1px solid rgb(181, 182, 249)", boxShadow :"rgba(99, 102, 241, 0.3) 0px 2px 6px" }}>
        <Save size={14}/> {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>

      {/* Badge statut exécution */}
      {execBadge && (
        <span style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 99,
          background: execBadge.bg, color: execBadge.color,
          fontSize: 12, fontWeight: 700,
        }}>
          {running && <Loader size={11} style={{ animation: "spin 1s linear infinite" }}/>}
          {execBadge.label}
        </span>
      )}

      {/* Bouton Run */}
      <button
        onClick={onRun} disabled={running}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "7px 16px", borderRadius: 8,
          background: running ? "#f1f5f9" : " #d6f3ea",
          color: running ? "#94a3b8" : "#10b981",
          cursor: running ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 700, transition: "all .15s",
          boxShadow :"rgba(99, 102, 241, 0.3) 0px 2px 6px",
          border : running ? "1px solid #94a3b8" : "1px solid #81e1c1",
        }}>
        {running
          ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }}/> En cours...</>
          : <><Play  size={14}/> Exécuter</>
        }
      </button>

      <button onClick={onClose}   style={{ ...toolBtn, color: "#fa4144" }}  title="Fermer"><X size={15}/></button>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    
    </div>
  );
}

const toolBtn = {
  width: 34, height: 34, borderRadius: 8,
  background: "#f8fafc", border: "1px solid #e2e8f0",
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
  transition: "all .15s",
};
const toolBtnFill = {
  display: "flex", alignItems: "center", gap: 6,
  padding: "7px 14px", borderRadius: 8,
  // border: "none", 
  cursor: "pointer",
  fontSize: 13, fontWeight: 700, transition: "all .15s",
};