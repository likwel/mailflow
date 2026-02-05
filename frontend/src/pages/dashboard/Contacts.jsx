// src/pages/dashboard/Contacts.jsx
import { useState, useEffect } from "react";
import { T, styles } from "../../theme";
import client from "../../api/client";
import {
    Users, Search, Plus, Upload, Download, Filter,
    Trash2, List, Tag, Mail, MoreVertical, Edit, Eye
} from "lucide-react";
import ContactModal from "../../components/ContactModal";
import ImportContactsModal from "../../components/ImportContactsModal";
import BulkActionsBar from "../../components/BulkActionsBar";

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedContacts, setSelectedContacts] = useState([]);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingContact, setEditingContact] = useState(null);
    const [filterStatus, setFilterStatus] = useState("ACTIVE");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchContacts();
        fetchStats();
    }, [search, filterStatus, page]);

    async function fetchContacts() {
        setLoading(true);
        try {
            const res = await client.get("/contacts", {
                params: { search, status: filterStatus, page, limit: 50 }
            });
            setContacts(res.data.contacts);
            setTotalPages(res.data.pagination.pages);
        } catch (err) {
            console.error("Error fetching contacts:", err);
        } finally {
            setLoading(false);
        }
    }

    async function fetchStats() {
        try {
            const res = await client.get("/contacts/stats/overview");
            setStats(res.data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        }
    }

    function handleSelectAll() {
        if (selectedContacts.length === contacts.length) {
            setSelectedContacts([]);
        } else {
            setSelectedContacts(contacts.map(c => c.id));
        }
    }

    function handleSelectContact(id) {
        setSelectedContacts(prev =>
            prev.includes(id)
                ? prev.filter(cid => cid !== id)
                : [...prev, id]
        );
    }

    async function handleDeleteSelected() {
        if (!confirm(`Supprimer ${selectedContacts.length} contact(s) ?`)) return;

        try {
            await client.post("/contacts/bulk/delete", { contactIds: selectedContacts });
            setSelectedContacts([]);
            fetchContacts();
            fetchStats();
        } catch (err) {
            console.error("Error deleting contacts:", err);
            alert("Erreur lors de la suppression");
        }
    }

    async function handleExport() {
        try {
            const res = await client.get("/contacts", {
                params: { limit: 10000, status: filterStatus }
            });

            const csv = [
                ["Email", "Prénom", "Nom", "Téléphone", "Entreprise", "Tags"].join(","),
                ...res.data.contacts.map(c =>
                    [
                        c.email,
                        c.firstName || "",
                        c.lastName || "",
                        c.phone || "",
                        c.company || "",
                        (c.tags || []).join(";")
                    ].join(",")
                )
            ].join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err) {
            console.error("Error exporting contacts:", err);
            alert("Erreur lors de l'export");
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                    <h1 style={{ color: T.text, fontSize: 28, fontWeight: 700, margin: 0 }}>
                        Contacts
                    </h1>
                    <p style={{ color: T.textSub, fontSize: 14, margin: "4px 0 0" }}>
                        Gérez votre base de contacts
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => setShowImportModal(true)}
                        style={{ ...styles.btn, background: "#fff", color: T.primary, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Upload size={16} />
                        Importer
                    </button>
                    <button
                        onClick={handleExport}
                        style={{ ...styles.btn, background: "#fff", color: T.primary, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Download size={16} />
                        Exporter
                    </button>
                    <button
                        onClick={() => {
                            setEditingContact(null);
                            setShowContactModal(true);
                        }}
                        style={{ ...styles.btn, display: "flex", alignItems: "center", gap: 6 }}
                    >
                        <Plus size={16} />
                        Nouveau contact
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                    <StatCard label="Total" value={stats.total} icon={Users} color={T.primary} />
                    <StatCard label="Actifs" value={stats.active} icon={Users} color={T.success} />
                    <StatCard label="Désabonnés" value={stats.unsubscribed} icon={Users} color={T.warning} />
                    <StatCard label="Rebonds" value={stats.bounced} icon={Users} color={T.danger} />
                </div>
            )}

            {/* Filters & Search */}
            <div style={{ ...styles.card, padding: 16 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Search */}
                    <div style={{ flex: 1, minWidth: 250, position: "relative" }}>
                        <Search size={18} color={T.textSub} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                        <input
                            type="text"
                            placeholder="Rechercher par email, nom..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ ...styles.input, paddingLeft: 40 }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        style={{ ...styles.input, width: "auto", minWidth: 150 }}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="ACTIVE">Actifs</option>
                        <option value="UNSUBSCRIBED">Désabonnés</option>
                        <option value="BOUNCED">Rebonds</option>
                        <option value="BLOCKED">Bloqués</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedContacts.length > 0 && (
                <BulkActionsBar
                    count={selectedContacts.length}
                    onDelete={handleDeleteSelected}
                    onCancel={() => setSelectedContacts([])}
                />
            )}

            {/* Contacts Table */}
            <div style={{ ...styles.card, padding: 0, overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: 60, textAlign: "center", color: T.textSub }}>
                        Chargement...
                    </div>
                ) : contacts.length === 0 ? (
                    <div style={{ padding: 60, textAlign: "center" }}>
                        <Users size={48} color={T.textMuted} style={{ marginBottom: 16 }} />
                        <p style={{ color: T.textSub, fontSize: 16, margin: 0 }}>
                            Aucun contact trouvé
                        </p>
                        <button
                            onClick={() => setShowContactModal(true)}
                            style={{ ...styles.btn, marginTop: 16 }}
                        >
                            Créer votre premier contact
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                                        <th style={{ ...styles.tableHeader, width: 40 }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedContacts.length === contacts.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th style={styles.tableHeader}>Email</th>
                                        <th style={styles.tableHeader}>Nom</th>
                                        <th style={styles.tableHeader}>Listes</th>
                                        <th style={styles.tableHeader}>Tags</th>
                                        <th style={styles.tableHeader}>Statut</th>
                                        <th style={styles.tableHeader}>Stats</th>
                                        <th style={{ ...styles.tableHeader, width: 80 }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contacts.map((contact) => (
                                        <tr
                                            key={contact.id}
                                            style={{ borderBottom: `1px solid ${T.border}` }}
                                        >
                                            <td style={styles.tableCell}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedContacts.includes(contact.id)}
                                                    onChange={() => handleSelectContact(contact.id)}
                                                />
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <Mail size={16} color={T.textSub} />
                                                    <span style={{ fontWeight: 500 }}>{contact.email}</span>
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                {contact.firstName || contact.lastName
                                                    ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                                                    : "-"
                                                }
                                            </td>
                                            <td style={styles.tableCell}>
                                                {contact.lists?.length > 0 ? (
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        {contact.lists.slice(0, 2).map(({ list }) => (
                                                            <span
                                                                key={list.id}
                                                                style={{
                                                                    fontSize: 11,
                                                                    padding: "2px 8px",
                                                                    background: T.primaryLight,
                                                                    color: T.primary,
                                                                    borderRadius: 4
                                                                }}
                                                            >
                                                                {list.name}
                                                            </span>
                                                        ))}
                                                        {contact.lists.length > 2 && (
                                                            <span style={{ fontSize: 11, color: T.textSub }}>
                                                                +{contact.lists.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                            <td style={styles.tableCell}>
                                                {contact.tags?.length > 0 ? (
                                                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                        {contact.tags.slice(0, 2).map(tag => (
                                                            <span
                                                                key={tag}
                                                                style={{
                                                                    fontSize: 11,
                                                                    padding: "2px 8px",
                                                                    background: T.bg,
                                                                    color: T.textSub,
                                                                    borderRadius: 4,
                                                                    border: `1px solid ${T.border}`
                                                                }}
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {contact.tags.length > 2 && (
                                                            <span style={{ fontSize: 11, color: T.textSub }}>
                                                                +{contact.tags.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : "-"}
                                            </td>
                                            <td style={styles.tableCell}>
                                                <StatusBadge status={contact.status} />
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={{ fontSize: 12, color: T.textSub }}>
                                                    {contact.emailsSent} envoyés
                                                    {contact.emailsOpened > 0 && ` • ${contact.emailsOpened} ouverts`}
                                                </div>
                                            </td>
                                            <td style={styles.tableCell}>
                                                <div style={{ display: "flex", gap: 4 }}>
                                                    <button
                                                        onClick={() => {
                                                            setEditingContact(contact);
                                                            setShowContactModal(true);
                                                        }}
                                                        style={{ ...styles.iconBtn }}
                                                        title="Modifier"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm("Supprimer ce contact ?")) {
                                                                await client.delete(`/contacts/${contact.id}`);
                                                                fetchContacts();
                                                                fetchStats();
                                                            }
                                                        }}
                                                        style={{ ...styles.iconBtn, color: T.danger }}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{
                                padding: 16,
                                borderTop: `1px solid ${T.border}`,
                                display: "flex",
                                justifyContent: "center",
                                gap: 8
                            }}>
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    style={{
                                        ...styles.btn,
                                        background: "#fff",
                                        color: T.primary,
                                        border: `1px solid ${T.border}`,
                                        opacity: page === 1 ? 0.5 : 1
                                    }}
                                >
                                    Précédent
                                </button>
                                <span style={{ padding: "8px 16px", color: T.textSub }}>
                                    Page {page} sur {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(p => p + 1)}
                                    style={{
                                        ...styles.btn,
                                        background: "#fff",
                                        color: T.primary,
                                        border: `1px solid ${T.border}`,
                                        opacity: page === totalPages ? 0.5 : 1
                                    }}
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showContactModal && (
                <ContactModal
                    contact={editingContact}
                    onClose={() => {
                        setShowContactModal(false);
                        setEditingContact(null);
                    }}
                    onSave={() => {
                        fetchContacts();
                        fetchStats();
                        setShowContactModal(false);
                        setEditingContact(null);
                    }}
                />
            )}

            {showImportModal && (
                <ImportContactsModal
                    onClose={() => setShowImportModal(false)}
                    onImport={() => {
                        fetchContacts();
                        fetchStats();
                        setShowImportModal(false);
                    }}
                />
            )}
        </div>
    );
}