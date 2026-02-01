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

const dashRouter = express.Router();
dashRouter.use(authMiddleware);

// ─── GET /dashboard/stats ─────────────────────────────
dashRouter.get("/stats", async (req, res) => {
  const { id } = req.user;

  const [totalSent, totalFailed, recentEmails, apiKeys] = await Promise.all([
    prisma.emailLog.count({ where: { userId: id, status: "SENT" } }),
    prisma.emailLog.count({ where: { userId: id, status: "FAILED" } }),
    prisma.emailLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, to: true, subject: true, status: true, createdAt: true, isBulk: true },
    }),
    prisma.apiKey.findMany({ where: { userId: id } }),
  ]);

  const quota = checkQuota(req.user);

  res.json({ totalSent, totalFailed, recentEmails, apiKeys: apiKeys.length, quota });
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

  const rawKey = `sk_live_${crypto.randomBytes(24).toString("base64url")}`;
  const hashed = hashKey(rawKey);
  const prefix = rawKey.slice(0, 16) + "...";

  const apiKey = await prisma.apiKey.create({
    data: { userId: user.id, name, key: hashed, keyPrefix: prefix },
  });

  // Retourne la clé brute UNE SEULE FOIS
  res.json({ ...apiKey, rawKey });
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

module.exports = dashRouter;