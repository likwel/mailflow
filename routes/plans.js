const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// const { authMiddleware } = require("../middleware/authMiddleware");

// router.use(authMiddleware);

// GET /plans - Liste tous les plans disponibles
router.get("/", async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true, isCustom: false },
      orderBy: { price: "asc" },
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des plans" });
  }
});

// POST /plans/custom - Demander un plan personnalisé
router.post("/custom", async (req, res) => {
  const { basePlanId, emailsPerMonth, maxBulkSend, message } = req.body;

  try {
    // Vérifier si l'utilisateur a déjà une demande en cours
    const existing = await prisma.customPlan.findUnique({
      where: { userId: req.user.id },
    });

    if (existing && existing.status === "PENDING") {
      return res.status(400).json({ error: "Vous avez déjà une demande en cours" });
    }

    const basePlan = await prisma.plan.findUnique({ where: { id: basePlanId } });
    if (!basePlan) {
      return res.status(404).json({ error: "Plan de base non trouvé" });
    }

    // Calculer le prix (logique personnalisée)
    const pricePerEmail = basePlan.price / basePlan.emailsPerMonth;
    const calculatedPrice = Math.ceil(emailsPerMonth * pricePerEmail);

    const customPlan = await prisma.customPlan.create({
      data: {
        userId: req.user.id,
        basePlanId,
        emailsPerMonth,
        maxBulkSend,
        price: calculatedPrice,
        features: [`${emailsPerMonth} emails/mois`, `${maxBulkSend} emails par envoi`],
      },
    });

    res.json(customPlan);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la création de la demande" });
  }
});

// GET /plans/custom/status - Statut de la demande personnalisée
router.get("/custom/status", async (req, res) => {
  try {
    const customPlan = await prisma.customPlan.findUnique({
      where: { userId: req.user.id },
      include: { basePlan: true },
    });

    res.json(customPlan || null);
  } catch (err) {
    res.status(500).json({ error: "Erreur" });
  }
});

module.exports = router;