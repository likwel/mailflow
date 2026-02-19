// =====================================================
// routes/dashboard.js — Routes admin du dashboard
// =====================================================
const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { hashKey } = require("../middleware/apiKeyAuth");
const { checkQuota, getPlanLimits } = require("../utils/planLimits");
const transporter = require("../config/smtp");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const { appendFooter } = require("../utils/footerMail");

const dashRouter = express.Router();
dashRouter.use(authMiddleware);

// ─── GET /dashboard/stats ─────────────────────────────
// GET /dashboard/stats
dashRouter.get("/stats", async (req, res) => {
  const { user } = req;

  try {
    const [sent, failed, templates, templatesPersonal, templatesSystem, apiKeys, apiKeysActive, sentThisMonth] = await Promise.all([
      // Emails envoyés (total)
      prisma.emailLog.count({ where: { userId: user.id, status: "SENT" } }),
      
      // Emails échoués (total)
      prisma.emailLog.count({ where: { userId: user.id, status: { in: ["FAILED", "BOUNCED"] } } }),
      
      // Templates (total)
      prisma.template.count({ where: { OR: [{ userId: user.id }, { type: "SYSTEM" }] } }),
      
      // Templates personnels
      prisma.template.count({ where: { userId: user.id, type: "PERSONAL" } }),
      
      // Templates système
      prisma.template.count({ where: { type: "SYSTEM" } }),
      
      // API Keys (total)
      prisma.apiKey.count({ where: { userId: user.id } }),
      
      // API Keys actives
      prisma.apiKey.count({ where: { userId: user.id, isActive: true } }),
      
      // Emails envoyés ce mois
      prisma.emailLog.count({
        where: {
          userId: user.id,
          status: "SENT",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Quota selon le plan
    const quotas = { FREE: 100, PRO: 5000, BUSINESS: 50000 };
    const quota = quotas[user.plan] || 100;

    res.json({
      sent,
      failed,
      templates,
      templatesPersonal,
      templatesSystem,
      apiKeys,
      apiKeysActive,
      sentThisMonth,
      quota,
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des stats" });
  }
});

// ─── GET /dashboard/logs ──────────────────────────────
dashRouter.get("/logs", async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const where = { userId: req.user.id };
  if (status) where.status = status;

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.emailLog.count({ where }),
  ]);

  res.json({ logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// ─── API Keys CRUD ────────────────────────────────────

// GET /dashboard/apikeys
dashRouter.get("/apikeys", async (req, res) => {
  const keys = await prisma.apiKey.findMany({
    where: { userId: req.user.id },
    select: { id: true, name: true, keyPrefix: true, isActive: true, lastUsed: true, createdAt: true },
  });
  res.json(keys);
});

// POST /dashboard/apikeys
dashRouter.post("/apikeys", async (req, res) => {
  const { name } = req.body;
  const { user } = req;
  const PLAN_LIMITS = await getPlanLimits(user.id)
  const limit = PLAN_LIMITS.apiKeysMax;

  const count = await prisma.apiKey.count({ where: { userId: user.id } });
  if (count >= limit) {
    return res.status(403).json({ error: `Limite de ${limit} API keys pour votre plan` });
  }

  const rawKey = `mfk_live_${crypto.randomBytes(24).toString("base64url")}`;
  const hashed = hashKey(rawKey);
  const prefix = rawKey.slice(0, 16) + "...";

  const apiKey = await prisma.apiKey.create({
    data: { userId: user.id, name, key: hashed, keyPrefix: prefix },
  });

  // Retourne la clé brute UNE SEULE FOIS
  res.json({ ...apiKey, rawKey });
});

// PATCH /dashboard/apikeys/:id — Activer/Désactiver
dashRouter.patch("/apikeys/:id", async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!apiKey) {
      return res.status(404).json({ error: "Clé non trouvée" });
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

// PUT /dashboard/apikeys/:id
dashRouter.put("/apikeys/:id", async (req, res) => {
  const { isActive, name } = req.body;
  const updated = await prisma.apiKey.update({
    where: { id: req.params.id, userId: req.user.id },
    data: { ...(isActive !== undefined && { isActive }), ...(name && { name }) },
  });
  res.json(updated);
});

// DELETE /dashboard/apikeys/:id
dashRouter.delete("/apikeys/:id", async (req, res) => {
  await prisma.apiKey.delete({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

// ─── Bulk send ────────────────────────────────────────
dashRouter.post("/send-bulk", async (req, res) => {
  let { recipients, subject, html, text, templateId } = req.body;
  const { user } = req;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "Liste de destinataires requise" });
  }

  const quota = await checkQuota(user);
  if (user.emailsUsed + recipients.length > quota.limit.emailsPerMonth) {
    return res.status(429).json({ error: "Quota dépassé", remaining: quota.remaining });
  }

  const bulkGroupId = crypto.randomBytes(8).toString("hex");
  const results = [];

  html = appendFooter(html, quota);

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: (user.name ? user.name : 'MailFlow') + '' + process.env.SMTP_FROM,
        to: recipient,
        subject,
        html,
        text,
      });

      await prisma.emailLog.create({
        data: {
          userId: user.id,
          templateId: templateId || null,
          to: [recipient],
          subject,
          htmlBody: html || "",
          textBody: text,
          status: "SENT",
          sentAt: new Date(),
          isBulk: true,
          bulkGroupId,
        },
      });
      results.push({ to: recipient, status: "SENT" });
    } catch (e) {
      await prisma.emailLog.create({
        data: {
          userId: user.id,
          to: [recipient],
          subject,
          htmlBody: html || "",
          status: "FAILED",
          error: e.message,
          isBulk: true,
          bulkGroupId,
        },
      });
      results.push({ to: recipient, status: "FAILED", error: e.message });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailsUsed: { increment: recipients.length } },
  });

  res.json({ bulkGroupId, results, total: recipients.length });
});

// POST /dashboard/send
dashRouter.post("/send", async (req, res) => {
  const { user } = req;
  let { to, subject, html, text, varValues } = req.body;

  // ✅ Si varValues est une string, la parser en JSON
  if (typeof varValues === "string") {
    try { varValues = JSON.parse(varValues); }
    catch { varValues = {}; }
  }

  // ✅ Si ce n'est pas un objet plat, reset
  if (!varValues || typeof varValues !== "object" || Array.isArray(varValues)) {
    varValues = {};
  }

  if (!to || !Array.isArray(to) || to.length === 0)
    return res.status(400).json({ error: "Destinataires requis" });
  if (!subject)
    return res.status(400).json({ error: "Sujet requis" });
  if (!html && !text)
    return res.status(400).json({ error: "Corps de l'email requis" });

  // ── Quota ──────────────────────────────────────────
  const quota = await checkQuota(user);
  if (user.emailsUsed + to.length > quota.limit) {
    return res.status(429).json({
      error: "Quota mensuel dépassé",
      used: user.emailsUsed,
      limit: quota.limit,
    });
  }

  // ── Charger les données contacts pour personnalisation ──
  // On récupère tous les contacts correspondant aux emails destinataires
  const contactsData = await prisma.contact.findMany({
    where: { userId: user.id, email: { in: to } },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      company: true,
      tags: true,
      customFields: true,
    },
  });

  // Index email → données contact pour accès rapide
  const contactMap = {};
  contactsData.forEach(c => { contactMap[c.email.toLowerCase()] = c; });

  // ── Fonction de remplacement des variables ──────────
  // ✅ resolveVars — variable vide si aucune source ne la fournit
  function resolveVars(template, contact, defaults = {}) {
    if (!template) return template;
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const c      = contact || {};
      const custom = (c.customFields && typeof c.customFields === "object") ? c.customFields : {};
      const value  =
        c[key]       ??  // 1. champ contact (firstName, company…)
        custom[key]  ??  // 2. customFields JSON
        defaults[key]??  // 3. varValues envoyés par l'UI
        "";              // 4. variable inconnue → chaîne vide

      return value;
    });
  }

  // ── Envoi ───────────────────────────────────────────
  const bulkGroupId = to.length > 1 ? crypto.randomBytes(8).toString("hex") : null;
  const fromName = user.name ? `${user.name}` : "MailFlow";
  const fromAddr = process.env.SMTP_FROM;

  try {
    const logs = [];

    for (const recipient of to) {
      const contact = contactMap[recipient.toLowerCase()] || null;

      // Personnalisation du sujet et du corps pour ce destinataire
      const personalSubject = resolveVars(subject, contact, varValues);
      const personalHtml    = resolveVars(appendFooter(html, quota), contact, varValues);
      const personalText    = text ? resolveVars(text, contact, varValues) : undefined;

      try {
        await transporter.sendMail({
          from: `${fromName} <${fromAddr}>`,
          to: recipient,
          subject: personalSubject,
          html: personalHtml,
          ...(personalText ? { text: personalText } : {}),
        });

        const log = await prisma.emailLog.create({
          data: {
            userId: user.id,
            to: [recipient],
            subject: personalSubject,
            htmlBody: personalHtml,
            textBody: personalText || null,
            status: "SENT",
            sentAt: new Date(),
            isBulk: to.length > 1,
            bulkGroupId,
          },
        });
        logs.push(log);

      } catch (sendErr) {
        // Un échec sur un destinataire n'interrompt pas les autres
        console.error(`❌ Échec envoi à ${recipient}:`, sendErr.message);
        await prisma.emailLog.create({
          data: {
            userId: user.id,
            to: [recipient],
            subject: personalSubject,
            htmlBody: personalHtml || "",
            status: "FAILED",
            error: sendErr.message,
            isBulk: to.length > 1,
            bulkGroupId,
          },
        });
        logs.push({ failed: true, to: recipient });
      }
    }

    // Incrémenter le quota uniquement pour les envois réussis
    const sentCount = logs.filter(l => !l.failed).length;
    if (sentCount > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailsUsed: { increment: sentCount } },
      });
    }

    const failedCount = logs.filter(l => l.failed).length;

    res.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      total: to.length,
      logs: logs
        .filter(l => !l.failed)
        .map(l => ({ id: l.id, to: l.to, status: l.status })),
    });

  } catch (e) {
    console.error("❌ Erreur globale envoi:", e.message);
    await prisma.emailLog.create({
      data: {
        userId: user.id,
        to,
        subject,
        htmlBody: html || "",
        status: "FAILED",
        error: e.message,
        isBulk: to.length > 1,
        bulkGroupId,
      },
    });
    res.status(500).json({ error: "Échec de l'envoi", details: e.message });
  }
});

// GET /dashboard/templates
dashRouter.get("/templates", async (req, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { type: "SYSTEM" },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement" });
  }
});

// POST /dashboard/templates
dashRouter.post("/templates", async (req, res) => {
  const { name, subject, html } = req.body;

  const { user } = req;
  const PLAN_LIMITS = await getPlanLimits(user.id)
  const limit = PLAN_LIMITS.apiKeysMax;
  
  if (!name || !subject || !html) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {

    const templatesCount = await prisma.template.count({
      where: {
        AND: [
          { userId: req.user.id },
          { type: "PERSONAL" },
        ],
      },
    });

    if(templatesCount >= limit){
      return res.status(403).json({ error: `Limité de ${limit} templates pour votre plan actuel` });
    }

    const template = await prisma.template.create({
      data: {
        userId: req.user.id,
        name,
        subject,
        htmlBody: html,
        type: "PERSONAL",
      },
    });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

// PUT /dashboard/templates/:id
dashRouter.put("/templates/:id", async (req, res) => {
  const { id } = req.params;
  const { name, subject, html } = req.body;

  try {
    const existing = await prisma.template.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Template non trouvé" });
    }

    if (existing.type === "SYSTEM") {
      return res.status(403).json({ error: "Les templates système ne peuvent pas être modifiés" });
    }

    const updated = await prisma.template.update({
      where: { id },
      data: { name, subject, htmlBody: html },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la modification" });
  }
});

// DELETE /dashboard/templates/:id
dashRouter.delete("/templates/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.template.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Template non trouvé" });
    }

    if (existing.type === "SYSTEM") {
      return res.status(403).json({ error: "Les templates système ne peuvent pas être supprimés" });
    }

    await prisma.template.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// GET /dashboard/settings
dashRouter.get("/settings", async (req, res) => {
  // Pour l'instant retourne des valeurs vides, tu peux stocker ces settings dans la DB plus tard
  res.json({
    smtp: { host: "", port: "", user: "", pass: "" },
    notifications: { failed: true, bounced: true, weekly: false },
  });
});

// PUT /dashboard/profile
dashRouter.put("/profile", async (req, res) => {
  const { name } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name },
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// PUT /dashboard/smtp
dashRouter.put("/smtp", async (req, res) => {
  // Stocker dans DB ou fichier de config selon ton besoin
  res.json({ success: true });
});

// PUT /dashboard/notifications
dashRouter.put("/notifications", async (req, res) => {
  // Stocker dans DB selon ton besoin
  res.json({ success: true });
});

// DELETE /dashboard/account
dashRouter.delete("/account", async (req, res) => {
  try {
    // Supprimer toutes les données liées
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

module.exports = dashRouter;