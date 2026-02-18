// routes/contactLists.js
// Correspond au modèle "List" dans ton schema.prisma
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require('../middleware/auth');

const prisma = new PrismaClient();
router.use(authMiddleware);

// ─── GET /contact-lists ────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const lists = await prisma.list.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { contacts: true } } },
    });
    res.json({ lists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur liste" });
  }
});

// ─── GET /contact-lists/:id ────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const list = await prisma.list.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        _count: { select: { contacts: true } },
        contacts: {
          include: { contact: true },
          orderBy: { addedAt: "desc" },
          take: 100,
        },
      },
    });
    if (!list) return res.status(404).json({ error: "Liste introuvable" });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "Erreur" });
  }
});

// ─── POST /contact-lists ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, description, isDefault = false } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nom requis" });

    const list = await prisma.list.create({
      data: {
        userId: req.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        isDefault,
      },
      include: { _count: { select: { contacts: true } } },
    });
    res.status(201).json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création" });
  }
});

// ─── PUT /contact-lists/:id ────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const list = await prisma.list.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!list) return res.status(404).json({ error: "Liste introuvable" });

    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: "Nom requis" });

    const updated = await prisma.list.update({
      where: { id: req.params.id },
      data: { name: name.trim(), description: description?.trim() || null },
      include: { _count: { select: { contacts: true } } },
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erreur mise à jour" });
  }
});

// ─── DELETE /contact-lists/:id ─────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const list = await prisma.list.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!list) return res.status(404).json({ error: "Liste introuvable" });
    if (list.isDefault) return res.status(400).json({ error: "Impossible de supprimer la liste par défaut" });

    await prisma.list.delete({ where: { id: req.params.id } });
    res.json({ message: "Liste supprimée" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// ─── POST /contact-lists/:id/contacts ──────────────────────────────────────────
// Ajouter des contacts à une liste
router.post("/:id/contacts", async (req, res) => {
  try {
    const list = await prisma.list.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!list) return res.status(404).json({ error: "Liste introuvable" });

    const { contactIds = [] } = req.body;
    if (!contactIds.length) return res.status(400).json({ error: "Aucun contact fourni" });

    await prisma.contactListMember.createMany({
      data: contactIds.map(contactId => ({ listId: list.id, contactId })),
      skipDuplicates: true,
    });

    // Log events
    await prisma.contactEvent.createMany({
      data: contactIds.map(contactId => ({
        contactId,
        type: "LIST_ADDED",
        metadata: { listId: list.id, listName: list.name },
      })),
      skipDuplicates: true,
    });

    const updated = await prisma.list.findUnique({
      where: { id: list.id },
      include: { _count: { select: { contacts: true } } },
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur ajout contacts" });
  }
});

// ─── DELETE /contact-lists/:id/contacts ────────────────────────────────────────
// Retirer des contacts d'une liste
router.delete("/:id/contacts", async (req, res) => {
  try {
    const list = await prisma.list.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!list) return res.status(404).json({ error: "Liste introuvable" });

    const { contactIds = [] } = req.body;
    if (!contactIds.length) return res.status(400).json({ error: "Aucun contact fourni" });

    await prisma.contactListMember.deleteMany({
      where: { listId: list.id, contactId: { in: contactIds } },
    });

    // Log events
    await prisma.contactEvent.createMany({
      data: contactIds.map(contactId => ({
        contactId,
        type: "LIST_REMOVED",
        metadata: { listId: list.id, listName: list.name },
      })),
      skipDuplicates: true,
    });

    res.json({ message: "Contacts retirés de la liste" });
  } catch (err) {
    res.status(500).json({ error: "Erreur retrait contacts" });
  }
});

module.exports = router;