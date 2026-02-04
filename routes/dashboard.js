// =====================================================
// routes/dashboard.js — Routes admin du dashboard
// =====================================================
const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { hashKey } = require("../middleware/apiKeyAuth");
const { PLAN_LIMITS, checkQuota } = require("../utils/planLimits");
const transporter = require("../config/smtp");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

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
  const limit = PLAN_LIMITS[user.plan].apiKeysMax;

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
  const { recipients, subject, html, text, templateId } = req.body;
  const { user } = req;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: "Liste de destinataires requise" });
  }

  const quota = checkQuota(user);
  if (user.emailsUsed + recipients.length > quota.limit.emailsPerMonth) {
    return res.status(429).json({ error: "Quota dépassé", remaining: quota.remaining });
  }

  const bulkGroupId = crypto.randomBytes(8).toString("hex");
  const results = [];

  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
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
  const { to, subject, html, text } = req.body;

  if (!to || !Array.isArray(to) || to.length === 0)
    return res.status(400).json({ error: "Destinataires requis" });
  if (!subject)
    return res.status(400).json({ error: "Sujet requis" });
  if (!html && !text)
    return res.status(400).json({ error: "Corps de l'email requis" });

  // Check quota
  const quota = checkQuota(user);
  if (user.emailsUsed + to.length > quota.limit) {
    return res.status(429).json({ error: "Quota mensuel dépassé", used: user.emailsUsed, limit: quota.limit });
  }

  const bulkGroupId = to.length > 1 ? crypto.randomBytes(8).toString("hex") : null;

  try {
    const logs = [];
    for (const recipient of to) {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: recipient,
        subject,
        html,
        text,
      });

      const log = await prisma.emailLog.create({
        data: {
          userId: user.id,
          to: [recipient],
          subject,
          htmlBody: html || "",
          textBody: text || null,
          status: "SENT",
          sentAt: new Date(),
          isBulk: to.length > 1,
          bulkGroupId,
        },
      });
      logs.push(log);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: { increment: to.length } },
    });

    res.json({ success: true, sent: to.length, logs: logs.map(l => ({ id: l.id, to: l.to, status: l.status })) });
  } catch (e) {
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
  
  if (!name || !subject || !html) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  try {
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