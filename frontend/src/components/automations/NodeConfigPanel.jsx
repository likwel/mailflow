// src/components/automations/NodeConfigPanel.jsx
// Panel latéral droit qui s'ouvre quand on clique un node — style n8n
import { useState } from "react";

// ── Imports à ajouter ──────────────────────────────────────────────────────
import {
  Zap, Clock, Mail, GitBranch, Tag, Globe,
  MessageSquare, Bell, UserPlus, UserMinus, UserCheck,
  FileText, BarChart2, Star, RefreshCw, Slash,
  Phone, Send, Database, Filter, Shuffle, Copy,
  AlarmClock, Calendar, ThumbsUp, Archive, Trash2 as TrashIcon, X, ChevronDown, Info, Bot 
} from "lucide-react";


// ── NODE_META ───────────────────────────────────────────────────────────────
export const NODE_META = {
  // ── Déclencheurs ──────────────────────────────────────────────────────────
  trigger:       { icon: Zap,          color: "#f59e0b", bg: "#fffbeb", label: "Déclencheur",    desc: "Point de départ du workflow"         },
  schedule:      { icon: Calendar,     color: "#f97316", bg: "#fff7ed", label: "Planificateur",   desc: "Déclenche à une date / heure fixe"   },
  alarm:         { icon: AlarmClock,   color: "#fb923c", bg: "#fff7ed", label: "Rappel",          desc: "Déclenche après un délai relatif"    },

  // ── Timing ────────────────────────────────────────────────────────────────
  delay:         { icon: Clock,        color: "#6366f1", bg: "#f5f3ff", label: "Délai",           desc: "Pause avant l'étape suivante"        },

  // ── Communication ─────────────────────────────────────────────────────────
  email:         { icon: Mail,         color: "#0891b2", bg: "#ecfeff", label: "Email",           desc: "Envoie un email au contact"          },
  sms:           { icon: Phone,        color: "#0d9488", bg: "#f0fdfa", label: "SMS",             desc: "Envoie un SMS au contact"            },
  push:          { icon: Bell,         color: "#7c3aed", bg: "#f5f3ff", label: "Notification",    desc: "Envoie une notification push"        },
  chat:          { icon: MessageSquare,color: "#2563eb", bg: "#eff6ff", label: "Message interne", desc: "Envoie un message dans l'app"        },
  telegram:      { icon: Send,         color: "#0088cc", bg: "#e8f4fd", label: "Telegram",        desc: "Envoie un message Telegram"          },

  // ── Logique ───────────────────────────────────────────────────────────────
  condition:     { icon: GitBranch,    color: "#10b981", bg: "#f0fdf4", label: "Condition",       desc: "Branche selon une condition"         },
  filter:        { icon: Filter,       color: "#059669", bg: "#ecfdf5", label: "Filtre",          desc: "Stoppe si la condition est fausse"   },
  split:         { icon: Shuffle,      color: "#14b8a6", bg: "#f0fdfa", label: "Split A/B",       desc: "Répartit aléatoirement en 2 groupes" },
  loop:          { icon: RefreshCw,    color: "#0891b2", bg: "#ecfeff", label: "Boucle",          desc: "Répète pour chaque élément"          },
  stop:          { icon: Slash,        color: "#64748b", bg: "#f8fafc", label: "Arrêt",           desc: "Termine le workflow ici"             },

  // ── Contact ───────────────────────────────────────────────────────────────
  tag:           { icon: Tag,          color: "#8b5cf6", bg: "#faf5ff", label: "Tag",             desc: "Ajoute ou retire un tag"             },
  add_contact:   { icon: UserPlus,     color: "#6366f1", bg: "#eef2ff", label: "Ajouter contact", desc: "Crée un nouveau contact"             },
  remove_contact:{ icon: UserMinus,    color: "#ef4444", bg: "#fff1f2", label: "Suppr. contact",  desc: "Supprime le contact"                 },
  update_contact:{ icon: UserCheck,    color: "#3b82f6", bg: "#eff6ff", label: "Màj contact",     desc: "Met à jour les champs du contact"    },
  subscribe:     { icon: ThumbsUp,     color: "#10b981", bg: "#f0fdf4", label: "Abonner",         desc: "Abonne à une liste"                  },
  unsubscribe:   { icon: Archive,      color: "#f59e0b", bg: "#fffbeb", label: "Désabonner",      desc: "Retire d'une liste"                  },

  // ── Données ───────────────────────────────────────────────────────────────
  webhook:       { icon: Globe,        color: "#ef4444", bg: "#fff1f2", label: "Webhook",         desc: "Appelle une URL externe"             },
  database:      { icon: Database,     color: "#475569", bg: "#f8fafc", label: "Base de données", desc: "Lit ou écrit en base"                },
  copy_field:    { icon: Copy,         color: "#64748b", bg: "#f8fafc", label: "Copier champ",    desc: "Copie la valeur d'un champ"          },
  score:         { icon: Star,         color: "#eab308", bg: "#fefce8", label: "Score",           desc: "Modifie le score du contact"         },
  note:          { icon: FileText,     color: "#64748b", bg: "#f8fafc", label: "Note",            desc: "Ajoute une note sur le contact"      },

  // ── Reporting ─────────────────────────────────────────────────────────────
  goal:          { icon: BarChart2,    color: "#8b5cf6", bg: "#faf5ff", label: "Objectif",        desc: "Marque un objectif comme atteint"    },
  delete_node:   { icon: TrashIcon,    color: "#dc2626", bg: "#fff1f2", label: "Supprimer",       desc: "Supprime une donnée"                 },
  ai_agent: { icon: Bot, color: "#6d28d9", bg: "#f5f3ff", label: "Agent IA", desc: "Génère du contenu ou prend une décision via IA" },

};

export default function NodeConfigPanel({ node, onClose, onChange, onDelete }) {
  const [tab, setTab] = useState("config"); // "config" | "notes"
  const [notes, setNotes] = useState(node?.data?.notes || "");
  const [copied, setCopied] = useState(false);

  if (!node) return null;

  const meta   = NODE_META[node.data.type] || NODE_META.trigger;
  const Icon   = meta.icon;
  const config = node.data.config || {};

  function set(k, v) {
    onChange({ ...config, [k]: v });
  }

  function copyId() {
    navigator.clipboard.writeText(node.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {/* Overlay mobile */}
      <div
        onClick={onClose}
        style={{
          display: "none",
          position: "fixed", inset: 0, zIndex: 299,
          background: "rgba(0,0,0,.3)",
        }}
      />

      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: 360, zIndex: 300,
        background: "#fff",
        borderLeft: "1px solid #e2e8f0",
        boxShadow: "-8px 0 40px rgba(0,0,0,.12)",
        display: "flex", flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
        animation: "slideIn .2s ease",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "16px 20px",
          background: meta.bg,
          borderBottom: `1px solid ${meta.color}20`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            {/* Icône */}
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: "#fff", border: `2px solid ${meta.color}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 12px ${meta.color}20`,
            }}>
              <Icon size={22} color={meta.color}/>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: "uppercase", letterSpacing: .8 }}>
                {meta.label}
              </div>
              <input
                value={node.data.label || ""}
                onChange={e => onChange({ ...config, __label: e.target.value })}
                placeholder="Nom du nœud"
                style={{
                  fontSize: 15, fontWeight: 700, color: "#0f172a",
                  background: "transparent", border: "none", outline: "none",
                  width: "100%", padding: 0, marginTop: 2,
                }}
              />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                {meta.desc}
              </div>
            </div>

            <button onClick={onClose} style={ghostBtn}>
              <X size={18}/>
            </button>
          </div>

          {/* ID + badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
            <span style={{
              fontSize: 10, color: "#94a3b8", fontFamily: "monospace",
              background: "#f1f5f9", padding: "2px 8px", borderRadius: 4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200,
            }}>
              {node.id}
            </span>
            <button onClick={copyId} style={{ ...ghostBtn, width: 24, height: 24, fontSize: 10 }}>
              {copied ? <Check size={12} color="#10b981"/> : <Copy size={12}/>}
            </button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
        }}>
          {["config", "notes"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: "10px 0",
              fontSize: 12, fontWeight: 600,
              color: tab === t ? meta.color : "#94a3b8",
              background: "transparent", border: "none",
              borderBottom: `2px solid ${tab === t ? meta.color : "transparent"}`,
              cursor: "pointer", transition: "all .15s", textTransform: "capitalize",
            }}>
              {t === "config" ? "⚙️ Paramètres" : "📝 Notes"}
            </button>
          ))}
        </div>

        {/* ── Contenu scrollable ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {tab === "config" && (
            <NodeConfigForm type={node.data.type} config={config} set={set}/>
          )}
          {tab === "notes" && (
            <div>
              <label style={labelStyle}>Notes internes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Décrivez le rôle de ce nœud…"
                rows={8}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
              />
              <p style={{ fontSize: 10, color: "#94a3b8", marginTop: 6 }}>
                Ces notes sont uniquement visibles en mode édition.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "12px 20px",
          borderTop: "1px solid #f1f5f9",
          display: "flex", gap: 8, flexShrink: 0,
        }}>
          <button
            onClick={onDelete}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              border: "1px solid #fca5a5", background: "#fff1f2",
              color: "#ef4444", fontSize: 12, fontWeight: 600,
              cursor: "pointer", transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#ef4444"; }}
          >
            <TrashIcon size={14}/> Supprimer
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: "8px 14px", borderRadius: 8,
              background: meta.color, color: "#fff",
              border: "none", fontSize: 12, fontWeight: 700,
              cursor: "pointer", transition: "opacity .15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            ✓ Confirmer
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </>
  );
}

/* ─────────────────────────────────────────────────────────
   Formulaires par type de nœud
───────────────────────────────────────────────────────── */
function NodeConfigForm({ type, config, set }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Déclencheurs */}
      {type === "trigger"        && <TriggerForm        config={config} set={set}/>}
      {type === "schedule"       && <ScheduleForm       config={config} set={set}/>}
      {type === "alarm"          && <AlarmForm          config={config} set={set}/>}

      {/* Timing */}
      {type === "delay"          && <DelayForm          config={config} set={set}/>}

      {/* Communication */}
      {type === "email"          && <EmailForm          config={config} set={set}/>}
      {type === "sms"            && <SmsForm            config={config} set={set}/>}
      {type === "push"           && <PushForm           config={config} set={set}/>}
      {type === "chat"           && <ChatForm           config={config} set={set}/>}
      {type === "telegram"       && <TelegramForm       config={config} set={set}/>}

      {/* Logique */}
      {type === "condition"      && <ConditionForm      config={config} set={set}/>}
      {type === "filter"         && <FilterForm         config={config} set={set}/>}
      {type === "split"          && <SplitForm          config={config} set={set}/>}
      {type === "loop"           && <LoopForm           config={config} set={set}/>}
      {type === "stop"           && <StopForm           config={config} set={set}/>}

      {/* Contact */}
      {type === "tag"            && <TagForm            config={config} set={set}/>}
      {type === "add_contact"    && <AddContactForm     config={config} set={set}/>}
      {type === "remove_contact" && <RemoveContactForm  config={config} set={set}/>}
      {type === "update_contact" && <UpdateContactForm  config={config} set={set}/>}
      {type === "subscribe"      && <SubscribeForm      config={config} set={set}/>}
      {type === "unsubscribe"    && <UnsubscribeForm    config={config} set={set}/>}

      {/* Données */}
      {type === "webhook"        && <WebhookForm        config={config} set={set}/>}
      {type === "database"       && <DatabaseForm       config={config} set={set}/>}
      {type === "copy_field"     && <CopyFieldForm      config={config} set={set}/>}
      {type === "score"          && <ScoreForm          config={config} set={set}/>}
      {type === "note"           && <NoteForm           config={config} set={set}/>}

      {/* Reporting */}
      {type === "goal"           && <GoalForm           config={config} set={set}/>}
      {type === "ai_agent" && <AiAgentForm config={config} set={set}/>}
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   DÉCLENCHEURS
══════════════════════════════════════════════════════ */

function ScheduleForm({ config, set }) {
  return (<>
    <Section title="Planification" icon="📅">
      <Field label="Fréquence">
        <Select value={config.freq||"daily"} onChange={v => set("freq", v)} options={[
          { value: "once",    label: "Une seule fois"  },
          { value: "daily",   label: "Quotidien"       },
          { value: "weekly",  label: "Hebdomadaire"    },
          { value: "monthly", label: "Mensuel"         },
        ]}/>
      </Field>
      {config.freq === "weekly" && (
        <Field label="Jours">
          <DayPicker value={config.days||[1]} onChange={v => set("days", v)}/>
        </Field>
      )}
      {config.freq === "monthly" && (
        <Field label="Jour du mois">
          <Input type="number" value={config.dayOfMonth||1} min={1} max={31} onChange={v => set("dayOfMonth", +v)}/>
        </Field>
      )}
      <Field label="Heure">
        <Input type="time" value={config.time||"09:00"} onChange={v => set("time", v)}/>
      </Field>
      <Field label="Fuseau horaire">
        <Select value={config.tz||"Europe/Paris"} onChange={v => set("tz", v)} options={[
          { value: "Europe/Paris",    label: "Paris (UTC+1)"     },
          { value: "Europe/London",   label: "Londres (UTC+0)"   },
          { value: "America/New_York",label: "New York (UTC-5)"  },
          { value: "Asia/Tokyo",      label: "Tokyo (UTC+9)"     },
        ]}/>
      </Field>
    </Section>
  </>);
}

function AlarmForm({ config, set }) {
  return (<>
    <Section title="Rappel" icon="⏰">
      <Field label="Délai après l'inscription">
        <div style={{ display: "flex", gap: 8 }}>
          <Input type="number" value={config.duration||1} min={1} onChange={v => set("duration", +v)} style={{ width: 70 }}/>
          <Select value={config.unit||"day"} onChange={v => set("unit", v)} options={[
            { value: "minute", label: "min"      },
            { value: "hour",   label: "heure(s)" },
            { value: "day",    label: "jour(s)"  },
          ]}/>
        </div>
      </Field>
      <Toggle label="Répéter si non ouvert" checked={config.repeat??false} onChange={v => set("repeat", v)}/>
      {config.repeat && (
        <Field label="Max répétitions">
          <Input type="number" value={config.maxRepeat||3} min={1} max={10} onChange={v => set("maxRepeat", +v)}/>
        </Field>
      )}
    </Section>
  </>);
}

/* ══════════════════════════════════════════════════════
   COMMUNICATION
══════════════════════════════════════════════════════ */

function SmsForm({ config, set }) {
  return (<>
    <Section title="Message SMS" icon="📱">
      <Field label="Expéditeur (nom ou numéro)">
        <Input value={config.from||""} onChange={v => set("from", v)} placeholder="MonApp"/>
      </Field>
      <Field label="Message">
        <textarea value={config.message||""} onChange={e => set("message", e.target.value)}
          placeholder="Bonjour {{contact.first_name}}…"
          rows={4} style={{ ...inputStyle, resize: "vertical" }}/>
      </Field>
      <Field label="Variables disponibles">
        <span style={{ fontSize: 10, color: "#94a3b8" }}>
          {"{{contact.first_name}}  {{contact.phone}}  {{contact.email}}"}
        </span>
      </Field>
    </Section>
    <Section title="Options" icon="⚙️">
      <Toggle label="Envoyer uniquement si opt-in SMS" checked={config.checkOptin??true} onChange={v => set("checkOptin", v)}/>
    </Section>
  </>);
}

function PushForm({ config, set }) {
  return (<>
    <Section title="Notification push" icon="🔔">
      <Field label="Titre">
        <Input value={config.title||""} onChange={v => set("title", v)} placeholder="Titre de la notif"/>
      </Field>
      <Field label="Corps du message">
        <textarea value={config.body||""} onChange={e => set("body", e.target.value)}
          placeholder="Corps de la notification…"
          rows={3} style={{ ...inputStyle, resize: "vertical" }}/>
      </Field>
      <Field label="URL à ouvrir (optionnel)">
        <Input value={config.url||""} onChange={v => set("url", v)} placeholder="https://..."/>
      </Field>
    </Section>
    <Section title="Options" icon="⚙️">
      <Field label="Icône">
        <Select value={config.icon||"default"} onChange={v => set("icon", v)} options={[
          { value: "default", label: "Défaut"     },
          { value: "promo",   label: "Promo 🎁"   },
          { value: "alert",   label: "Alerte ⚠️"  },
          { value: "info",    label: "Info ℹ️"    },
        ]}/>
      </Field>
      <Toggle label="Badger l'icône de l'app" checked={config.badge??true} onChange={v => set("badge", v)}/>
    </Section>
  </>);
}

function ChatForm({ config, set }) {
  return (<>
    <Section title="Message interne" icon="💬">
      <Field label="Destinataire">
        <Select value={config.to||"owner"} onChange={v => set("to", v)} options={[
          { value: "owner",  label: "Propriétaire du contact" },
          { value: "team",   label: "Toute l'équipe"          },
          { value: "custom", label: "Utilisateur spécifique"  },
        ]}/>
      </Field>
      {config.to === "custom" && (
        <Field label="Email de l'utilisateur">
          <Input value={config.userEmail||""} onChange={v => set("userEmail", v)} placeholder="user@domaine.com" type="email"/>
        </Field>
      )}
      <Field label="Message">
        <textarea value={config.message||""} onChange={e => set("message", e.target.value)}
          placeholder="Le contact {{contact.email}} a…"
          rows={3} style={{ ...inputStyle, resize: "vertical" }}/>
      </Field>
    </Section>
  </>);
}

function TelegramForm({ config, set }) {
  return (<>
    <Section title="Telegram" icon="✈️">
      <Field label="Chat ID">
        <Input value={config.chatId||""} onChange={v => set("chatId", v)} placeholder="-100123456789"/>
      </Field>
      <Field label="Message">
        <textarea value={config.message||""} onChange={e => set("message", e.target.value)}
          placeholder="Bonjour {{contact.first_name}}…"
          rows={4} style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 11 }}/>
      </Field>
      <Toggle label="Mode silencieux" checked={config.silent??false} onChange={v => set("silent", v)}/>
    </Section>
    <Section title="Bot" icon="🤖">
      <Field label="Token du bot">
        <Input value={config.botToken||""} onChange={v => set("botToken", v)} placeholder="123456:ABC-…" type="password"/>
      </Field>
    </Section>
  </>);
}

/* ══════════════════════════════════════════════════════
   LOGIQUE
══════════════════════════════════════════════════════ */

function FilterForm({ config, set }) {
  return (<>
    <Section title="Filtre" icon="🔽">
      <InfoBox color="#059669">Si la condition est <b>fausse</b>, le contact sort du workflow sans continuer.</InfoBox>
      <Field label="Champ">
        <Select value={config.field||""} onChange={v => set("field", v)} options={[
          { value: "",              label: "— Sélectionner —"    },
          { value: "email",         label: "📧 Email"             },
          { value: "tags",          label: "🏷 Tags"              },
          { value: "score",         label: "⭐ Score"             },
          { value: "country",       label: "🌍 Pays"              },
          { value: "custom_field",  label: "🔧 Champ personnalisé"},
        ]}/>
      </Field>
      {config.field === "custom_field" && (
        <Field label="Clé"><Input value={config.customKey||""} onChange={v => set("customKey", v)} placeholder="ma_variable"/></Field>
      )}
      <Field label="Opérateur">
        <Select value={config.operator||"eq"} onChange={v => set("operator", v)} options={[
          { value: "eq",          label: "est égal à"       },
          { value: "neq",         label: "est différent de" },
          { value: "contains",    label: "contient"         },
          { value: "not_contains",label: "ne contient pas"  },
          { value: "gt",          label: "supérieur à"      },
          { value: "lt",          label: "inférieur à"      },
          { value: "is_empty",    label: "est vide"         },
          { value: "is_not_empty",label: "n'est pas vide"   },
        ]}/>
      </Field>
      {!["is_empty","is_not_empty"].includes(config.operator) && (
        <Field label="Valeur">
          <Input value={config.value||""} onChange={v => set("value", v)} placeholder="Valeur attendue"/>
        </Field>
      )}
    </Section>
  </>);
}

function SplitForm({ config, set }) {
  return (<>
    <Section title="Split A/B" icon="🔀">
      <InfoBox color="#14b8a6">Les contacts sont répartis aléatoirement entre les deux branches.</InfoBox>
      <Field label="% vers branche A">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="range" min={0} max={100} value={config.splitA||50}
            onChange={e => set("splitA", +e.target.value)}
            style={{ flex: 1 }}/>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#14b8a6", minWidth: 36 }}>
            {config.splitA||50}%
          </span>
        </div>
      </Field>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
        <span>🅐 {config.splitA||50}%</span>
        <span>🅑 {100-(config.splitA||50)}%</span>
      </div>
    </Section>
  </>);
}

function LoopForm({ config, set }) {
  return (<>
    <Section title="Boucle" icon="🔁">
      <Field label="Source de la liste">
        <Select value={config.source||"contacts"} onChange={v => set("source", v)} options={[
          { value: "contacts",  label: "Contacts d'une liste" },
          { value: "tags",      label: "Contacts avec un tag" },
          { value: "webhook",   label: "Tableau JSON (webhook)"},
        ]}/>
      </Field>
      {config.source === "contacts" && (
        <Field label="ID de liste">
          <Input value={config.listId||""} onChange={v => set("listId", v)} placeholder="ID de la liste"/>
        </Field>
      )}
      {config.source === "tags" && (
        <Field label="Tag">
          <Input value={config.tag||""} onChange={v => set("tag", v)} placeholder="nom-du-tag"/>
        </Field>
      )}
      <Field label="Délai entre chaque itération">
        <div style={{ display: "flex", gap: 8 }}>
          <Input type="number" value={config.iterDelay||0} min={0} onChange={v => set("iterDelay", +v)} style={{ width: 70 }}/>
          <Select value={config.iterUnit||"second"} onChange={v => set("iterUnit", v)} options={[
            { value: "second", label: "sec"  },
            { value: "minute", label: "min"  },
            { value: "hour",   label: "h"    },
          ]}/>
        </div>
      </Field>
    </Section>
  </>);
}

function StopForm({ config, set }) {
  return (<>
    <Section title="Arrêt du workflow" icon="🛑">
      <InfoBox color="#64748b">Le contact atteint cette étape et le workflow se termine.</InfoBox>
      <Field label="Raison (optionnel)">
        <Input value={config.reason||""} onChange={v => set("reason", v)} placeholder="ex: Objectif atteint"/>
      </Field>
      <Toggle label="Marquer le contact comme converti" checked={config.markConverted??false} onChange={v => set("markConverted", v)}/>
    </Section>
  </>);
}

/* ══════════════════════════════════════════════════════
   CONTACT
══════════════════════════════════════════════════════ */

function AddContactForm({ config, set }) {
  return (<>
    <Section title="Nouveau contact" icon="👤">
      <Field label="Email *"><Input value={config.email||""} onChange={v => set("email", v)} placeholder="{{email}} ou fixe" type="email"/></Field>
      <Field label="Prénom"><Input value={config.firstName||""} onChange={v => set("firstName", v)} placeholder="{{first_name}}"/></Field>
      <Field label="Nom"><Input value={config.lastName||""} onChange={v => set("lastName", v)} placeholder="{{last_name}}"/></Field>
      <Field label="Téléphone"><Input value={config.phone||""} onChange={v => set("phone", v)} placeholder="{{phone}}"/></Field>
    </Section>
    <Section title="Options" icon="⚙️">
      <Field label="Liste d'ajout">
        <Input value={config.listId||""} onChange={v => set("listId", v)} placeholder="ID de liste (optionnel)"/>
      </Field>
      <Toggle label="Mettre à jour si existant" checked={config.upsert??true} onChange={v => set("upsert", v)}/>
    </Section>
  </>);
}

function RemoveContactForm({ config, set }) {
  return (<>
    <Section title="Suppression" icon="🗑️">
      <InfoBox color="#ef4444">Cette action est <b>irréversible</b>. Le contact sera définitivement supprimé.</InfoBox>
      <Toggle label="Supprimer toutes les données associées" checked={config.fullDelete??false} onChange={v => set("fullDelete", v)}/>
    </Section>
  </>);
}

function UpdateContactForm({ config, set }) {
  return (<>
    <Section title="Champs à mettre à jour" icon="✏️">
      <Field label="Champ"><Select value={config.field||""} onChange={v => set("field", v)} options={[
        { value: "",           label: "— Sélectionner —"   },
        { value: "first_name", label: "Prénom"              },
        { value: "last_name",  label: "Nom"                 },
        { value: "email",      label: "Email"               },
        { value: "phone",      label: "Téléphone"           },
        { value: "country",    label: "Pays"                },
        { value: "custom",     label: "Champ personnalisé"  },
      ]}/></Field>
      {config.field === "custom" && (
        <Field label="Clé"><Input value={config.customKey||""} onChange={v => set("customKey", v)} placeholder="ma_variable"/></Field>
      )}
      <Field label="Nouvelle valeur">
        <Input value={config.value||""} onChange={v => set("value", v)} placeholder="Valeur ou {{variable}}"/>
      </Field>
    </Section>
  </>);
}

function SubscribeForm({ config, set }) {
  return (<>
    <Section title="Abonnement" icon="✅">
      <Field label="Liste"><Input value={config.listId||""} onChange={v => set("listId", v)} placeholder="ID de la liste"/></Field>
      <Toggle label="Envoyer un email de confirmation" checked={config.sendConfirm??false} onChange={v => set("sendConfirm", v)}/>
    </Section>
  </>);
}

function UnsubscribeForm({ config, set }) {
  return (<>
    <Section title="Désabonnement" icon="🚫">
      <Field label="Liste (laisser vide = toutes)">
        <Input value={config.listId||""} onChange={v => set("listId", v)} placeholder="ID de liste (optionnel)"/>
      </Field>
      <Toggle label="Blacklister l'email" checked={config.blacklist??false} onChange={v => set("blacklist", v)}/>
    </Section>
  </>);
}

/* ══════════════════════════════════════════════════════
   DONNÉES
══════════════════════════════════════════════════════ */

function DatabaseForm({ config, set }) {
  return (<>
    <Section title="Base de données" icon="🗄️">
      <Field label="Opération">
        <Select value={config.operation||"read"} onChange={v => set("operation", v)} options={[
          { value: "read",   label: "📖 Lire"      },
          { value: "write",  label: "✏️ Écrire"    },
          { value: "delete", label: "🗑️ Supprimer" },
        ]}/>
      </Field>
      <Field label="Table / Collection">
        <Input value={config.table||""} onChange={v => set("table", v)} placeholder="nom_table"/>
      </Field>
      <Field label="Filtre (JSON)">
        <textarea value={config.filter||""} onChange={e => set("filter", e.target.value)}
          placeholder={'{ "id": "{{contact.id}}" }'}
          rows={3} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}/>
      </Field>
      {config.operation === "write" && (
        <Field label="Données (JSON)">
          <textarea value={config.data||""} onChange={e => set("data", e.target.value)}
            placeholder={'{ "score": 100 }'}
            rows={3} style={{ ...inputStyle, fontFamily: "monospace", fontSize: 11, resize: "vertical" }}/>
        </Field>
      )}
    </Section>
  </>);
}

function CopyFieldForm({ config, set }) {
  return (<>
    <Section title="Copier un champ" icon="📋">
      <Field label="Champ source">
        <Input value={config.source||""} onChange={v => set("source", v)} placeholder="ex: email"/>
      </Field>
      <Field label="Champ destination">
        <Input value={config.destination||""} onChange={v => set("destination", v)} placeholder="ex: custom_email_backup"/>
      </Field>
      <Toggle label="Écraser si la destination existe" checked={config.overwrite??true} onChange={v => set("overwrite", v)}/>
    </Section>
  </>);
}

function ScoreForm({ config, set }) {
  return (<>
    <Section title="Score du contact" icon="⭐">
      <Field label="Action">
        <Select value={config.action||"add"} onChange={v => set("action", v)} options={[
          { value: "add",   label: "➕ Ajouter"     },
          { value: "sub",   label: "➖ Soustraire"  },
          { value: "set",   label: "🎯 Définir à"   },
          { value: "reset", label: "🔄 Réinitialiser"},
        ]}/>
      </Field>
      {config.action !== "reset" && (
        <Field label="Valeur">
          <Input type="number" value={config.value||10} onChange={v => set("value", +v)}/>
        </Field>
      )}
      <Toggle label="Notifier si seuil atteint" checked={config.notifyThreshold??false} onChange={v => set("notifyThreshold", v)}/>
      {config.notifyThreshold && (
        <Field label="Seuil">
          <Input type="number" value={config.threshold||100} onChange={v => set("threshold", +v)}/>
        </Field>
      )}
    </Section>
  </>);
}

function NoteForm({ config, set }) {
  return (<>
    <Section title="Note" icon="📝">
      <Field label="Contenu de la note">
        <textarea value={config.content||""} onChange={e => set("content", e.target.value)}
          placeholder="Note ajoutée automatiquement par le workflow…"
          rows={4} style={{ ...inputStyle, resize: "vertical" }}/>
      </Field>
      <Toggle label="Inclure la date automatiquement" checked={config.includeDate??true} onChange={v => set("includeDate", v)}/>
    </Section>
  </>);
}

/* ══════════════════════════════════════════════════════
   REPORTING
══════════════════════════════════════════════════════ */

function GoalForm({ config, set }) {
  return (<>
    <Section title="Objectif" icon="🎯">
      <Field label="Nom de l'objectif">
        <Input value={config.name||""} onChange={v => set("name", v)} placeholder="ex: Premier achat"/>
      </Field>
      <Field label="Valeur ($)">
        <Input type="number" value={config.value||0} min={0} onChange={v => set("value", +v)}/>
      </Field>
      <Toggle label="Sortir du workflow après l'objectif" checked={config.exitAfter??true} onChange={v => set("exitAfter", v)}/>
    </Section>
  </>);
}

/* ── Trigger ─────────────────────────────────────────── */
function TriggerForm({ config, set }) {
  return (<>
    <Section title="Événement" icon="⚡">
      <Field label="Déclencheur">
        <Select value={config.event||""} onChange={v => set("event", v)} options={[
          { value: "contact.created",    label: "👤 Nouveau contact"     },
          { value: "contact.tagged",     label: "🏷 Tag ajouté"           },
          { value: "contact.updated",    label: "✏️ Contact modifié"      },
          { value: "email.opened",       label: "📬 Email ouvert"          },
          { value: "email.clicked",      label: "🖱 Lien cliqué"           },
          { value: "email.bounced",      label: "⚠️ Email bounced"         },
          { value: "form.submitted",     label: "📋 Formulaire soumis"    },
          { value: "purchase.made",      label: "💳 Achat effectué"        },
        ]}/>
      </Field>
      <Field label="Filtrer par liste">
        <Input value={config.listId||""} onChange={v => set("listId", v)} placeholder="ID de liste (optionnel)"/>
      </Field>
    </Section>
    <Section title="Comportement" icon="🔁">
      <Field label="Exécution">
        <Select value={config.runMode||"once"} onChange={v => set("runMode", v)} options={[
          { value: "once",   label: "Une seule fois par contact" },
          { value: "always", label: "À chaque déclenchement"    },
        ]}/>
      </Field>
      <Toggle label="Actif" checked={config.active??true} onChange={v => set("active", v)}/>
    </Section>
  </>);
}

/* ── Email ───────────────────────────────────────────── */
function EmailForm({ config, set }) {
  return (<>
    <Section title="Contenu" icon="✉️">
      <Field label="Sujet *">
        <Input value={config.subject||""} onChange={v => set("subject", v)} placeholder="Objet de l'email"/>
      </Field>
      <Field label="Template">
        <Select value={config.templateId||""} onChange={v => set("templateId", v)} options={[
          { value: "",              label: "— Sélectionner —"  },
          { value: "welcome",       label: "👋 Bienvenue"       },
          { value: "promo",         label: "🎁 Promotion"       },
          { value: "followup",      label: "🔁 Relance"         },
          { value: "newsletter",    label: "📰 Newsletter"      },
          { value: "transactional", label: "🧾 Transactionnel"  },
        ]}/>
      </Field>
    </Section>

    <Section title="Expéditeur" icon="👤">
      <Field label="Nom">
        <Input value={config.fromName||""} onChange={v => set("fromName", v)} placeholder="Votre nom"/>
      </Field>
      <Field label="Email">
        <Input value={config.fromEmail||""} onChange={v => set("fromEmail", v)} placeholder="vous@domaine.com" type="email"/>
      </Field>
    </Section>

    <Section title="Envoi" icon="📅">
      <Field label="Moment d'envoi">
        <Select value={config.sendTime||"immediate"} onChange={v => set("sendTime", v)} options={[
          { value: "immediate", label: "⚡ Immédiat"               },
          { value: "best_time", label: "🤖 Meilleur moment (IA)"   },
          { value: "scheduled", label: "🕘 Heure fixe"             },
        ]}/>
      </Field>
      {config.sendTime === "scheduled" && (
        <Field label="Heure">
          <Input type="time" value={config.scheduleTime||"09:00"} onChange={v => set("scheduleTime", v)}/>
        </Field>
      )}
    </Section>

    <Section title="Suivi" icon="📊">
      <Toggle label="Tracker les ouvertures" checked={config.trackOpens??true}   onChange={v => set("trackOpens", v)}/>
      <Toggle label="Tracker les clics"      checked={config.trackClicks??true}  onChange={v => set("trackClicks", v)}/>
      <Toggle label="Lien de désabonnement"  checked={config.unsubLink??true}    onChange={v => set("unsubLink", v)}/>
    </Section>
  </>);
}

/* ── Delay ───────────────────────────────────────────── */
function DelayForm({ config, set }) {
  return (<>
    <Section title="Type de délai" icon="⏱">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { value: "duration",   label: "Durée",  emoji: "⏳" },
          { value: "until_date", label: "Date",   emoji: "📅" },
          { value: "until_time", label: "Heure",  emoji: "🕘" },
        ].map(opt => (
          <button key={opt.value} onClick={() => set("delayType", opt.value)} style={{
            padding: "10px 6px", borderRadius: 10, textAlign: "center",
            border: `2px solid ${config.delayType === opt.value ? "#6366f1" : "#e2e8f0"}`,
            background: config.delayType === opt.value ? "#eff6ff" : "#fff",
            cursor: "pointer", transition: "all .15s",
          }}>
            <div style={{ fontSize: 20 }}>{opt.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: config.delayType === opt.value ? "#6366f1" : "#64748b", marginTop: 4 }}>{opt.label}</div>
          </button>
        ))}
      </div>
    </Section>

    {(!config.delayType || config.delayType === "duration") && (
      <Section title="Durée" icon="⌛">
        <div style={{ display: "flex", gap: 8 }}>
          <Field label="Valeur" style={{ flex: 1 }}>
            <Input type="number" value={config.duration||1} min={1} onChange={v => set("duration", +v)}/>
          </Field>
          <Field label="Unité" style={{ flex: 1 }}>
            <Select value={config.unit||"day"} onChange={v => set("unit", v)} options={[
              { value: "minute", label: "Minute(s)" },
              { value: "hour",   label: "Heure(s)"  },
              { value: "day",    label: "Jour(s)"   },
              { value: "week",   label: "Semaine(s)"},
            ]}/>
          </Field>
        </div>
        <Toggle label="Ignorer les weekends" checked={config.skipWeekends??false} onChange={v => set("skipWeekends", v)}/>
      </Section>
    )}

    {config.delayType === "until_date" && (
      <Section title="Date cible" icon="📅">
        <Field label="Date">
          <Input type="date" value={config.untilDate||""} onChange={v => set("untilDate", v)}/>
        </Field>
      </Section>
    )}

    {config.delayType === "until_time" && (
      <Section title="Heure cible" icon="🕘">
        <Field label="Heure">
          <Input type="time" value={config.untilTime||"09:00"} onChange={v => set("untilTime", v)}/>
        </Field>
        <Field label="Jours actifs">
          <DayPicker value={config.activeDays||[1,2,3,4,5]} onChange={v => set("activeDays", v)}/>
        </Field>
      </Section>
    )}
  </>);
}

/* ── Condition ───────────────────────────────────────── */
function ConditionForm({ config, set }) {
  return (<>
    <Section title="Logique" icon="🔀">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { value: "all", label: "Toutes (ET)", emoji: "🔗" },
          { value: "any", label: "Une suffit (OU)", emoji: "⚖️" },
        ].map(opt => (
          <button key={opt.value} onClick={() => set("logic", opt.value)} style={{
            padding: "10px 8px", borderRadius: 10, textAlign: "center",
            border: `2px solid ${config.logic === opt.value ? "#10b981" : "#e2e8f0"}`,
            background: config.logic === opt.value ? "#f0fdf4" : "#fff",
            cursor: "pointer", transition: "all .15s",
          }}>
            <div style={{ fontSize: 18 }}>{opt.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: config.logic === opt.value ? "#10b981" : "#64748b", marginTop: 4 }}>{opt.label}</div>
          </button>
        ))}
      </div>
    </Section>

    <Section title="Règle" icon="📋">
      <Field label="Champ">
        <Select value={config.field||""} onChange={v => set("field", v)} options={[
          { value: "",               label: "— Sélectionner —"     },
          { value: "email",          label: "📧 Email"              },
          { value: "tags",           label: "🏷 Tags"               },
          { value: "country",        label: "🌍 Pays"               },
          { value: "score",          label: "⭐ Score"              },
          { value: "last_activity",  label: "🕒 Dernière activité"  },
          { value: "custom_field",   label: "🔧 Champ personnalisé" },
        ]}/>
      </Field>

      {config.field === "custom_field" && (
        <Field label="Clé du champ">
          <Input value={config.customFieldKey||""} onChange={v => set("customFieldKey", v)} placeholder="ma_variable"/>
        </Field>
      )}

      <Field label="Opérateur">
        <Select value={config.operator||"eq"} onChange={v => set("operator", v)} options={[
          { value: "eq",          label: "est égal à"       },
          { value: "neq",         label: "est différent de" },
          { value: "contains",    label: "contient"         },
          { value: "not_contains",label: "ne contient pas"  },
          { value: "gt",          label: "supérieur à"      },
          { value: "lt",          label: "inférieur à"      },
          { value: "is_empty",    label: "est vide"         },
          { value: "is_not_empty",label: "n'est pas vide"   },
        ]}/>
      </Field>

      {!["is_empty","is_not_empty"].includes(config.operator) && (
        <Field label="Valeur">
          <Input value={config.value||""} onChange={v => set("value", v)} placeholder="Valeur attendue"/>
        </Field>
      )}
    </Section>

    <InfoBox color="#10b981">
      La sortie <b>verte</b> (gauche) = condition vraie · La sortie <b>rouge</b> (droite) = condition fausse
    </InfoBox>
  </>);
}

/* ── Tag ─────────────────────────────────────────────── */
function TagForm({ config, set }) {
  return (<>
    <Section title="Action" icon="🏷">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { value: "add",    label: "Ajouter",  emoji: "➕" },
          { value: "remove", label: "Retirer",  emoji: "➖" },
          { value: "toggle", label: "Basculer", emoji: "🔄" },
        ].map(opt => (
          <button key={opt.value} onClick={() => set("action", opt.value)} style={{
            padding: "10px 6px", borderRadius: 10, textAlign: "center",
            border: `2px solid ${config.action === opt.value ? "#8b5cf6" : "#e2e8f0"}`,
            background: config.action === opt.value ? "#faf5ff" : "#fff",
            cursor: "pointer", transition: "all .15s",
          }}>
            <div style={{ fontSize: 20 }}>{opt.emoji}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: config.action === opt.value ? "#8b5cf6" : "#64748b", marginTop: 4 }}>{opt.label}</div>
          </button>
        ))}
      </div>
    </Section>

    <Section title="Tags" icon="🏷">
      <Field label="Tag principal *">
        <Input value={config.tag||""} onChange={v => set("tag", v)} placeholder="ex: client-vip"/>
      </Field>
      <Field label="Tags supplémentaires">
        <Input value={config.extraTags||""} onChange={v => set("extraTags", v)} placeholder="tag1, tag2, tag3"/>
        <span style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Séparer par des virgules</span>
      </Field>
      <Toggle label="Notifier si tag déjà présent" checked={config.notifyDuplicate??false} onChange={v => set("notifyDuplicate", v)}/>
    </Section>
  </>);
}

/* ── Webhook ─────────────────────────────────────────── */
function WebhookForm({ config, set }) {
  return (<>
    <Section title="Requête" icon="🌐">
      <div style={{ display: "flex", gap: 8 }}>
        <Field label="Méthode" style={{ width: 90, flexShrink: 0 }}>
          <Select value={config.method||"POST"} onChange={v => set("method", v)} options={[
            { value: "POST",  label: "POST"  },
            { value: "GET",   label: "GET"   },
            { value: "PUT",   label: "PUT"   },
            { value: "PATCH", label: "PATCH" },
          ]}/>
        </Field>
        <Field label="URL *" style={{ flex: 1 }}>
          <Input value={config.url||""} onChange={v => set("url", v)} placeholder="https://..."/>
        </Field>
      </div>
    </Section>

    <Section title="Authentification" icon="🔐">
      <Field label="Type">
        <Select value={config.authType||"none"} onChange={v => set("authType", v)} options={[
          { value: "none",   label: "🔓 Aucune"          },
          { value: "bearer", label: "🔑 Bearer Token"    },
          { value: "basic",  label: "👤 Basic Auth"      },
          { value: "apikey", label: "🗝 API Key Header"  },
        ]}/>
      </Field>
      {config.authType === "bearer" && (
        <Field label="Token">
          <Input value={config.token||""} onChange={v => set("token", v)} placeholder="eyJ…" type="password"/>
        </Field>
      )}
      {config.authType === "basic" && (<>
        <Field label="Utilisateur">
          <Input value={config.basicUser||""} onChange={v => set("basicUser", v)} placeholder="username"/>
        </Field>
        <Field label="Mot de passe">
          <Input value={config.basicPass||""} type="password" onChange={v => set("basicPass", v)} placeholder="••••••"/>
        </Field>
      </>)}
      {config.authType === "apikey" && (<>
        <Field label="Nom de l'en-tête">
          <Input value={config.apiKeyHeader||""} onChange={v => set("apiKeyHeader", v)} placeholder="X-Api-Key"/>
        </Field>
        <Field label="Valeur">
          <Input value={config.apiKeyValue||""} type="password" onChange={v => set("apiKeyValue", v)} placeholder="••••••"/>
        </Field>
      </>)}
    </Section>

    <Section title="Corps de la requête" icon="📄">
      <textarea
        value={config.body||""}
        onChange={e => set("body", e.target.value)}
        placeholder={'{\n  "contact": "{{contact.id}}",\n  "email": "{{contact.email}}"\n}'}
        rows={5}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.6 }}
      />
    </Section>

    <Section title="Options" icon="⚙️">
      <Toggle label="Réessayer si erreur (3×)" checked={config.retry??true}        onChange={v => set("retry", v)}/>
      <Toggle label="Attendre la réponse"       checked={config.waitResponse??false} onChange={v => set("waitResponse", v)}/>
      {config.waitResponse && (
        <Field label="Timeout (secondes)">
          <Input type="number" value={config.timeout||30} min={1} max={120} onChange={v => set("timeout", +v)}/>
        </Field>
      )}
    </Section>
  </>);
}

/* ─────────────────────────────────────────────────────────
   Composants UI réutilisables
───────────────────────────────────────────────────────── */
function Section({ title, icon, children }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: 14, border: "1px solid #f1f5f9" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{icon}</span> {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, style = {} }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function InfoBox({ children, color = "#6366f1" }) {
  return (
    <div style={{
      background: `${color}10`, border: `1px solid ${color}30`,
      borderRadius: 8, padding: "8px 12px",
      display: "flex", gap: 8, alignItems: "flex-start",
    }}>
      <Info size={13} color={color} style={{ flexShrink: 0, marginTop: 1 }}/>
      <span style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>{children}</span>
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", style = {} }) {
  return (
    <input
      type={type} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...inputStyle, ...style }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, appearance: "none", paddingRight: 28, cursor: "pointer" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }}/>
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#475569" }}>{label}</span>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 99, flexShrink: 0,
          background: checked ? "#6366f1" : "#e2e8f0",
          position: "relative", transition: "background .2s", cursor: "pointer",
        }}
      >
        <div style={{
          position: "absolute", top: 3, left: checked ? 19 : 3,
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.25)",
        }}/>
      </div>
    </div>
  );
}

function DayPicker({ value = [], onChange }) {
  const days = [
    { i: 1, l: "L" }, { i: 2, l: "M" }, { i: 3, l: "M" },
    { i: 4, l: "J" }, { i: 5, l: "V" }, { i: 6, l: "S" }, { i: 7, l: "D" },
  ];
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {days.map(({ i, l }) => {
        const active = value.includes(i);
        return (
          <button key={i} onClick={() => onChange(active ? value.filter(d => d !== i) : [...value, i])} style={{
            flex: 1, height: 30, borderRadius: 6, border: "1.5px solid",
            fontSize: 10, fontWeight: 700, cursor: "pointer",
            background: active ? "#6366f1" : "#f8fafc",
            borderColor: active ? "#6366f1" : "#e2e8f0",
            color: active ? "#fff" : "#94a3b8",
            transition: "all .15s",
          }}>{l}</button>
        );
      })}
    </div>
  );
}

// Formulaire complet :
function AiAgentForm({ config, set }) {
  return (<>
    <Section title="Modèle" icon="🤖">
      <Field label="Fournisseur">
        <Select value={config.provider||"anthropic"} onChange={v => {
          set("provider", v);
          // reset model quand on change de fournisseur
          set("model", MODELS[v]?.[0]?.value || "");
        }} options={[
          { value: "anthropic", label: "Anthropic (Claude)" },
          { value: "openai",    label: "OpenAI (GPT)"       },
          { value: "mistral",   label: "Mistral AI"         },
        ]}/>
      </Field>
      <Field label="Modèle">
        <Select value={config.model||""} onChange={v => set("model", v)}
          options={MODELS[config.provider||"anthropic"] || []}/>
      </Field>
    </Section>

    <Section title="Tâche" icon="⚙️">
      <Field label="Type de tâche">
        <Select value={config.task||"generate"} onChange={v => set("task", v)} options={[
          { value: "generate",  label: "✍️ Générer du texte"          },
          { value: "summarize", label: "📝 Résumer un contenu"        },
          { value: "classify",  label: "🏷 Classifier / catégoriser"  },
          { value: "translate", label: "🌍 Traduire"                  },
          { value: "extract",   label: "🔍 Extraire des données"      },
          { value: "score",     label: "⭐ Scorer / évaluer"          },
          { value: "decide",    label: "🔀 Prendre une décision"      },
          { value: "custom",    label: "🛠 Prompt personnalisé"       },
        ]}/>
      </Field>
    </Section>

    <Section title="Prompt" icon="💬">
      {/* Prompt système */}
      <Field label="Prompt système (optionnel)">
        <textarea
          value={config.systemPrompt||""}
          onChange={e => set("systemPrompt", e.target.value)}
          placeholder="Tu es un assistant marketing spécialisé…"
          rows={2}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}
        />
      </Field>

      {/* Prompt utilisateur */}
      <Field label="Prompt *">
        <textarea
          value={config.prompt||""}
          onChange={e => set("prompt", e.target.value)}
          placeholder={PROMPT_PLACEHOLDERS[config.task] || "Décrivez la tâche…"}
          rows={5}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}
        />
      </Field>

      <InfoBox color="#6d28d9">
        Variables disponibles : <code style={{ fontSize: 10 }}>{"{{contact.email}}"}</code> <code style={{ fontSize: 10 }}>{"{{contact.first_name}}"}</code> <code style={{ fontSize: 10 }}>{"{{contact.tags}}"}</code>
      </InfoBox>
    </Section>

    <Section title="Sortie" icon="📤">
      <Field label="Stocker le résultat dans">
        <Input value={config.outputField||"ai_result"} onChange={v => set("outputField", v)} placeholder="ai_result"/>
      </Field>

      {/* Si tâche = decide → champ pour résultat binaire */}
      {config.task === "decide" && (<>
        <Field label="Valeur si OUI">
          <Input value={config.decideYes||"true"} onChange={v => set("decideYes", v)} placeholder="true"/>
        </Field>
        <Field label="Valeur si NON">
          <Input value={config.decideNo||"false"} onChange={v => set("decideNo", v)} placeholder="false"/>
        </Field>
        <InfoBox color="#6d28d9">La sortie <b>verte</b> (gauche) = OUI · La sortie <b>rouge</b> (droite) = NON</InfoBox>
      </>)}
    </Section>

    <Section title="Paramètres avancés" icon="🔧">
      <Field label={`Température — ${config.temperature ?? 0.7}`}>
        <input
          type="range" min={0} max={1} step={0.1}
          value={config.temperature ?? 0.7}
          onChange={e => set("temperature", +e.target.value)}
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}>
          <span>Précis</span><span>Créatif</span>
        </div>
      </Field>
      <Field label="Max tokens">
        <Input type="number" value={config.maxTokens||500} min={50} max={4000}
          onChange={v => set("maxTokens", +v)}/>
      </Field>
      <Toggle label="Réessayer si erreur" checked={config.retry??true} onChange={v => set("retry", v)}/>
      <Toggle label="Logger la réponse"   checked={config.logResponse??false} onChange={v => set("logResponse", v)}/>
    </Section>
  </>);
}


const ghostBtn = {
  width: 30, height: 30, borderRadius: 7,
  border: "none", background: "transparent", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  color: "#94a3b8", transition: "all .15s",
};

const labelStyle = {
  fontSize: 11, fontWeight: 600, color: "#64748b",
};

const inputStyle = {
  width: "100%", padding: "8px 10px",
  border: "1.5px solid #e2e8f0", borderRadius: 8,
  fontSize: 12, outline: "none",
  boxSizing: "border-box", background: "#fff",
  color: "#0f172a", transition: "border-color .15s",
  fontFamily: "'Inter', sans-serif",
};

const MODELS = {
  anthropic: [
    { value: "claude-sonnet-4-20250514",  label: "Claude Sonnet 4 (recommandé)" },
    { value: "claude-opus-4-20250514",    label: "Claude Opus 4 (puissant)"     },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku (rapide)"        },
  ],
  openai: [
    { value: "gpt-4o",       label: "GPT-4o (recommandé)" },
    { value: "gpt-4o-mini",  label: "GPT-4o Mini (rapide)"},
    { value: "gpt-4-turbo",  label: "GPT-4 Turbo"         },
  ],
  mistral: [
    { value: "mistral-large-latest",  label: "Mistral Large"  },
    { value: "mistral-small-latest",  label: "Mistral Small"  },
    { value: "open-mistral-7b",       label: "Mistral 7B"     },
  ],
};

const PROMPT_PLACEHOLDERS = {
  generate:  "Écris un email de bienvenue pour {{contact.first_name}} qui vient de s'inscrire…",
  summarize: "Résume les informations de ce contact : {{contact.notes}}…",
  classify:  "Classe ce contact dans une catégorie (lead chaud / froid / neutre) selon : {{contact.tags}}…",
  translate: "Traduis en anglais : {{contact.last_message}}…",
  extract:   "Extrait le numéro de commande depuis : {{contact.last_email}}…",
  score:     "Donne un score de 0 à 100 pour la probabilité d'achat de {{contact.first_name}}…",
  decide:    "Ce contact {{contact.email}} doit-il recevoir l'offre premium ? Réponds uniquement par OUI ou NON.",
  custom:    "Décrivez votre tâche personnalisée…",
};