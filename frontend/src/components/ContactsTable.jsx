// Composant Table amélioré
import React, { useState } from 'react';
import { Mail, Edit, Trash2, MoreVertical, Eye, Download, Tag as TagIcon } from 'lucide-react';
import Badge from './Badge';

const ContactsTable = ({ 
  contacts, 
  selectedContacts, 
  onSelectAll, 
  onSelectContact,
  onEdit,
  onDelete,
  theme: T 
}) => {
  const [hoveredRow, setHoveredRow] = useState(null);

  const styles = {
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      fontSize: 14
    },
    tableHeader: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: 12,
      fontWeight: 600,
      color: T.textSub,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      position: "sticky",
      top: 0,
      background: T.bg,
      zIndex: 10
    },
    tableCell: {
      padding: "16px",
      color: T.text,
      verticalAlign: "middle",
      transition: "all 0.2s ease"
    },
    tableRow: (isHovered, isSelected) => ({
      borderBottom: `1px solid ${T.border}`,
      background: isSelected 
        ? T.primaryLight 
        : isHovered 
          ? T.bgHover || `${T.bg}dd`
          : "transparent",
      transition: "all 0.2s ease",
      cursor: "pointer"
    }),
    checkbox: {
      width: 16,
      height: 16,
      cursor: "pointer",
      accentColor: T.primary
    },
    badge: {
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: 12,
      fontWeight: 500,
      whiteSpace: "nowrap"
    },
    iconBtn: {
      background: "transparent",
      border: "none",
      cursor: "pointer",
      padding: 8,
      borderRadius: 6,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      color: T.textSub,
      transition: "all 0.2s ease"
    },
    stats: {
      fontSize: 12,
      color: T.textSub,
      display: "flex",
      flexDirection: "column",
      gap: 2
    },
    emptyState: {
      textAlign: "center",
      padding: "48px 16px",
      color: T.textSub
    }
  };

  if (contacts.length === 0) {
    return (
      <div style={styles.emptyState}>
        <Mail size={48} color={T.textSub} style={{ opacity: 0.3, margin: "0 auto 16px" }} />
        <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Aucun contact</p>
        <p style={{ fontSize: 14 }}>Commencez par importer ou créer des contacts</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${T.border}` }}>
      <table style={styles.table}>
        <thead>
          <tr style={{ background: T.bg, borderBottom: `2px solid ${T.border}` }}>
            <th style={{ ...styles.tableHeader, width: 40 }}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={selectedContacts.length === contacts.length && contacts.length > 0}
                onChange={onSelectAll}
              />
            </th>
            <th style={styles.tableHeader}>Contact</th>
            <th style={styles.tableHeader}>Listes</th>
            <th style={styles.tableHeader}>Tags</th>
            <th style={styles.tableHeader}>Statut</th>
            <th style={styles.tableHeader}>Engagement</th>
            <th style={{ ...styles.tableHeader, width: 100, textAlign: "center" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => {
            const isSelected = selectedContacts.includes(contact.id);
            const isHovered = hoveredRow === contact.id;

            return (
              <tr
                key={contact.id}
                style={styles.tableRow(isHovered, isSelected)}
                onMouseEnter={() => setHoveredRow(contact.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Checkbox */}
                <td style={styles.tableCell}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={isSelected}
                    onChange={() => onSelectContact(contact.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>

                {/* Contact Info */}
                <td style={styles.tableCell}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: T.primaryLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 600,
                        color: T.primary,
                        fontSize: 14
                      }}
                    >
                      {(contact.firstName?.[0] || contact.email[0]).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>
                        {contact.firstName || contact.lastName
                          ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim()
                          : "Sans nom"}
                      </div>
                      <div style={{ fontSize: 13, color: T.textSub, display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={12} />
                        {contact.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Lists */}
                <td style={styles.tableCell}>
                  {contact.lists?.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 200 }}>
                      {contact.lists.slice(0, 2).map(({ list }) => (
                        <span
                          key={list.id}
                          style={{
                            ...styles.badge,
                            background: T.primaryLight,
                            color: T.primary,
                            border: `1px solid ${T.primary}20`
                          }}
                        >
                          {list.name}
                        </span>
                      ))}
                      {contact.lists.length > 2 && (
                        <span
                          style={{
                            ...styles.badge,
                            background: T.bg,
                            color: T.textSub,
                            border: `1px solid ${T.border}`
                          }}
                        >
                          +{contact.lists.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: T.textSub, fontSize: 13 }}>-</span>
                  )}
                </td>

                {/* Tags */}
                <td style={styles.tableCell}>
                  {contact.tags?.length > 0 ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", maxWidth: 200 }}>
                      {contact.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          style={{
                            ...styles.badge,
                            background: T.bg,
                            color: T.text,
                            border: `1px solid ${T.border}`
                          }}
                        >
                          <TagIcon size={10} style={{ marginRight: 4, display: "inline" }} />
                          {tag}
                        </span>
                      ))}
                      {contact.tags.length > 2 && (
                        <span style={{ fontSize: 11, color: T.textSub }}>
                          +{contact.tags.length - 2}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: T.textSub, fontSize: 13 }}>-</span>
                  )}
                </td>

                {/* Status */}
                <td style={styles.tableCell}>
                  <Badge status={contact.status} />
                </td>

                {/* Stats */}
                <td style={styles.tableCell}>
                  <div style={styles.stats}>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div>
                        <span style={{ fontWeight: 500, color: T.text }}>
                          {contact._count?.events || 0}
                        </span>
                        <span style={{ marginLeft: 4 }}>envoyés</span>
                      </div>
                      {contact.emailsOpened > 0 && (
                        <div>
                          <span style={{ fontWeight: 500, color: T.primary }}>
                            {contact.emailsOpened}
                          </span>
                          <span style={{ marginLeft: 4 }}>ouverts</span>
                        </div>
                      )}
                    </div>
                    {contact.emailsSent > 0 && (
                      <div style={{ fontSize: 11, color: T.textSub }}>
                        {Math.round((contact.emailsOpened / contact.emailsSent) * 100)}% taux d'ouverture
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td style={{ ...styles.tableCell, textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(contact);
                      }}
                      style={styles.iconBtn}
                      title="Modifier"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = T.primaryLight;
                        e.currentTarget.style.color = T.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = T.textSub;
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Supprimer ${contact.email} ?`)) {
                          await onDelete(contact.id);
                        }
                      }}
                      style={styles.iconBtn}
                      title="Supprimer"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${T.danger}15`;
                        e.currentTarget.style.color = T.danger;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = T.textSub;
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ContactsTable;