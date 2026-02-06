// src/pages/dashboard/Automations.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
    Workflow, Mail, BarChart3, Plus, Search, Play, Pause,
    Copy, Trash2, Settings, Edit, RefreshCw
} from "lucide-react";

import CreateWorkflowModal from "../../components/CreateWorkflowModal";

export default function Automations() {
    const [activeTab, setActiveTab] = useState("workflows");
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState(null);

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
                        {/* <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
                        }}>
                            🤖
                        </div> */}
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
                        setEditingWorkflow(null);
                        setShowCreateModal(true);
                    }}
                    style={{
                        padding: "10px 22px",
                        background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 14,
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
                    <Plus size={18} />
                    Nouveau workflow
                </button>
            </div>

            {/* ========== TABS ========== */}
            <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
                <div style={{
                    display: "flex",
                    borderBottom: `2px solid ${T.border}`
                }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    flex: 1,
                                    padding: "20px 24px",
                                    background: isActive ? T.primaryLight : "transparent",
                                    border: "none",
                                    borderBottom: `3px solid ${isActive ? T.primary : "transparent"}`,
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 8
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.background = "#f9fafb";
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <Icon
                                    size={20}
                                    color={isActive ? T.primary : T.textSub}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <span style={{
                                    fontSize: 15,
                                    fontWeight: isActive ? 700 : 600,
                                    color: isActive ? T.primary : T.text
                                }}>
                                    {tab.label}
                                </span>
                                {tab.count !== undefined && (
                                    <span style={{
                                        padding: "2px 8px",
                                        background: isActive ? T.primary : T.bg,
                                        color: isActive ? "#fff" : T.textSub,
                                        borderRadius: 12,
                                        fontSize: 12,
                                        fontWeight: 700
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ========== SEARCH (workflows tab only) ========== */}
            {activeTab === "workflows" && (
                <div style={{ ...styles.card, padding: 20 }}>
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
                                border: `2px solid ${T.border}`,
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
                    />
                )}
                {activeTab === "templates" && <TemplatesTab />}
                {activeTab === "stats" && <StatsTab workflows={workflows} />}
            </div>
        </div>

        {showCreateModal && (
        <CreateWorkflowModal
            workflow={editingWorkflow}
            onClose={() => {
            setShowCreateModal(false);
            setEditingWorkflow(null);
            }}
            onSave={() => {
            fetchWorkflows();
            setShowCreateModal(false);
            setEditingWorkflow(null);
            }}
        />
        )}
        </>
    );
}

// ========== WORKFLOWS TAB ==========
function WorkflowsTab({ workflows, loading, onToggleStatus, onDuplicate, onDelete }) {
    if (loading) {
        return (
            <div style={{ padding: 80, textAlign: "center" }}>
                <RefreshCw
                    size={48}
                    color={T.textSub}
                    style={{ animation: "spin 1s linear infinite", marginBottom: 16 }}
                />
                <p style={{ color: T.textSub, fontSize: 16 }}>
                    Chargement des workflows...
                </p>
            </div>
        );
    }

    if (workflows.length === 0) {
        return (
            <div style={{ padding: 80, textAlign: "center" }}>
                <Workflow size={64} color={T.textMuted} style={{ marginBottom: 20, opacity: 0.3 }} />
                <h3 style={{ fontSize: 20, fontWeight: 600, color: T.text, margin: "0 0 8px" }}>
                    Aucun workflow
                </h3>
                <p style={{ color: T.textSub, fontSize: 15, margin: "0 0 24px" }}>
                    Créez votre premier workflow pour automatiser vos emails
                </p>
                <button
                    style={{
                        padding: "12px 24px",
                        background: `linear-gradient(135deg, ${T.primary} 0%, #5558e3 100%)`,
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 15,
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8
                    }}
                >
                    <Plus size={18} />
                    Créer un workflow
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gap: 16 }}>
                {workflows.map(workflow => (
                    <div
                        key={workflow.id}
                        style={{
                            padding: 24,
                            background: "#fff",
                            border: `2px solid ${T.border}`,
                            borderRadius: 12,
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = T.primary;
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.border;
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0 }}>
                                        {workflow.name}
                                    </h3>
                                    <span style={{
                                        padding: "4px 12px",
                                        background: workflow.status === "active" ? T.success + "20" : T.textSub + "20",
                                        color: workflow.status === "active" ? T.success : T.textSub,
                                        borderRadius: 12,
                                        fontSize: 12,
                                        fontWeight: 600
                                    }}>
                                        {workflow.status === "active" ? "✓ Actif" : workflow.status === "draft" ? "📝 Brouillon" : "⏸ Inactif"}
                                    </span>
                                </div>
                                <p style={{ color: T.textSub, fontSize: 14, margin: 0 }}>
                                    {workflow.description || "Aucune description"}
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => onToggleStatus(workflow.id, workflow.status)}
                                    style={{
                                        padding: 8,
                                        background: "transparent",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: T.textSub,
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                    title={workflow.status === "active" ? "Désactiver" : "Activer"}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = T.primaryLight;
                                        e.target.style.borderColor = T.primary;
                                        e.target.style.color = T.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "transparent";
                                        e.target.style.borderColor = T.border;
                                        e.target.style.color = T.textSub;
                                    }}
                                >
                                    {workflow.status === "active" ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                                <button
                                    onClick={() => onDuplicate(workflow)}
                                    style={{
                                        padding: 8,
                                        background: "transparent",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: T.textSub,
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                    title="Dupliquer"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = T.primaryLight;
                                        e.target.style.borderColor = T.primary;
                                        e.target.style.color = T.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "transparent";
                                        e.target.style.borderColor = T.border;
                                        e.target.style.color = T.textSub;
                                    }}
                                >
                                    <Copy size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingWorkflow(workflow);
                                        setShowCreateModal(true);
                                    }}
                                    style={{
                                        padding: 8,
                                        background: "transparent",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: T.textSub,
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                    title="Modifier"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = T.primaryLight;
                                        e.target.style.borderColor = T.primary;
                                        e.target.style.color = T.primary;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "transparent";
                                        e.target.style.borderColor = T.border;
                                        e.target.style.color = T.textSub;
                                    }}
                                >
                                    <Edit size={16} />
                                </button>
                                <button
                                    onClick={() => onDelete(workflow.id)}
                                    style={{
                                        padding: 8,
                                        background: "transparent",
                                        border: `1px solid ${T.border}`,
                                        borderRadius: 8,
                                        cursor: "pointer",
                                        color: T.textSub,
                                        transition: "all 0.2s",
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                    title="Supprimer"
                                    onMouseEnter={(e) => {
                                        e.target.style.background = T.danger + "15";
                                        e.target.style.borderColor = T.danger;
                                        e.target.style.color = T.danger;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = "transparent";
                                        e.target.style.borderColor = T.border;
                                        e.target.style.color = T.textSub;
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Stats */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: 16,
                            marginTop: 20,
                            paddingTop: 20,
                            borderTop: `1px solid ${T.border}`
                        }}>
                            <div>
                                <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 4px" }}>Envoyés</p>
                                <p style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>
                                    {workflow.stats?.sent || 0}
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 4px" }}>Ouverts</p>
                                <p style={{ fontSize: 20, fontWeight: 700, color: T.primary, margin: 0 }}>
                                    {workflow.stats?.openRate || 0}%
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 4px" }}>Clics</p>
                                <p style={{ fontSize: 20, fontWeight: 700, color: T.success, margin: 0 }}>
                                    {workflow.stats?.clickRate || 0}%
                                </p>
                            </div>
                            <div>
                                <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 4px" }}>Conversions</p>
                                <p style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>
                                    {workflow.stats?.conversions || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
                            border: `2px solid ${T.border}`,
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
                                border: `2px solid ${T.primary}`,
                                borderRadius: 8,
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 600,
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = T.primary;
                                e.target.style.color = "#fff";
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
                            border: `2px solid ${T.border}`,
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