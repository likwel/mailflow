// src/pages/dashboard/Automations.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
    Workflow, Mail, BarChart3, Plus, Search, Play, Pause,
    Copy, Trash2, Settings, Edit, RefreshCw, Pencil
} from "lucide-react";

import CreateWorkflowModal from "../../components/automations/CreateWorkflowModal";
import WorkflowEditor from "../../components/automations/WorkflowEditor";
import WorkflowCard from "../../components/automations/WorkflowCard";

export default function Automations() {
    const [activeTab, setActiveTab] = useState("workflows");
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);
    const [openEditor, setOpenEditor] = useState(null); // workflow ouvert dans l'éditeur

    const tabs = [
        {
            id: "workflows",
            label: "Workflows",
            icon: Workflow,
            count: workflows.length
        },
        {
            id: "templates",
            label: "Templates",
            icon: Mail
        },
        {
            id: "stats",
            label: "Statistiques",
            icon: BarChart3
        }
    ];

    useEffect(() => {
        fetchWorkflows();
    }, []);

    async function fetchWorkflows() {
        setLoading(true);
        try {
            const res = await client.get("/automations/workflows");
            setWorkflows(res.data || []);
        } catch (err) {
            console.error("Error fetching workflows:", err);
            setWorkflows([]);
        } finally {
            setLoading(false);
        }
    }

    async function toggleWorkflowStatus(id, currentStatus) {
        try {
            const newStatus = currentStatus === "active" ? "inactive" : "active";
            await client.patch(`/automations/workflows/${id}/status`, { status: newStatus });
            fetchWorkflows();
        } catch (err) {
            console.error("Error toggling workflow:", err);
            alert("Erreur lors de la modification du statut");
        }
    }

    async function duplicateWorkflow(workflow) {
        try {
            await client.post("/automations/workflows", {
                ...workflow,
                name: `${workflow.name} (copie)`,
                status: "draft"
            });
            fetchWorkflows();
        } catch (err) {
            console.error("Error duplicating workflow:", err);
            alert("Erreur lors de la duplication");
        }
    }

    async function deleteWorkflow(id) {
        if (!confirm("Supprimer ce workflow ?")) return;

        try {
            await client.delete(`/automations/workflows/${id}`);
            fetchWorkflows();
        } catch (err) {
            console.error("Error deleting workflow:", err);
            alert("Erreur lors de la suppression");
        }
    }

    const filteredWorkflows = workflows.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase())
    );

    // ── Si un workflow est ouvert → plein écran ──────────
    if (openEditor !== null) {
        return (
        <WorkflowEditor
            workflow={openEditor}
            onClose={() => setOpenEditor(null)}
            onSave={(updated) => {
            fetchWorkflows();
            setOpenEditor(null);
            }}
        />
        );
    }

    return (
        <>
        <div style={{ display: "flex", flexDirection: "column", gap: 20}}>

            {/* ========== HEADER ========== */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 16
            }}>
                <div>
                    <h1 style={{
                        color: T.text,
                        fontSize: 28,
                        fontWeight: 700,
                        margin: 0,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12
                    }}>
                        Automatisations
                    </h1>
                    <p style={{
                        color: T.textSub,
                        fontSize: 14,
                        margin: 0
                    }}>
                        Automatisez vos campagnes emails
                    </p>
                </div>

                <button
                    onClick={() => {
                        // setEditingWorkflow(null);
                        setShowCreateModal(true);
                    }}
                    style={{
                        padding: "10px 22px",
                        background: T.primaryLight,
                        color: T.primary,
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        transition: "all 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
                    onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
                >
                    <Plus size={17} />
                    Nouveau workflow
                </button>
            </div>

            {/* ========== TABS ========== */}
            <div style={{ display:"flex", background:"#fff" , padding:5, border:'1px solid rgb(226, 230, 235)', borderRadius : 6 }}>
                    <div style={{ display:"flex", background:"#f1f5f9", padding :3 , borderRadius : 6}}>
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            display:"flex", alignItems:"center", justifyContent:"center", gap:6,
                            padding:"10px 14px", borderRadius:6, border:"none", cursor:"pointer",
                            fontSize:".9rem", fontWeight:700,
                            background: isActive ? "#fff" : "transparent",
                            color: isActive ? T.primary : T.textSub,
                            boxShadow: isActive ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                            transition:"all .15s",
                            borderBottom : 'none'
                          }}>
                          <Icon size={15}/>
                          {tab.label}
                        </button>
                      );
                    })}
                    </div>
                  </div>

            {/* ========== SEARCH (workflows tab only) ========== */}
            {activeTab === "workflows" && (
                <div style={{ ...styles.card, padding: 10 }}>
                    <div style={{ position: "relative" }}>
                        <Search
                            size={18}
                            color={T.textSub}
                            style={{
                                position: "absolute",
                                left: 14,
                                top: "50%",
                                transform: "translateY(-50%)"
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Rechercher un workflow..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "93%",
                                padding: "12px 16px 12px 44px",
                                border: `1px solid ${T.border}`,
                                borderRadius: 10,
                                fontSize: 14,
                                outline: "none",
                                transition: "all 0.2s"
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = T.primary;
                                e.target.style.boxShadow = `0 0 0 3px ${T.primaryLight}`;
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = T.border;
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ========== CONTENT ========== */}
            <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
                {activeTab === "workflows" && (
                    <WorkflowsTab
                        workflows={filteredWorkflows}
                        loading={loading}
                        onToggleStatus={toggleWorkflowStatus}
                        onDuplicate={duplicateWorkflow}
                        onDelete={deleteWorkflow}
                        onEdit={workflow => setOpenEditor(workflow)}
                    />
                )}
                {activeTab === "templates" && <TemplatesTab />}
                {activeTab === "stats" && <StatsTab workflows={workflows} />}
            </div>
        </div>

        {showCreateModal && (
            <CreateWorkflowModal
                onClose={() => setShowCreateModal(false)}
                onCreate={(data) => {
                setShowCreateModal(false);
                setOpenEditor(data); // ouvre directement l'éditeur
                }}
            />
            )}

        </>
    );
}

// ─── ActionBtn réutilisable ───────────────────────────
function ActionBtn({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        width: 34, height: 34,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "transparent", border: `1px solid ${T.border}`,
        borderRadius: 8, cursor: "pointer", color: T.textSub,
        transition: "all .15s", flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = danger ? "#fff1f2" : T.primaryLight;
        e.currentTarget.style.borderColor = danger ? T.danger  : T.primary;
        e.currentTarget.style.color       = danger ? T.danger  : T.primary;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = "transparent";
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.color       = T.textSub;
      }}>
      {children}
    </button>
  );
}

// ─── Status badge ─────────────────────────────────────
const WF_STATUS = {
  active:   { bg: "#d1fae5", color: "#065f46", dot: "#10b981", label: "Actif"     },
  draft:    { bg: "#fef9c3", color: "#854d0e", dot: "#eab308", label: "Brouillon" },
  inactive: { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8", label: "Inactif"   },
};

function WFStatusBadge({ status }) {
  const s = WF_STATUS[status] || WF_STATUS.inactive;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}25`,
      borderRadius: 99, fontSize: 11, fontWeight: 700,
      padding: "3px 10px 3px 7px", whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0 }}/>
      {s.label}
    </span>
  );
}

// ─── WorkflowsTab ────────────────────────────────────
function WorkflowsTab({ workflows, loading, onToggleStatus, onDuplicate, onDelete, onEdit }) {

  if (loading) return (
    <div style={{ padding: 80, textAlign: "center" }}>
      <RefreshCw size={40} color={T.textSub} style={{ animation: "spin 1s linear infinite", marginBottom: 14 }}/>
      <p style={{ color: T.textSub, fontSize: 15 }}>Chargement des workflows...</p>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (workflows.length === 0) return (
    <div style={{ padding: 80, textAlign: "center" }}>
      <Workflow size={52} color={T.border} style={{ marginBottom: 16, opacity: .4 }}/>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>Aucun workflow</h3>
      <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>Créez votre premier workflow pour automatiser vos emails</p>
    </div>
  );

  return (
    <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
    {workflows.map(workflow => (
        <WorkflowCard
        key={workflow.id}
        workflow={workflow}
        T={T}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        onDuplicate={onDuplicate}
        onRename={async (id, { name, description }) => {
            await client.put(`/automations/workflows/${id}`, { name, description });
            // rafraîchir la liste
        }}
        />
    ))}
    </div>
  );
}


// ========== TEMPLATES TAB ==========
function TemplatesTab() {
    const templates = [
        {
            id: 1,
            name: "🎉 Bienvenue",
            description: "Séquence de 3 emails sur 7 jours",
            emails: 3,
            color: T.primary
        },
        {
            id: 2,
            name: "🔥 Réengagement",
            description: "Réactiver les contacts inactifs",
            emails: 5,
            color: T.warning
        },
        {
            id: 3,
            name: "🛒 Panier abandonné",
            description: "Rappel après 1h, 24h et 3 jours",
            emails: 3,
            color: T.danger
        },
        {
            id: 4,
            name: "💎 Nurturing",
            description: "Éduquer vos prospects",
            emails: 10,
            color: T.success
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                    Modèles prêts à l'emploi
                </h3>
                <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
                    Commencez rapidement avec nos templates
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {templates.map(template => (
                    <div
                        key={template.id}
                        style={{
                            padding: 24,
                            background: "#fff",
                            border: `1px solid ${T.border}`,
                            borderRadius: 12,
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = template.color;
                            e.currentTarget.style.boxShadow = `0 4px 12px ${template.color}30`;
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        <h4 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                            {template.name}
                        </h4>
                        <p style={{ fontSize: 14, color: T.textSub, margin: "0 0 16px" }}>
                            {template.description}
                        </p>
                        <div style={{
                            padding: "8px 12px",
                            background: T.bg,
                            borderRadius: 8,
                            fontSize: 13,
                            color: T.text,
                            marginBottom: 16
                        }}>
                            📧 {template.emails} emails inclus
                        </div>
                        <button
                            style={{
                                width: "100%",
                                padding: "10px",
                                background: T.primaryLight,
                                color: T.primary,
                                border: `1px solid ${T.primaryGray}`,
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = T.primaryLight;
                                e.target.style.color = T.primaryDark;
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = T.primaryLight;
                                e.target.style.color = T.primary;
                            }}
                        >
                            Utiliser ce modèle
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ========== STATS TAB ==========
function StatsTab({ workflows }) {
    const totalSent = workflows.reduce((sum, w) => sum + (w.stats?.sent || 0), 0);
    const avgOpenRate = workflows.length > 0
        ? (workflows.reduce((sum, w) => sum + (w.stats?.openRate || 0), 0) / workflows.length).toFixed(1)
        : 0;
    const totalConversions = workflows.reduce((sum, w) => sum + (w.stats?.conversions || 0), 0);

    const stats = [
        { label: "Workflows actifs", value: workflows.filter(w => w.status === "active").length, color: T.primary },
        { label: "Emails envoyés", value: totalSent.toLocaleString(), color: T.success },
        { label: "Taux d'ouverture moyen", value: `${avgOpenRate}%`, color: T.info },
        { label: "Conversions totales", value: totalConversions, color: "#10b981" }
    ];

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
                    Vue d'ensemble
                </h3>
                <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
                    Performance globale de vos automatisations
                </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: 24,
                            background: "#fff",
                            border: `1px solid ${T.border}`,
                            borderRadius: 12,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = stat.color;
                            e.currentTarget.style.boxShadow = `0 4px 12px ${stat.color}30`;
                            e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                    >
                        <p style={{ fontSize: 13, color: T.textSub, margin: "0 0 8px", fontWeight: 600 }}>
                            {stat.label}
                        </p>
                        <p style={{ fontSize: 32, fontWeight: 700, color: T.text, margin: 0 }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>

    );

}