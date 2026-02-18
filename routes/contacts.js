// routes/contacts.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authMiddleware } = require("../middleware/auth");

const prisma = new PrismaClient();
router.use(authMiddleware);

// ─── POST /contacts/bulk/delete ── AVANT /:id ──────────────────────────────────
router.post("/bulk/delete", async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0)
      return res.status(400).json({ error: "IDs invalides" });

    const result = await prisma.contact.deleteMany({
      where: { id: { in: contactIds }, userId: req.user.id },
    });
    res.json({ deleted: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur suppression en masse" });
  }
});

// ─── POST /contacts/import ── AVANT /:id ───────────────────────────────────────
router.post("/import", async (req, res) => {
  try {
    const uid = req.user.id;
    let rows = [];
    const listId = req.body.listId || null;

    if (Array.isArray(req.body.contacts) && req.body.contacts.length > 0) {
      rows = req.body.contacts;
    } else if (typeof req.body.csv === "string" && req.body.csv.trim()) {
      const lines = req.body.csv.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return res.status(400).json({ error: "CSV vide ou sans données" });
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["]/g, ""));
      rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return {
          email:     obj.email || obj.mail || "",
          firstName: obj.firstname || obj.prenom || obj.first || "",
          lastName:  obj.lastname  || obj.nom    || obj.last  || "",
          phone:     obj.phone || obj.telephone  || obj.tel   || "",
          company:   obj.company || obj.entreprise || obj.societe || "",
          tags:      obj.tags || obj.tag || "",
        };
      }).filter(r => r.email);
    } else {
      return res.status(400).json({ error: "Aucun contact à importer" });
    }

    if (!rows.length) return res.status(400).json({ error: "Aucun contact valide trouvé" });

    let created = 0, skipped = 0;

    for (const row of rows) {
      if (!row.email) { skipped++; continue; }
      try {
        const existing = await prisma.contact.findFirst({
          where: { email: row.email.toLowerCase().trim(), userId: uid }
        });

        if (existing) {
          if (listId) {
            await prisma.contactListMember.upsert({
              where: { contactId_listId: { contactId: existing.id, listId } },
              create: { contactId: existing.id, listId },
              update: {},
            });
          }
          skipped++;
          continue;
        }

        const tags = row.tags
          ? String(row.tags).split(";").map(t => t.trim()).filter(Boolean)
          : [];

        const contact = await prisma.contact.create({
          data: {
            userId: uid,
            email:     row.email.toLowerCase().trim(),
            firstName: row.firstName || null,
            lastName:  row.lastName  || null,
            phone:     row.phone     || null,
            company:   row.company   || null,
            tags,
            source: "import",
            ...(listId ? { lists: { create: [{ listId }] } } : {}),
          },
        });

        await prisma.contactEvent.create({
          data: {
            contactId: contact.id,
            type: "CONTACT_CREATED",
            metadata: { source: "import", listId: listId || undefined },
          },
        });
        created++;
      } catch (e) {
        console.error("Import row error:", e.message, "| row:", JSON.stringify(row));
        skipped++;
      }
    }

    res.json({ created, skipped, total: rows.length });
  } catch (err) {
    console.error("❌ Import global error:", err.message, err.stack);
    res.status(500).json({ error: err.message || "Erreur import" });
  }
});

// ─── GET /contacts/stats/overview ─────────────────────────────────────────────
router.get("/stats/overview", async (req, res) => {
  try {
    const uid = req.user.id;
    const [total, active, unsubscribed, bounced, complained, blocked] = await Promise.all([
      prisma.contact.count({ where: { userId: uid } }),
      prisma.contact.count({ where: { userId: uid, status: "ACTIVE" } }),
      prisma.contact.count({ where: { userId: uid, status: "UNSUBSCRIBED" } }),
      prisma.contact.count({ where: { userId: uid, status: "BOUNCED" } }),
      prisma.contact.count({ where: { userId: uid, status: "COMPLAINED" } }),
      prisma.contact.count({ where: { userId: uid, status: "BLOCKED" } }),
    ]);
    res.json({ total, active, unsubscribed, bounced, complained, blocked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur stats" });
  }
});

// ─── GET /contacts ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const uid = req.user.id;
    const { search = "", status = "", page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      userId: uid,
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { email:     { contains: search, mode: "insensitive" } },
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName:  { contains: search, mode: "insensitive" } },
          { company:   { contains: search, mode: "insensitive" } },
        ],
      } : {}),
    };

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: "desc" },
        include: {
          lists: {
            include: { list: { select: { id: true, name: true } } },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      contacts,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur liste contacts" });
  }
});

// ─── GET /contacts/:id ─────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        lists: { include: { list: true } },
        events: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });
    if (!contact) return res.status(404).json({ error: "Contact introuvable" });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: "Erreur" });
  }
});

// ─── POST /contacts ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const uid = req.user.id;
    const {
      email, firstName, lastName, phone,
      company, tags = [], listIds = [], customFields,
    } = req.body;

    if (!email) return res.status(400).json({ error: "Email requis" });

    const existing = await prisma.contact.findFirst({ where: { email, userId: uid } });
    if (existing) return res.status(409).json({ error: "Ce contact existe déjà" });

    const contact = await prisma.contact.create({
      data: {
        userId: uid,
        email,
        firstName,
        lastName,
        phone,
        company,
        tags,
        customFields,
        source: "manual",
        ...(listIds.length > 0
          ? { lists: { create: listIds.map(listId => ({ listId })) } }
          : {}),
      },
      include: { lists: { include: { list: true } } },
    });

    await prisma.contactEvent.create({
      data: {
        contactId: contact.id,
        type: "CONTACT_CREATED",
        metadata: { source: "manual" },
      },
    });

    res.status(201).json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur création" });
  }
});

// ─── PUT /contacts/:id ─────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const uid = req.user.id;
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: uid },
    });
    if (!contact) return res.status(404).json({ error: "Contact introuvable" });

    const {
      email, firstName, lastName, phone,
      company, tags, status, customFields, listIds,
    } = req.body;

    // Mise à jour des listes si fournie
    if (Array.isArray(listIds)) {
      await prisma.contactListMember.deleteMany({ where: { contactId: contact.id } });
      if (listIds.length > 0) {
        await prisma.contactListMember.createMany({
          data: listIds.map(listId => ({ contactId: contact.id, listId })),
          skipDuplicates: true,
        });
      }
    }

    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: { email, firstName, lastName, phone, company, tags, status, customFields },
      include: { lists: { include: { list: true } } },
    });

    await prisma.contactEvent.create({
      data: { contactId: contact.id, type: "CONTACT_UPDATED" },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur mise à jour" });
  }
});

// ─── DELETE /contacts/:id ──────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!contact) return res.status(404).json({ error: "Contact introuvable" });

    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ message: "Contact supprimé" });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression" });
  }
});

// ─── POST /contacts/bulk/delete ────────────────────────────────────────────────
router.post("/bulk/delete", async (req, res) => {
  try {
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0)
      return res.status(400).json({ error: "IDs invalides" });

    const result = await prisma.contact.deleteMany({
      where: { id: { in: contactIds }, userId: req.user.id },
    });
    res.json({ deleted: result.count });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression en masse" });
  }
});

// ─── POST /contacts/import ─────────────────────────────────────────────────────
router.post("/import", async (req, res) => {
  try {
    const uid = req.user.id;

    // Accepte soit { contacts: [...], listId } soit { csv: "...", listId }
    let rows = [];
    const listId = req.body.listId || null;

    if (Array.isArray(req.body.contacts) && req.body.contacts.length > 0) {
      // Format JSON tableau (envoyé par ImportModal / ImportToListModal)
      rows = req.body.contacts;
    } else if (typeof req.body.csv === "string" && req.body.csv.trim()) {
      // Format CSV brut (legacy)
      const lines = req.body.csv.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) return res.status(400).json({ error: "CSV vide ou sans données" });
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["]/g, ""));
      rows = lines.slice(1).map(line => {
        const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
        return {
          email:     obj.email || obj.mail || "",
          firstName: obj.firstname || obj.prenom || obj.first || "",
          lastName:  obj.lastname  || obj.nom    || obj.last  || "",
          phone:     obj.phone || obj.telephone  || obj.tel   || "",
          company:   obj.company || obj.entreprise || obj.societe || "",
          tags:      obj.tags || obj.tag || "",
        };
      }).filter(r => r.email);
    } else {
      return res.status(400).json({ error: "Aucun contact à importer (fournir 'contacts' en JSON ou 'csv' en texte)" });
    }

    if (rows.length === 0)
      return res.status(400).json({ error: "Aucun contact valide trouvé" });

    let created = 0, skipped = 0;

    for (const row of rows) {
      if (!row.email) { skipped++; continue; }
      try {
        const existing = await prisma.contact.findFirst({
          where: { email: row.email.toLowerCase().trim(), userId: uid }
        });
        if (existing) {
          // Si listId fourni, on ajoute quand même à la liste même si contact existant
          if (listId) {
            await prisma.contactListMember.upsert({
              where: { contactId_listId: { contactId: existing.id, listId } },
              create: { contactId: existing.id, listId },
              update: {},
            });
          }
          skipped++;
          continue;
        }

        const tags = row.tags
          ? String(row.tags).split(";").map(t => t.trim()).filter(Boolean)
          : [];

        const contact = await prisma.contact.create({
          data: {
            userId: uid,
            email:     row.email.toLowerCase().trim(),
            firstName: row.firstName || row.prenom     || null,
            lastName:  row.lastName  || row.nom        || null,
            phone:     row.phone     || row.telephone  || null,
            company:   row.company   || row.entreprise || null,
            tags,
            source: "import",
            ...(listId ? { lists: { create: [{ listId }] } } : {}),
          },
        });

        await prisma.contactEvent.create({
          data: {
            contactId: contact.id,
            type: "CONTACT_CREATED",
            metadata: { source: "import", listId: listId || undefined },
          },
        });
        created++;
      } catch (e) {
        console.error("Import row error:", e.message, "| row:", JSON.stringify(row));
        skipped++;
      }
    }

    res.json({ created, skipped, total: rows.length });
  } catch (err) {
    console.error("❌ Import global error:", err.message, err.stack);
    res.status(500).json({ error: err.message || "Erreur import" });
  }
});

module.exports = router;