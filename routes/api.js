// =====================================================
// routes/api.js — API publique (/api/v1/send)
// =====================================================
const express = require("express");
const { apiKeyAuth, hashKey } = require("../middleware/apiKeyAuth");
const { rateLimiter } = require("../middleware/rateLimiter");
const { checkQuota } = require("../utils/planLimits");
const { appendFooter } = require("../utils/footerMail");
const cors = require("cors");
const transporter = require("../config/smtp");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

const apiRouter = express.Router();

// Rate limit : 10 requêtes par minute par API key
apiRouter.use("/send", rateLimiter(10, 60 * 1000));
apiRouter.use("/send", apiKeyAuth);

// ─── POST /api/v1/send ────────────────────────────────
apiRouter.post("/send/interne", async (req, res) => {
  const { user } = req;
  const { to, cc, bcc, subject, html, text, templateId, variables, name, email } = req.body;

  // Validations
  if (!to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: "Le champ 'to' est requis (tableau)" });
  }
  if (!subject && !templateId) {
    return res.status(400).json({ error: "'subject' ou 'templateId' requis" });
  }

  // Vérifie le quota
  const quota = await checkQuota(user);
  let updatedUser = user;

  if (quota.needsReset) {
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: 0, emailsReset: new Date() },
    });
  }

  if (updatedUser.emailsUsed + to.length > (quota.limit?.emailsPerMonth || 100)) {
    return res.status(429).json({
      error: "Quota mensuel dépassé",
      plan: user.plan,
      used: updatedUser.emailsUsed,
      limit: quota.limit?.emailsPerMonth,
    });
  }

  // Si templateId, récupère le template et remplace les variables
  let finalSubject = subject;
  let finalHtml = html;
  let finalText = text;

  if (templateId) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, OR: [{ userId: user.id }, { type: "SYSTEM" }] },
    });
    if (!template) {
      return res.status(404).json({ error: "Template non trouvé" });
    }
    finalSubject = finalSubject || template.subject;
    finalHtml = template.htmlBody;
    finalText = template.textBody;

    // Remplace les variables {{variable}}
    if (variables && typeof variables === "object") {
      Object.entries(variables).forEach(([key, val]) => {
        finalHtml = finalHtml?.replace(new RegExp(`{{${key}}}`, "g"), val);
        finalText = finalText?.replace(new RegExp(`{{${key}}}`, "g"), val);
        finalSubject = finalSubject?.replace(new RegExp(`{{${key}}}`, "g"), val);
      });
    }
  }

  if (!finalHtml && !finalText) {
    return res.status(400).json({ error: "'html' ou 'text' requis" });
  }

  // Génère un bulkGroupId si plusieurs destinataires
  const bulkGroupId = to.length > 1 ? crypto.randomBytes(8).toString("hex") : null;

  finalHtml = appendFooter(finalHtml, user);

  try {
    const logs = [];

    for (const recipient of to) {

      // Envoie via Nodemailer
      await transporter.sendMail({
        // from: process.env.SMTP_FROM,
        from: (name ? name : 'MailFlow') + '' + process.env.SMTP_FROM,
        to: recipient,
        cc: cc || [],
        bcc: bcc || [],
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
      });

      // Log dans la DB
      const log = await prisma.emailLog.create({
        data: {
          userId: user.id,
          templateId: templateId || null,
          to: [recipient],
          cc: cc || [],
          bcc: bcc || [],
          subject: finalSubject,
          htmlBody: finalHtml || "",
          textBody: finalText,
          status: "SENT",
          sentAt: new Date(),
          isBulk: to.length > 1,
          bulkGroupId,
        },
      });
      logs.push(log);
    }

    // Met à jour le compteur
    await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: { increment: to.length } },
    });

    res.json({
      success: true,
      sent: to.length,
      logs: logs.map((l) => ({ id: l.id, to: l.to, status: l.status })),
    });
  } catch (e) {
    // Log l'erreur
    await prisma.emailLog.create({
      data: {
        userId: user.id,
        templateId: templateId || null,
        to,
        subject: finalSubject || "",
        htmlBody: finalHtml || "",
        status: "FAILED",
        error: e.message,
        isBulk: to.length > 1,
        bulkGroupId,
      },
    });

    res.status(500).json({ error: "Échec de l'envoi", details: e.message });
  }
});


// ─── POST /api/v1/send ────────────────────────────────
apiRouter.post("/send", cors({
  methods: ["POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-API-Key"],
  credentials: true,
}), async (req, res) => {

  const apiKey = req.headers["x-api-key"];
  if (!apiKey) return res.status(401).json({ error: "X-API-Key requis" });

  const apiKeyHashed = hashKey(apiKey);

  const keyRecord = await prisma.apiKey.findFirst({
    where: { key: apiKeyHashed },
    include: { user: true },
  });
  if (!keyRecord) return res.status(401).json({ error: "Clé API invalide" });

  if (keyRecord && !keyRecord.isActive) return res.status(401).json({ error: "Clé API inactive" });

  const user = keyRecord.user;
  if (!user) return res.status(401).json({ error: "Utilisateur invalide" });

  const { to, cc, bcc, subject, html, text, templateId, variables, name, email } = req.body;

  // Validation des destinataires
  if (!to || !Array.isArray(to) || to.length === 0) {
    return res.status(400).json({ error: "Le champ 'to' est requis (tableau)" });
  }

  // Vérification du quota
  let updatedUser = user;
  const quota = await checkQuota(user);
  if (quota.needsReset) {
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: 0, emailsReset: new Date() },
    });
  }
  if (updatedUser.emailsUsed + to.length > (quota.limit?.emailsPerMonth || 100)) {
    return res.status(429).json({
      error: "Quota mensuel dépassé",
      plan: user.plan,
      used: updatedUser.emailsUsed,
      limit: quota.limit?.emailsPerMonth,
    });
  }

  // Prépare le contenu final
  let finalSubject = subject || "";
  let finalHtml = html || null;
  let finalText = text || null;

  // Si templateId est fourni, utiliser le template (toujours prioritaire)
  if (templateId) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, OR: [{ userId: user.id }, { type: "SYSTEM" }] },
    });
    if (!template) return res.status(404).json({ error: "Template non trouvé" });

    finalSubject = template.subject;
    finalHtml = template.htmlBody;
    finalText = template.textBody;

    // Remplace les variables {{variable}}
    if (variables && typeof variables === "object") {
      Object.entries(variables).forEach(([key, val]) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        finalSubject = finalSubject?.replace(regex, val);
        finalHtml = finalHtml?.replace(regex, val);
        finalText = finalText?.replace(regex, val);
      });
    }
  } else {
    // Si pas de templateId, au moins un html ou text doit exister
    if (!finalHtml && !finalText) {
      return res.status(400).json({ error: "'html' ou 'text' requis si pas de templateId" });
    }
  }

  // Génère un bulkGroupId si plusieurs destinataires
  const bulkGroupId = to.length > 1 ? crypto.randomBytes(8).toString("hex") : null;

  finalHtml = appendFooter(finalHtml, user);
  finalText = appendFooter(finalText, user);

  try {
    const logs = [];

    for (const recipient of to) {
      // Envoi via Nodemailer
      await transporter.sendMail({
        from: (name ? name : 'MailFlow') + '' + process.env.SMTP_FROM,
        to: recipient,
        cc: cc || [],
        bcc: bcc || [],
        subject: finalSubject,
        html: finalHtml,
        text: finalText,
      });

      // Log dans la DB
      const log = await prisma.emailLog.create({
        data: {
          userId: user.id,
          templateId: templateId || null,
          to: [recipient],
          cc: cc || [],
          bcc: bcc || [],
          subject: finalSubject,
          htmlBody: finalHtml || "",
          textBody: finalText,
          status: "SENT",
          sentAt: new Date(),
          isBulk: to.length > 1,
          bulkGroupId,
        },
      });

      logs.push(log);
    }

    // Met à jour le compteur
    await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: { increment: to.length } },
    });

    return res.json({
      success: true,
      sent: to.length,
      logs: logs.map((l) => ({ id: l.id, to: l.to, status: l.status })),
    });

  } catch (e) {
    // Log l'erreur
    await prisma.emailLog.create({
      data: {
        userId: user.id,
        templateId: templateId || null,
        to,
        subject: finalSubject || "",
        htmlBody: finalHtml || "",
        status: "FAILED",
        error: e.message,
        isBulk: to.length > 1,
        bulkGroupId,
      },
    });

    return res.status(500).json({ error: "Échec de l'envoi", details: e.message });
  }
});

module.exports = apiRouter;