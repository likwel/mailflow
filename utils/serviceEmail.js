const { checkQuota } = require("./planLimits");
const { appendFooter } = require("./footerMail");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const transporter = require("../config/smtp");

/**
 * sendEmail({ user, to, subject, html, text, templateId, variables, fromName, fromEmail, cc, bcc })
 *
 * @param {object} user        - Objet user Prisma (avec emailsUsed, plan…)
 * @param {string[]} to        - Tableau d'adresses destinataires
 * @param {string} [subject]   - Sujet (ignoré si templateId)
 * @param {string} [html]      - Corps HTML (ignoré si templateId)
 * @param {string} [text]      - Corps texte (ignoré si templateId)
 * @param {string} [templateId]- ID template DB (prioritaire sur html/text)
 * @param {object} [variables] - Variables {{key}} à remplacer dans le template
 * @param {string} [fromName]  - Nom expéditeur
 * @param {string} [fromEmail] - Email expéditeur (non utilisé côté SMTP, cosmétique)
 * @param {string[]} [cc]
 * @param {string[]} [bcc]
 * @param {Array<{filename, path?, content?, contentType?}>} [attachments]
 * @returns {{ success, sent, logs }}
 */
async function sendEmail({
  user,
  to,
  subject,
  html,
  text,
  templateId,
  variables,
  fromName,
  fromEmail,
  cc  = [],
  bcc = [],
  attachments = [],   // [{ filename, path?, content?, contentType? }]
}) {
  if (!Array.isArray(to) || to.length === 0) {
    throw new Error("Le champ 'to' est requis (tableau non vide)");
  }

  // ── Vérification quota ───────────────────────────────────────────────────
  let updatedUser = user;
  const quota = await checkQuota(user);
  if (quota.needsReset) {
    updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: 0, emailsReset: new Date() },
    });
  }
  if (updatedUser.emailsUsed + to.length > (quota.limit?.emailsPerMonth || 100)) {
    throw new Error(
      `Quota mensuel dépassé (utilisé: ${updatedUser.emailsUsed}, limite: ${quota.limit?.emailsPerMonth})`
    );
  }

  // ── Résolution du contenu ────────────────────────────────────────────────
  let finalSubject = subject || "";
  let finalHtml    = html    || null;
  let finalText    = text    || null;

  if (templateId) {
    const template = await prisma.template.findFirst({
      where: { id: templateId, OR: [{ userId: user.id }, { type: "SYSTEM" }] },
    });
    if (!template) throw new Error(`Template introuvable : ${templateId}`);

    finalSubject = template.subject;
    finalHtml    = template.htmlBody;
    finalText    = template.textBody;

    if (variables && typeof variables === "object") {
      Object.entries(variables).forEach(([key, val]) => {
        const re = new RegExp(`{{${key}}}`, "g");
        finalSubject = finalSubject?.replace(re, val);
        finalHtml    = finalHtml?.replace(re, val);
        finalText    = finalText?.replace(re, val);
      });
    }
  } else if (!finalHtml && !finalText) {
    throw new Error("'html' ou 'text' requis si pas de templateId");
  }

  const bulkGroupId = to.length > 1 ? crypto.randomBytes(8).toString("hex") : null;
  finalHtml = appendFooter(finalHtml, quota);
  finalText = appendFooter(finalText, quota);

  // ── Envoi ────────────────────────────────────────────────────────────────
  const logs = [];
  try {
    for (const recipient of to) {
      await transporter.sendMail({
        from: (fromName || "MailFlow") + " " + process.env.SMTP_FROM,
        to: recipient,
        cc,
        bcc,
        subject: finalSubject,
        html:        finalHtml,
        text:        finalText,
        attachments: attachments.length ? attachments : undefined,
      });

      const log = await prisma.emailLog.create({
        data: {
          userId:     user.id,
          templateId: templateId || null,
          to:         [recipient],
          cc,
          bcc,
          subject:    finalSubject,
          htmlBody:   finalHtml || "",
          textBody:   finalText,
          status:     "SENT",
          sentAt:     new Date(),
          isBulk:     to.length > 1,
          bulkGroupId,
        },
      });
      logs.push(log);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailsUsed: { increment: to.length } },
    });

    return {
      success: true,
      sent:    to.length,
      logs:    logs.map(l => ({ id: l.id, to: l.to, status: l.status })),
    };

  } catch (err) {
    await prisma.emailLog.create({
      data: {
        userId:     user.id,
        templateId: templateId || null,
        to,
        subject:    finalSubject || "",
        htmlBody:   finalHtml    || "",
        status:     "FAILED",
        error:      err.message,
        isBulk:     to.length > 1,
        bulkGroupId,
      },
    });
    throw err; // remonter l'erreur à l'appelant
  }
}

module.exports = { sendEmail };