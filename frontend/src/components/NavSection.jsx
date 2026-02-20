import { 
  FiHome, FiBarChart2, FiMail, FiSend, FiClock, FaLayerGroup, 
  FiZap, FiRepeat, FiTrendingUp, FiUsers, FiList, FiEdit3, 
  FiSlash, FiFileText, FiPieChart, FiCode, FiKey, FiGlobe, 
  FiServer, FiLink, FiSettings, FiTarget, FiActivity, 
  FiShield, FiEye, FiThermometer, FiMessageSquare, FiCheckCircle, 
  FiGitBranch, FiEdit, FiBrain, FiHeart, FiMap, FiSmartphone,
  FiMonitor, FiFilter, FiAward, FiDatabase, FiUpload,
  FiDownload, FiLock, FiUserCheck, FiAlertCircle, FiBook,
  FiLifeBuoy, FiPackage, FiTool, FiCreditCard
} from "react-icons/fi";

const NAV_SECTIONS = [
  // ==================== GÉNÉRAL ====================
  {
    title: "Général",
    icon: FiHome,
    items: [
      { 
        key: "overview", 
        icon: FiHome, 
        label: "Vue d'ensemble",
        description: "Tableau de bord principal",
        badge: null,
        plan: "free"
      },
      { 
        key: "analytics", 
        icon: FiBarChart2, 
        label: "Analytics",
        description: "Statistiques détaillées",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "reports", 
        icon: FiPieChart, 
        label: "Rapports",
        description: "Rapports personnalisés",
        badge: "Business",
        plan: "business"
      },
    ]
  },

  // ==================== ENVOI D'EMAILS ====================
  {
    title: "Envoi d'emails",
    icon: FiMail,
    items: [
      { 
        key: "bulk", 
        icon: FiMail, 
        label: "Envoi en masse",
        description: "Envoi groupé d'emails",
        badge: null,
        plan: "free"
      },
      { 
        key: "campaigns", 
        icon: FiSend, 
        label: "Campagnes",
        description: "Campagnes marketing",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "transactional", 
        icon: FiTarget, 
        label: "Transactionnels",
        description: "Emails automatiques",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "scheduling", 
        icon: FiClock, 
        label: "Planification",
        description: "Programmer des envois",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "templates", 
        icon: FaLayerGroup, 
        label: "Templates",
        description: "Bibliothèque de templates",
        badge: null,
        plan: "free"
      },
      { 
        key: "email_builder", 
        icon: FiEdit, 
        label: "Éditeur visuel",
        description: "Créer des emails sans code",
        badge: "Pro",
        plan: "pro"
      },
    ]
  },

  // ==================== AUTOMATISATION ====================
  {
    title: "Automatisation",
    icon: FiZap,
    items: [
      { 
        key: "automation", 
        icon: FiZap, 
        label: "Workflows",
        description: "Automatisations avancées",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "sequences", 
        icon: FiRepeat, 
        label: "Séquences",
        description: "Séquences d'emails",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "drip", 
        icon: FiActivity, 
        label: "Drip Campaigns",
        description: "Campagnes goutte-à-goutte",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "triggers", 
        icon: FiTarget, 
        label: "Déclencheurs",
        description: "Actions automatiques",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "ab_testing", 
        icon: FiTrendingUp, 
        label: "Tests A/B",
        description: "Optimisation des envois",
        badge: "Pro",
        plan: "pro"
      },
    ]
  },

  // ==================== CONTACTS & AUDIENCES ====================
  {
    title: "Contacts & Audiences",
    icon: FiUsers,
    items: [
      { 
        key: "contacts", 
        icon: FiUsers, 
        label: "Contacts",
        description: "Carnet d'adresses",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "lists", 
        icon: FiList, 
        label: "Listes",
        description: "Segmentation des contacts",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "segments", 
        icon: FiFilter, 
        label: "Segments",
        description: "Segments dynamiques",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "forms", 
        icon: FiEdit3, 
        label: "Formulaires",
        description: "Formulaires d'inscription",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "import_export", 
        icon: FiUpload, 
        label: "Import/Export",
        description: "Importer des contacts",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "suppression", 
        icon: FiSlash, 
        label: "Liste noire",
        description: "Emails à exclure",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "unsubscribe", 
        icon: FiUserCheck, 
        label: "Désabonnements",
        description: "Gestion opt-out",
        badge: null,
        plan: "free"
      },
    ]
  },

  // ==================== SUIVI & ANALYSE ====================
  {
    title: "Suivi & Analyse",
    icon: FiActivity,
    items: [
      { 
        key: "logs", 
        icon: FiFileText, 
        label: "Historique",
        description: "Logs des envois",
        badge: null,
        plan: "free"
      },
      { 
        key: "engagement", 
        icon: FiHeart, 
        label: "Engagement",
        description: "Score d'engagement",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "heatmaps", 
        icon: FiMap, 
        label: "Cartes de chaleur",
        description: "Zones de clic",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "geo_analytics", 
        icon: FiGlobe, 
        label: "Analyse géographique",
        description: "Localisation des lecteurs",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "device_analytics", 
        icon: FiSmartphone, 
        label: "Analyse par appareil",
        description: "Desktop vs Mobile",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "webhooks", 
        icon: FiCode, 
        label: "Webhooks",
        description: "Événements en temps réel",
        badge: "Pro",
        plan: "pro"
      },
    ]
  },

  // ==================== DÉLIVRABILITÉ ====================
  {
    title: "Délivrabilité",
    icon: FiShield,
    items: [
      { 
        key: "domains", 
        icon: FiGlobe, 
        label: "Domaines",
        description: "Configuration DNS",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "sender_auth", 
        icon: FiShield, 
        label: "Authentification",
        description: "SPF, DKIM, DMARC",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "reputation", 
        icon: FiAward, 
        label: "Réputation",
        description: "Score d'expéditeur",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "spam_check", 
        icon: FiAlertCircle, 
        label: "Test anti-spam",
        description: "Vérification spam",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "preview", 
        icon: FiEye, 
        label: "Aperçu inbox",
        description: "Rendu multi-clients",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "ip_warming", 
        icon: FiThermometer, 
        label: "IP Warming",
        description: "Réchauffement IP dédiée",
        badge: "Enterprise",
        plan: "enterprise"
      },
      { 
        key: "bounce_management", 
        icon: FiAlertCircle, 
        label: "Gestion rebonds",
        description: "Bounces automatiques",
        badge: "Pro",
        plan: "pro"
      },
    ]
  },

  // ==================== IA & INTELLIGENCE ====================
  {
    title: "IA & Intelligence",
    icon: FiBrain,
    badge: "Nouveau",
    items: [
      { 
        key: "ai_writer", 
        icon: FiEdit, 
        label: "Rédacteur IA",
        description: "Génération de contenu",
        badge: "Beta",
        plan: "pro"
      },
      { 
        key: "ai_subject", 
        icon: FiBrain, 
        label: "Optimisation sujet",
        description: "IA pour les sujets",
        badge: "Beta",
        plan: "pro"
      },
      { 
        key: "smart_send", 
        icon: FiClock, 
        label: "Envoi intelligent",
        description: "Meilleur moment d'envoi",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "sentiment", 
        icon: FiHeart, 
        label: "Analyse sentiment",
        description: "Tonalité du contenu",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "predictive", 
        icon: FiTrendingUp, 
        label: "Analytics prédictive",
        description: "Prédictions IA",
        badge: "Enterprise",
        plan: "enterprise"
      },
    ]
  },

  // ==================== INTÉGRATIONS & API ====================
  {
    title: "Intégrations & API",
    icon: FiLink,
    items: [
      { 
        key: "apikeys", 
        icon: FiKey, 
        label: "Clés API",
        description: "Gestion des API keys",
        badge: null,
        plan: "free"
      },
      { 
        key: "api_docs", 
        icon: FiBook, 
        label: "Documentation API",
        description: "Guide développeur",
        badge: null,
        plan: "free"
      },
      { 
        key: "smtp", 
        icon: FiServer, 
        label: "SMTP",
        description: "Configuration SMTP",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "integrations", 
        icon: FiLink, 
        label: "Intégrations",
        description: "Zapier, Make, etc.",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "sdk", 
        icon: FiPackage, 
        label: "SDK & Libraries",
        description: "Bibliothèques code",
        badge: "Pro",
        plan: "pro"
      },
    ]
  },

  // ==================== COLLABORATION ====================
  {
    title: "Collaboration",
    icon: FiUsers,
    items: [
      { 
        key: "team", 
        icon: FiUsers, 
        label: "Équipe",
        description: "Gestion des membres",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "permissions", 
        icon: FiLock, 
        label: "Permissions",
        description: "Rôles et accès",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "comments", 
        icon: FiMessageSquare, 
        label: "Commentaires",
        description: "Collaboration en équipe",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "approvals", 
        icon: FiCheckCircle, 
        label: "Approbations",
        description: "Workflow validation",
        badge: "Enterprise",
        plan: "enterprise"
      },
      { 
        key: "versions", 
        icon: FiGitBranch, 
        label: "Versions",
        description: "Historique des versions",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "activity_log", 
        icon: FiActivity, 
        label: "Journal d'activité",
        description: "Historique des actions",
        badge: "Business",
        plan: "business"
      },
    ]
  },

  // ==================== CONFORMITÉ & SÉCURITÉ ====================
  {
    title: "Conformité & Sécurité",
    icon: FiShield,
    items: [
      { 
        key: "gdpr", 
        icon: FiShield, 
        label: "RGPD",
        description: "Conformité RGPD",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "consent", 
        icon: FiUserCheck, 
        label: "Gestion consentements",
        description: "Opt-in/Opt-out",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "data_export", 
        icon: FiDownload, 
        label: "Export de données",
        description: "Export RGPD",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "two_factor", 
        icon: FiLock, 
        label: "Authentification 2FA",
        description: "Sécurité renforcée",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "audit_log", 
        icon: FiFileText, 
        label: "Journal d'audit",
        description: "Traçabilité complète",
        badge: "Enterprise",
        plan: "enterprise"
      },
      { 
        key: "privacy", 
        icon: FiShield, 
        label: "Confidentialité",
        description: "Paramètres de vie privée",
        badge: "Pro",
        plan: "pro"
      },
    ]
  },

  // ==================== SUPPORT & RESSOURCES ====================
  {
    title: "Support & Ressources",
    icon: FiLifeBuoy,
    items: [
      { 
        key: "help_center", 
        icon: FiLifeBuoy, 
        label: "Centre d'aide",
        description: "FAQ et guides",
        badge: null,
        plan: "free"
      },
      { 
        key: "tutorials", 
        icon: FiMonitor, 
        label: "Tutoriels",
        description: "Vidéos explicatives",
        badge: null,
        plan: "free"
      },
      { 
        key: "knowledge_base", 
        icon: FiBook, 
        label: "Base de connaissances",
        description: "Documentation complète",
        badge: null,
        plan: "free"
      },
      { 
        key: "support_tickets", 
        icon: FiMessageSquare, 
        label: "Tickets support",
        description: "Support technique",
        badge: "Pro",
        plan: "pro"
      },
      { 
        key: "community", 
        icon: FiUsers, 
        label: "Communauté",
        description: "Forum utilisateurs",
        badge: null,
        plan: "free"
      },
    ]
  },

  // ==================== PARAMÈTRES & COMPTE ====================
  {
    title: "Paramètres & Compte",
    icon: FiSettings,
    items: [
      { 
        key: "settings", 
        icon: FiSettings, 
        label: "Paramètres",
        description: "Configuration du compte",
        badge: null,
        plan: "free"
      },
      { 
        key: "billing", 
        icon: FiCreditCard, 
        label: "Facturation",
        description: "Abonnement et paiements",
        badge: null,
        plan: "free"
      },
      { 
        key: "usage", 
        icon: FiBarChart2, 
        label: "Utilisation",
        description: "Consommation et quotas",
        badge: null,
        plan: "free"
      },
      { 
        key: "brand_kit", 
        icon: FiTool, 
        label: "Kit de marque",
        description: "Logos et couleurs",
        badge: "Business",
        plan: "business"
      },
      { 
        key: "notifications", 
        icon: FiAlertCircle, 
        label: "Notifications",
        description: "Alertes et rappels",
        badge: null,
        plan: "free"
      },
    ]
  },
];

export default NAV_SECTIONS;