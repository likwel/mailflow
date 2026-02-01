// =====================================================
// routes/templates.js — CRUD Templates
// =====================================================
const express = require("express");
const templateRouter = express.Router();
const { authMiddleware } = require("../middleware/auth");
templateRouter.use(authMiddleware);

// GET
templateRouter.get("/", async (req, res) => {
  const templates = await prisma.template.findMany({
    where: { OR: [{ userId: req.user.id }, { type: "SYSTEM" }] },
    orderBy: { createdAt: "desc" },
  });
  res.json(templates);
});

// POST
templateRouter.post("/", async (req, res) => {
  const { name, subject, htmlBody, textBody } = req.body;
  const limit = PLAN_LIMITS[req.user.plan].templatesMax;

  const count = await prisma.template.count({ where: { userId: req.user.id } });
  if (count >= limit) {
    return res.status(403).json({ error: `Limite de ${limit} templates pour votre plan` });
  }

  const t = await prisma.template.create({
    data: { userId: req.user.id, name, subject, htmlBody, textBody, type: "PERSONAL" },
  });
  res.json(t);
});

// PUT
templateRouter.put("/:id", async (req, res) => {
  const { name, subject, htmlBody, textBody } = req.body;
  const t = await prisma.template.update({
    where: { id: req.params.id, userId: req.user.id },
    data: { name, subject, htmlBody, textBody },
  });
  res.json(t);
});

// DELETE
templateRouter.delete("/:id", async (req, res) => {
  await prisma.template.delete({ where: { id: req.params.id, userId: req.user.id } });
  res.json({ ok: true });
});

module.exports = templateRouter;